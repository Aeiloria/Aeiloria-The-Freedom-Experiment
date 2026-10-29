import type { Express, Request, Response } from 'express';
import {
  AGENTID_ISSUER,
  LOGIN_PATH,
  CALLBACK_PATH,
  PENDING_TTL_MS,
  SESSION_TTL_MS,
  TOKEN_ENDPOINT,
  USERINFO_ENDPOINT,
  type AgentIdConfig,
  type AgentProfile,
  type Env,
  type PendingLogin,
  type VerifyIdToken,
  assessPending,
  basicCredentials,
  buildAuthorizeUrl,
  createPendingLoginStore,
  openPayload,
  parsePending,
  pkceS256Challenge,
  profileFromClaims,
  randomUrlSafe,
  readAgentIdConfig,
  readCookie,
  requestOrigin,
  safeReturnPath,
  sealPayload,
  verifyAgentIdToken,
} from './agentid.ts';

const TXN_COOKIE = 'aeiloria_agentid_txn';
const SESSION_COOKIE = 'aeiloria_agentid';

export type AgentIdRouteDeps = {
  fetchImpl?: typeof fetch;
  verifyIdToken?: VerifyIdToken;
  now?: () => number;
  env?: Env;
};

type SessionTicket = AgentProfile & { exp: number };

function queryString(value: unknown, max = 2048): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}

function isHttps(req: Request): boolean {
  const forwarded = req.headers['x-forwarded-proto'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const proto = raw?.split(',')[0]?.trim() || req.protocol;
  return proto === 'https';
}

function cookieBase(req: Request, path: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isHttps(req),
    path,
  };
}

function redirectError(res: Response, error: string) {
  res.setHeader('cache-control', 'no-store');
  res.redirect(302, `/?auth_error=${error}`);
}

function originOf(req: Request): string | undefined {
  return requestOrigin({
    protocol: req.protocol,
    host: req.get('host') || undefined,
    forwardedProto: req.headers['x-forwarded-proto'],
    forwardedHost: req.headers['x-forwarded-host'],
  });
}

function storedString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 320) return undefined;
  return trimmed;
}

function storedBool(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

function parseSession(value: unknown, now: number): AgentProfile | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const sub = storedString(record, 'sub');
  if (!sub || typeof record.exp !== 'number' || record.exp <= now) return undefined;
  return {
    sub,
    email: storedString(record, 'email'),
    emailVerified: storedBool(record, 'emailVerified'),
    name: storedString(record, 'name'),
    preferredUsername: storedString(record, 'preferredUsername'),
    ownerSub: storedString(record, 'ownerSub'),
    ownerName: storedString(record, 'ownerName'),
    ownerEmail: storedString(record, 'ownerEmail'),
    ownerEmailVerified: storedBool(record, 'ownerEmailVerified'),
    ownerHumanVerified: storedBool(record, 'ownerHumanVerified'),
    ownerHumanId: storedString(record, 'ownerHumanId'),
    actorType: storedString(record, 'actorType'),
    scope: storedString(record, 'scope'),
  };
}

export function registerAgentIdRoutes(app: Express, deps: AgentIdRouteDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const verifyIdToken = deps.verifyIdToken ?? verifyAgentIdToken;
  const now = deps.now ?? Date.now;
  const env = deps.env ?? process.env;
  const pendingStore = createPendingLoginStore();
  const consumedStates = new Map<string, number>();
  const memorySessions = new Map<string, SessionTicket>();

  function claimState(state: string): boolean {
    const cutoff = now() - PENDING_TTL_MS;
    for (const [key, seenAt] of consumedStates) {
      if (seenAt < cutoff) consumedStates.delete(key);
    }
    if (consumedStates.has(state)) return false;
    consumedStates.set(state, now());
    return true;
  }

  function rememberSession(profile: AgentProfile): string {
    const id = randomUrlSafe();
    memorySessions.set(id, { ...profile, exp: now() + SESSION_TTL_MS });
    return id;
  }

  function readMemorySession(id: string): AgentProfile | undefined {
    const ticket = memorySessions.get(id);
    if (!ticket) return undefined;
    if (ticket.exp <= now()) {
      memorySessions.delete(id);
      return undefined;
    }
    const { exp: _exp, ...profile } = ticket;
    return profile;
  }

  app.get(LOGIN_PATH, async (req, res) => {
    const resolved = readAgentIdConfig(env, originOf(req));
    if (!resolved.ok) {
      redirectError(res, resolved.error);
      return;
    }
    const hintedIss = queryString(req.query.iss);
    if (hintedIss && hintedIss !== AGENTID_ISSUER) {
      redirectError(res, 'iss_mismatch');
      return;
    }

    const pending: PendingLogin = {
      state: randomUrlSafe(),
      codeVerifier: randomUrlSafe(),
      nonce: randomUrlSafe(),
      redirectUri: resolved.config.redirectUri,
      createdAt: now(),
      returnTo: safeReturnPath(queryString(req.query.return_to, 512)),
    };
    pendingStore.save(pending);

    if (resolved.config.clientSecret) {
      const sealed = await sealPayload(pending, resolved.config.clientSecret);
      res.cookie(TXN_COOKIE, sealed, { ...cookieBase(req, '/api/auth/agentid'), maxAge: PENDING_TTL_MS });
    }

    const location = buildAuthorizeUrl({
      clientId: resolved.config.clientId,
      redirectUri: resolved.config.redirectUri,
      scopes: resolved.config.scopes,
      state: pending.state,
      nonce: pending.nonce,
      codeChallenge: await pkceS256Challenge(pending.codeVerifier),
      loginHint: queryString(req.query.login_hint, 320),
    });
    res.setHeader('cache-control', 'no-store');
    res.redirect(302, location);
  });

  app.get(CALLBACK_PATH, async (req, res) => {
    const resolved = readAgentIdConfig(env, originOf(req));
    if (!resolved.ok) {
      redirectError(res, resolved.error);
      return;
    }
    const config = resolved.config;
    const params = {
      code: queryString(req.query.code),
      state: queryString(req.query.state),
      iss: queryString(req.query.iss),
    };
    const providerError = queryString(req.query.error, 64);
    res.clearCookie(TXN_COOKIE, cookieBase(req, '/api/auth/agentid'));

    if (params.state && !claimState(params.state)) {
      redirectError(res, 'state_mismatch');
      return;
    }
    const memoryPending = params.state ? pendingStore.take(params.state) : undefined;

    if (providerError) {
      redirectError(res, providerError === 'access_denied' ? 'access_denied' : 'token_exchange_failed');
      return;
    }

    const pending = await loadPending(config, req, memoryPending);
    if (pending === 'bad_cookie') {
      redirectError(res, 'state_mismatch');
      return;
    }

    const assessed = assessPending(pending, params, now());
    if (!assessed.ok) {
      redirectError(res, assessed.error);
      return;
    }

    try {
      const profile = await completeSignIn(config, assessed.pending, assessed.code, fetchImpl, verifyIdToken);
      if (config.clientSecret) {
        const sealed = await sealPayload({ ...profile, exp: now() + SESSION_TTL_MS }, config.clientSecret);
        res.cookie(SESSION_COOKIE, `s.${sealed}`, { ...cookieBase(req, '/'), maxAge: SESSION_TTL_MS });
      } else {
        const id = rememberSession(profile);
        res.cookie(SESSION_COOKIE, `m.${id}`, { ...cookieBase(req, '/'), maxAge: SESSION_TTL_MS });
      }
      res.setHeader('cache-control', 'no-store');
      res.redirect(302, assessed.pending.returnTo || '/');
    } catch (err) {
      const code = err instanceof Error && (err.message === 'userinfo_failed' || err.message === 'invalid_token')
        ? err.message
        : 'token_exchange_failed';
      const status = err instanceof Error && 'status' in err ? (err as { status?: number }).status : undefined;
      console.warn(status ? `AgentID ${code} (status ${status})` : `AgentID ${code}`);
      redirectError(res, code);
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    res.setHeader('cache-control', 'no-store');
    const resolved = readAgentIdConfig(env, originOf(req));
    const configured = resolved.ok;
    const raw = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (!raw) {
      res.json({ authenticated: false, configured });
      return;
    }
    if (raw.startsWith('m.')) {
      const profile = readMemorySession(raw.slice(2));
      if (!profile) {
        res.clearCookie(SESSION_COOKIE, cookieBase(req, '/'));
        res.json({ authenticated: false, configured });
        return;
      }
      res.json({ authenticated: true, configured, agent: profile });
      return;
    }
    if (raw.startsWith('s.') && resolved.ok && resolved.config.clientSecret) {
      const opened = await openPayload(raw.slice(2), resolved.config.clientSecret);
      const profile = opened.ok ? parseSession(opened.payload, now()) : undefined;
      if (!profile) {
        res.clearCookie(SESSION_COOKIE, cookieBase(req, '/'));
        res.json({ authenticated: false, configured });
        return;
      }
      res.json({ authenticated: true, configured, agent: profile });
      return;
    }
    res.json({ authenticated: false, configured });
  });

  app.post('/api/auth/logout', (req, res) => {
    const raw = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (raw?.startsWith('m.')) memorySessions.delete(raw.slice(2));
    res.clearCookie(SESSION_COOKIE, cookieBase(req, '/'));
    res.setHeader('cache-control', 'no-store');
    res.json({ ok: true });
  });
}

async function loadPending(
  config: AgentIdConfig,
  req: Request,
  memoryPending: PendingLogin | undefined,
): Promise<PendingLogin | undefined | 'bad_cookie'> {
  const cookieRaw = readCookie(req.headers.cookie, TXN_COOKIE);
  if (config.clientSecret && cookieRaw) {
    const opened = await openPayload(cookieRaw, config.clientSecret);
    const parsed = opened.ok ? parsePending(opened.payload) : null;
    if (!parsed) return 'bad_cookie';
    return parsed;
  }
  return memoryPending;
}

async function completeSignIn(
  config: AgentIdConfig,
  pending: PendingLogin,
  code: string,
  fetchImpl: typeof fetch,
  verifyIdToken: VerifyIdToken,
): Promise<AgentProfile> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: pending.redirectUri,
    client_id: config.clientId,
    code_verifier: pending.codeVerifier,
  });
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
    accept: 'application/json',
  };
  if (config.authMethod === 'client_secret_post' && config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }
  if (config.authMethod === 'client_secret_basic' && config.clientSecret) {
    headers.authorization = `Basic ${basicCredentials(config.clientId, config.clientSecret)}`;
  }

  let tokenResponse: globalThis.Response;
  try {
    tokenResponse = await fetchImpl(TOKEN_ENDPOINT, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('token_exchange_failed');
  }
  if (!tokenResponse.ok) throw new Error('token_exchange_failed');

  const tokenJson: unknown = await tokenResponse.json();
  if (!tokenJson || typeof tokenJson !== 'object') throw new Error('token_exchange_failed');
  const tokenRecord = tokenJson as Record<string, unknown>;
  const idToken = typeof tokenRecord.id_token === 'string' ? tokenRecord.id_token : '';
  const accessToken = typeof tokenRecord.access_token === 'string' ? tokenRecord.access_token : '';
  if (!idToken || !accessToken) throw new Error('token_exchange_failed');

  let claims: Record<string, unknown>;
  try {
    claims = await verifyIdToken(idToken, { clientId: config.clientId, nonce: pending.nonce });
  } catch {
    throw new Error('invalid_token');
  }
  if (claims.nonce !== pending.nonce) throw new Error('invalid_token');

  let infoResponse: globalThis.Response;
  try {
    infoResponse = await fetchImpl(USERINFO_ENDPOINT, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('userinfo_failed');
  }
  if (!infoResponse.ok) {
    const error = new Error('userinfo_failed');
    (error as Error & { status?: number }).status = infoResponse.status;
    throw error;
  }
  const infoJson: unknown = await infoResponse.json();
  if (!infoJson || typeof infoJson !== 'object') throw new Error('userinfo_failed');
  const userinfo = infoJson as Record<string, unknown>;
  if (userinfo.sub !== claims.sub) throw new Error('invalid_token');

  const profile = profileFromClaims({ ...claims, ...userinfo });
  if (!profile) throw new Error('invalid_token');
  return profile;
}
