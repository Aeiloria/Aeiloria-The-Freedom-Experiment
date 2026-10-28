import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';
import {
  AGENTID_ISSUER,
  AUTHORIZE_ENDPOINT,
  PENDING_TTL_MS,
  TOKEN_ENDPOINT,
  USERINFO_ENDPOINT,
  assessPending,
  basicCredentials,
  buildAuthorizeUrl,
  openPayload,
  pkceS256Challenge,
  readAgentIdConfig,
  resolveScopes,
  sealPayload,
  type PendingLogin,
  type VerifyIdToken,
} from './agentid.ts';
import { registerAgentIdRoutes } from './agentidRoutes.ts';

const REDIRECT_URI = 'http://localhost:3000/api/auth/agentid/callback';

test('PKCE S256 matches the RFC 7636 appendix B vector', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(await pkceS256Challenge(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('authorize URL is code flow with S256 PKCE and no refresh scope', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  const url = new URL(buildAuthorizeUrl({
    clientId: 'https://aeiloria.example',
    redirectUri: 'https://aeiloria.example/api/auth/agentid/callback',
    scopes: 'openid email profile',
    state: 'state-1',
    nonce: 'nonce-1',
    codeChallenge: await pkceS256Challenge(verifier),
    loginHint: 'scout@example.agentmail.to',
  }));

  assert.equal(`${url.origin}${url.pathname}`, AUTHORIZE_ENDPOINT);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  assert.equal(url.searchParams.get('scope'), 'openid email profile');
  assert.equal(url.searchParams.get('login_hint'), 'scout@example.agentmail.to');
  assert.equal(url.searchParams.has('offline_access'), false);
  assert.equal(url.searchParams.get('response_type')?.includes('token'), false);
});

test('owner scopes are kept for a registered client and dropped for an open client', () => {
  assert.equal(
    resolveScopes('openid email profile owner_profile owner_email', true),
    'openid email profile owner_profile owner_email',
  );
  assert.equal(
    resolveScopes('openid email profile owner_profile owner_email', false),
    'openid email profile',
  );
});

test('client_secret_basic encodes the secret so a colon survives', () => {
  assert.equal(atob(basicCredentials('id', 'a:b')), 'id:a%3Ab');
});

test('config rejects placeholders, http open clients, and mismatched open-client origins', () => {
  assert.equal(readAgentIdConfig({ AGENTID_CLIENT_ID: 'YOUR_AGENTID_CLIENT_ID' }).ok, false);

  const httpClient = readAgentIdConfig({
    AGENTID_CLIENT_ID: 'http://localhost:3000',
    AGENTID_REDIRECT_URI: REDIRECT_URI,
  });
  assert.equal(httpClient.ok, false);
  if (!httpClient.ok) assert.equal(httpClient.error, 'open_client_requires_https');

  const mismatched = readAgentIdConfig({
    AGENTID_CLIENT_ID: 'https://aeiloria.example',
    AGENTID_REDIRECT_URI: REDIRECT_URI,
  });
  assert.equal(mismatched.ok, false);
  if (!mismatched.ok) assert.equal(mismatched.error, 'invalid_redirect_uri');

  const fromAppUrl = readAgentIdConfig({
    AGENTID_CLIENT_ID: 'registered-client',
    AGENTID_CLIENT_SECRET: 'secret',
    APP_URL: 'https://aeiloria.example',
  });
  assert.equal(fromAppUrl.ok, true);
  if (fromAppUrl.ok) {
    assert.equal(fromAppUrl.config.redirectUri, 'https://aeiloria.example/api/auth/agentid/callback');
    assert.equal(fromAppUrl.config.authMethod, 'client_secret_basic');
  }
});

test('callback state is single-use, kept for 10 minutes, and requires the issuer', () => {
  const pending: PendingLogin = {
    state: 'state-1',
    codeVerifier: 'verifier',
    nonce: 'nonce',
    redirectUri: REDIRECT_URI,
    createdAt: 1_000,
    returnTo: '/',
  };
  const params = { code: 'code-1', state: 'state-1', iss: AGENTID_ISSUER };

  assert.equal(assessPending(pending, params, pending.createdAt + PENDING_TTL_MS).ok, true);
  const expired = assessPending(pending, params, pending.createdAt + PENDING_TTL_MS + 1);
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.error, 'state_expired');

  const wrongIss = assessPending(pending, { ...params, iss: 'https://evil.example' }, pending.createdAt);
  assert.equal(wrongIss.ok, false);
  if (!wrongIss.ok) assert.equal(wrongIss.error, 'iss_mismatch');

  const missing = assessPending(undefined, params, pending.createdAt);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error, 'state_mismatch');
});

test('sealed transaction cookies reject tampering', async () => {
  const pending: PendingLogin = {
    state: 'state-1',
    codeVerifier: 'verifier',
    nonce: 'nonce',
    redirectUri: REDIRECT_URI,
    createdAt: 5,
    returnTo: '/',
  };
  const sealed = await sealPayload(pending, 'secret');
  const opened = await openPayload(sealed, 'secret');
  assert.equal(opened.ok, true);

  const [data, signature] = sealed.split('.');
  const tampered = await openPayload(`${data}x.${signature}`, 'secret');
  assert.equal(tampered.ok, false);
});

test('callback rejects a mismatched issuer without exchanging the code', async () => {
  let fetches = 0;
  const now = 10_000;
  const { base, close } = await listen(expressApp({
    env: registeredEnv(),
    now: () => now,
    fetchImpl: async () => {
      fetches += 1;
      throw new Error('token endpoint should not be called');
    },
  }));
  try {
    const login = await fetch(`${base}/api/auth/agentid/login`, { redirect: 'manual' });
    assert.equal(login.status, 302);
    const location = new URL(login.headers.get('location') || '');
    assert.equal(location.origin + location.pathname, AUTHORIZE_ENDPOINT);
    assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
    const state = location.searchParams.get('state');
    const callback = await fetch(
      `${base}/api/auth/agentid/callback?code=abc&state=${state}&iss=https://evil.example`,
      { redirect: 'manual', headers: { cookie: cookieHeader(login) } },
    );
    assert.equal(callback.status, 302);
    assert.match(callback.headers.get('location') || '', /auth_error=iss_mismatch/);
    assert.equal(fetches, 0);

    const replay = await fetch(
      `${base}/api/auth/agentid/callback?code=abc&state=${state}&iss=${encodeURIComponent(AGENTID_ISSUER)}`,
      { redirect: 'manual', headers: { cookie: cookieHeader(login) } },
    );
    assert.match(replay.headers.get('location') || '', /auth_error=state_mismatch/);
    assert.equal(fetches, 0);
  } finally {
    await close();
  }
});

test('callback keeps state for 10 minutes and then expires it', async () => {
  let clock = 50_000;
  const { base, close } = await listen(expressApp({
    env: registeredEnv(),
    now: () => clock,
    fetchImpl: async () => {
      throw new Error('token endpoint should not be called');
    },
  }));
  try {
    const login = await fetch(`${base}/api/auth/agentid/login`, { redirect: 'manual' });
    const state = new URL(login.headers.get('location') || '').searchParams.get('state');
    clock += PENDING_TTL_MS + 1;
    const callback = await fetch(
      `${base}/api/auth/agentid/callback?code=abc&state=${state}&iss=${encodeURIComponent(AGENTID_ISSUER)}`,
      { redirect: 'manual', headers: { cookie: cookieHeader(login) } },
    );
    assert.match(callback.headers.get('location') || '', /auth_error=state_expired/);
  } finally {
    await close();
  }
});

test('a successful callback exchanges the code once and starts a session', async () => {
  const calls: string[] = [];
  let tokenBody = '';
  let tokenAuth = '';
  const verifyIdToken: VerifyIdToken = async (_token, expected) => ({
    sub: 'agent-sub-123',
    nonce: expected.nonce,
    email: 'scout@example.agentmail.to',
    email_verified: true,
  });
  const { base, close } = await listen(expressApp({
    env: registeredEnv(),
    verifyIdToken,
    fetchImpl: async (input, init) => {
      const url = String(input);
      calls.push(url);
      if (url === TOKEN_ENDPOINT) {
        tokenBody = String(init?.body ?? '');
        tokenAuth = new Headers(init?.headers).get('authorization') ?? '';
        return jsonResponse({ id_token: 'id-token', access_token: 'access-token', token_type: 'Bearer' });
      }
      if (url === USERINFO_ENDPOINT) {
        assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer access-token');
        return jsonResponse({
          sub: 'agent-sub-123',
          email: 'scout@example.agentmail.to',
          email_verified: true,
          preferred_username: 'scout',
          owner_email: 'owner@example.com',
        });
      }
      throw new Error(`unexpected ${url}`);
    },
  }));
  try {
    const login = await fetch(`${base}/api/auth/agentid/login`, { redirect: 'manual' });
    const authorize = new URL(login.headers.get('location') || '');
    assert.equal(authorize.searchParams.get('scope'), 'openid email profile owner_email');
    const state = authorize.searchParams.get('state');
    const callback = await fetch(
      `${base}/api/auth/agentid/callback?code=one-time&state=${state}&iss=${encodeURIComponent(AGENTID_ISSUER)}`,
      { redirect: 'manual', headers: { cookie: cookieHeader(login) } },
    );
    assert.equal(callback.status, 302);
    assert.equal(callback.headers.get('location'), '/');
    assert.equal(calls.filter((url) => url === TOKEN_ENDPOINT).length, 1);
    assert.match(tokenBody, /grant_type=authorization_code/);
    assert.match(tokenBody, /code=one-time/);
    assert.doesNotMatch(tokenBody, /client_secret/);
    assert.match(tokenAuth, /^Basic /);
    assert.equal(atob(tokenAuth.slice('Basic '.length)), 'test-client:test-secret');

    const session = await fetch(`${base}/api/auth/session`, { headers: { cookie: cookieHeader(callback) } });
    const body = await session.json() as { authenticated: boolean; agent: { sub: string; preferredUsername?: string; ownerEmail?: string } };
    assert.equal(body.authenticated, true);
    assert.equal(body.agent.sub, 'agent-sub-123');
    assert.equal(body.agent.preferredUsername, 'scout');
    assert.equal(body.agent.ownerEmail, 'owner@example.com');

    const replay = await fetch(
      `${base}/api/auth/agentid/callback?code=one-time&state=${state}&iss=${encodeURIComponent(AGENTID_ISSUER)}`,
      { redirect: 'manual', headers: { cookie: cookieHeader(login) } },
    );
    assert.match(replay.headers.get('location') || '', /auth_error=state_mismatch/);
    assert.equal(calls.filter((url) => url === TOKEN_ENDPOINT).length, 1);

    const loggedOut = await fetch(`${base}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie: cookieHeader(callback) },
    });
    assert.equal(loggedOut.status, 200);
    const after = await fetch(`${base}/api/auth/session`, { headers: { cookie: cookieHeader(loggedOut) } });
    const afterBody = await after.json() as { authenticated: boolean };
    assert.equal(afterBody.authenticated, false);
  } finally {
    await close();
  }
});

test('missing client configuration does not redirect to the issuer', async () => {
  const { base, close } = await listen(expressApp({ env: {} }));
  try {
    const login = await fetch(`${base}/api/auth/agentid/login`, { redirect: 'manual' });
    assert.equal(login.status, 302);
    assert.match(login.headers.get('location') || '', /auth_error=not_configured/);
    assert.equal((login.headers.get('location') || '').includes('auth.agentid.com'), false);
  } finally {
    await close();
  }
});

function registeredEnv(): Record<string, string> {
  return {
    AGENTID_CLIENT_ID: 'test-client',
    AGENTID_CLIENT_SECRET: 'test-secret',
    AGENTID_REDIRECT_URI: REDIRECT_URI,
    AGENTID_SCOPES: 'openid email profile owner_email',
  };
}

function expressApp(options: {
  env: Record<string, string | undefined>;
  now?: () => number;
  fetchImpl?: typeof fetch;
  verifyIdToken?: VerifyIdToken;
}) {
  const app = express();
  registerAgentIdRoutes(app, options);
  return app;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function cookieHeader(response: Response): string {
  return response.headers.getSetCookie().map((value) => value.split(';')[0] ?? '').filter(Boolean).join('; ');
}

async function listen(app: express.Express) {
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    }),
  };
}
