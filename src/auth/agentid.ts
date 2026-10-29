/**
 * AgentID relying party helpers.
 *
 * AgentID is an OIDC provider (issuer https://auth.agentid.com). This app has
 * no Clerk, Supabase, Auth0, Descope, Better Auth, or Auth.js stack, so sign-in
 * talks to the issuer directly: authorization code only, PKCE S256, ES256
 * ID tokens, no refresh tokens. Endpoint paths come from the live discovery
 * document; signing keys are fetched from the JWKS URI at verification time.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

export const AGENTID_ISSUER = 'https://auth.agentid.com';
export const AUTHORIZE_ENDPOINT = `${AGENTID_ISSUER}/v0/authorize`;
export const TOKEN_ENDPOINT = `${AGENTID_ISSUER}/v0/token`;
export const USERINFO_ENDPOINT = `${AGENTID_ISSUER}/v0/userinfo`;
export const JWKS_URI = `${AGENTID_ISSUER}/v0/jwks.json`;

export const LOGIN_PATH = '/api/auth/agentid/login';
export const CALLBACK_PATH = '/api/auth/agentid/callback';

/** Codes last 60 seconds, but the waiting page can hold the browser for minutes. */
export const PENDING_TTL_MS = 10 * 60 * 1000;

/** App session after the 10-minute AgentID tokens are discarded. No refresh token exists. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const OWNER_SCOPES = new Set(['owner_profile', 'owner_email']);
const DEFAULT_SCOPES = ['openid', 'email', 'profile'];

const CLIENT_ID_PLACEHOLDERS = new Set([
  'YOUR_AGENTID_CLIENT_ID',
  'MY_AGENTID_CLIENT_ID',
]);

const CLIENT_SECRET_PLACEHOLDERS = new Set([
  'YOUR_AGENTID_CLIENT_SECRET',
  'MY_AGENTID_CLIENT_SECRET',
]);

const REDIRECT_PLACEHOLDERS = new Set([
  'YOUR_AGENTID_REDIRECT_URI',
  'MY_AGENTID_REDIRECT_URI',
]);

const APP_URL_PLACEHOLDERS = new Set(['MY_APP_URL', 'YOUR_APP_URL']);

export type Env = Record<string, string | undefined>;

export type ClientAuthMethod = 'client_secret_basic' | 'client_secret_post' | 'none';

export type AgentIdConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string;
  authMethod: ClientAuthMethod;
};

export type ConfigError = 'not_configured' | 'open_client_requires_https' | 'invalid_redirect_uri';

export type PendingLogin = {
  state: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
  createdAt: number;
  returnTo: string;
};

export type CallbackError =
  | 'missing_state'
  | 'missing_code'
  | 'state_mismatch'
  | 'state_expired'
  | 'iss_mismatch';

export type AgentProfile = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  preferredUsername?: string;
  ownerSub?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerEmailVerified?: boolean;
  ownerHumanVerified?: boolean;
  ownerHumanId?: string;
  actorType?: string;
  scope?: string;
};

export type IdTokenCheck = {
  clientId: string;
  nonce: string;
};

export type VerifyIdToken = (token: string, expected: IdTokenCheck) => Promise<Record<string, unknown>>;

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomUrlSafe(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

/** RFC 7636 S256: base64url(sha256(verifier)), no padding. */
export async function pkceS256Challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

/** RFC 6749 client_secret_basic user:password encoding. Standard base64, not base64url. */
export function oauthFormEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

export function basicCredentials(clientId: string, clientSecret: string): string {
  return btoa(`${oauthFormEncode(clientId)}:${oauthFormEncode(clientSecret)}`);
}

export function resolveScopes(raw: string | undefined, hasClientSecret: boolean): string {
  const source = raw && raw.trim() ? raw.trim().split(/\s+/) : DEFAULT_SCOPES;
  const unique: string[] = [];
  for (const scope of source) {
    if (!scope || unique.includes(scope)) continue;
    if (!hasClientSecret && OWNER_SCOPES.has(scope)) continue;
    unique.push(scope);
  }
  if (!unique.includes('openid')) unique.unshift('openid');
  return unique.join(' ');
}

export function safeReturnPath(value: string | undefined): string {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (value.includes('\\') || value.includes('://')) return '/';
  return value;
}

function blank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

function isHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

export function requestOrigin(input: {
  protocol?: string;
  host?: string;
  forwardedProto?: string | string[];
  forwardedHost?: string | string[];
}): string | undefined {
  const forwardedHost = Array.isArray(input.forwardedHost) ? input.forwardedHost[0] : input.forwardedHost;
  const host = (forwardedHost || input.host || '').split(',')[0]?.trim();
  if (!host) return undefined;
  const forwardedProto = Array.isArray(input.forwardedProto) ? input.forwardedProto[0] : input.forwardedProto;
  const proto = (forwardedProto || input.protocol || 'http').split(',')[0]?.trim() || 'http';
  return `${proto}://${host}`;
}

export function readAgentIdConfig(
  env: Env,
  requestOriginValue?: string,
): { ok: true; config: AgentIdConfig } | { ok: false; error: ConfigError } {
  const clientId = env.AGENTID_CLIENT_ID?.trim();
  if (blank(clientId) || CLIENT_ID_PLACEHOLDERS.has(clientId!)) {
    return { ok: false, error: 'not_configured' };
  }

  const secretRaw = env.AGENTID_CLIENT_SECRET?.trim();
  const clientSecret = blank(secretRaw) || CLIENT_SECRET_PLACEHOLDERS.has(secretRaw!)
    ? undefined
    : secretRaw;

  let redirectUri = env.AGENTID_REDIRECT_URI?.trim();
  if (blank(redirectUri) || REDIRECT_PLACEHOLDERS.has(redirectUri!)) {
    const appUrl = env.APP_URL?.trim();
    if (appUrl && !APP_URL_PLACEHOLDERS.has(appUrl)) {
      const base = isHttpUrl(appUrl);
      if (!base) return { ok: false, error: 'invalid_redirect_uri' };
      redirectUri = new URL(CALLBACK_PATH, base).toString();
    } else if (requestOriginValue) {
      redirectUri = new URL(CALLBACK_PATH, requestOriginValue).toString();
    } else {
      return { ok: false, error: 'not_configured' };
    }
  }

  const redirectUrl = isHttpUrl(redirectUri!);
  if (!redirectUrl) return { ok: false, error: 'invalid_redirect_uri' };

  if (clientId!.startsWith('http://') || clientId!.startsWith('https://')) {
    const clientUrl = isHttpUrl(clientId!);
    if (!clientUrl || clientUrl.protocol !== 'https:') {
      return { ok: false, error: 'open_client_requires_https' };
    }
    if (clientUrl.origin !== redirectUrl.origin) {
      return { ok: false, error: 'invalid_redirect_uri' };
    }
  }

  const requestedMethod = env.AGENTID_CLIENT_AUTH?.trim();
  let authMethod: ClientAuthMethod = 'none';
  if (clientSecret) {
    authMethod = requestedMethod === 'client_secret_post' || requestedMethod === 'none'
      ? requestedMethod
      : 'client_secret_basic';
  }

  return {
    ok: true,
    config: {
      clientId: clientId!,
      clientSecret: authMethod === 'none' ? undefined : clientSecret,
      redirectUri: redirectUrl.toString(),
      scopes: resolveScopes(env.AGENTID_SCOPES, Boolean(clientSecret) && authMethod !== 'none'),
      authMethod,
    },
  };
}

export function buildAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  scopes: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  loginHint?: string;
}): string {
  const url = new URL(AUTHORIZE_ENDPOINT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', input.scopes);
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (input.loginHint) url.searchParams.set('login_hint', input.loginHint);
  return url.toString();
}

export function assessPending(
  pending: PendingLogin | undefined,
  params: { code?: string; state?: string; iss?: string },
  now: number,
): { ok: true; code: string; pending: PendingLogin } | { ok: false; error: CallbackError } {
  if (!params.state) return { ok: false, error: 'missing_state' };
  if (!pending || pending.state !== params.state) return { ok: false, error: 'state_mismatch' };
  if (now - pending.createdAt > PENDING_TTL_MS) return { ok: false, error: 'state_expired' };
  if (params.iss !== AGENTID_ISSUER) return { ok: false, error: 'iss_mismatch' };
  if (!params.code) return { ok: false, error: 'missing_code' };
  return { ok: true, code: params.code, pending };
}

export function createPendingLoginStore() {
  const entries = new Map<string, PendingLogin>();
  return {
    save(entry: PendingLogin) {
      entries.set(entry.state, entry);
    },
    take(state: string): PendingLogin | undefined {
      const entry = entries.get(state);
      if (!entry) return undefined;
      entries.delete(state);
      return entry;
    },
    size() {
      return entries.size;
    },
  };
}

export function parsePending(value: unknown): PendingLogin | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const state = record.state;
  const codeVerifier = record.codeVerifier;
  const nonce = record.nonce;
  const redirectUri = record.redirectUri;
  const createdAt = record.createdAt;
  const returnTo = record.returnTo;
  if (
    typeof state !== 'string' || !state
    || typeof codeVerifier !== 'string' || !codeVerifier
    || typeof nonce !== 'string' || !nonce
    || typeof redirectUri !== 'string' || !redirectUri
    || typeof createdAt !== 'number'
    || !Number.isFinite(createdAt)
    || typeof returnTo !== 'string'
  ) {
    return null;
  }
  return { state, codeVerifier, nonce, redirectUri, createdAt, returnTo };
}

function claimString(claims: Record<string, unknown>, key: string): string | undefined {
  const value = claims[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 320) return undefined;
  return trimmed;
}

function claimBool(claims: Record<string, unknown>, key: string): boolean | undefined {
  const value = claims[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function profileFromClaims(claims: Record<string, unknown>): AgentProfile | null {
  const sub = claimString(claims, 'sub');
  if (!sub) return null;
  return {
    sub,
    email: claimString(claims, 'email'),
    emailVerified: claimBool(claims, 'email_verified'),
    name: claimString(claims, 'name'),
    preferredUsername: claimString(claims, 'preferred_username'),
    ownerSub: claimString(claims, 'owner_sub'),
    ownerName: claimString(claims, 'owner_name'),
    ownerEmail: claimString(claims, 'owner_email'),
    ownerEmailVerified: claimBool(claims, 'owner_email_verified'),
    ownerHumanVerified: claimBool(claims, 'owner_human_verified'),
    ownerHumanId: claimString(claims, 'owner_human_id'),
    actorType: claimString(claims, 'actor_type'),
    scope: claimString(claims, 'scope'),
  };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  const view = new Uint8Array(copy);
  for (let i = 0; i < bytes.length; i++) view[i] = bytes[i] ?? 0;
  return copy;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function sealPayload(payload: unknown, secret: string): Promise<string> {
  const data = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function openPayload(
  token: string,
  secret: string,
): Promise<{ ok: true; payload: unknown } | { ok: false; reason: 'malformed' | 'bad_signature' }> {
  if (token.length > 8192) return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  let signature: Uint8Array;
  try {
    signature = base64UrlToBytes(parts[1]);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(signature),
    new TextEncoder().encode(parts[0]),
  );
  if (!valid) return { ok: false, reason: 'bad_signature' };
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(parts[0]));
    return { ok: true, payload: JSON.parse(json) as unknown };
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}

export async function verifyAgentIdToken(token: string, expected: IdTokenCheck): Promise<Record<string, unknown>> {
  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer: AGENTID_ISSUER,
    audience: expected.clientId,
    algorithms: ['ES256'],
  });
  if (protectedHeader.alg !== 'ES256') {
    throw new Error('unexpected_alg');
  }
  const claims = payload as Record<string, unknown>;
  if (claims.nonce !== expected.nonce) {
    throw new Error('nonce_mismatch');
  }
  return claims;
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}
