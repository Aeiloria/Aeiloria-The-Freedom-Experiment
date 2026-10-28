import React, { useEffect, useState } from 'react';

type AgentSession = {
  sub: string;
  email?: string;
  name?: string;
  preferredUsername?: string;
  ownerEmail?: string;
  ownerName?: string;
};

const ERROR_TEXT: Record<string, string> = {
  not_configured: 'AgentID is not configured yet.',
  open_client_requires_https: 'An open AgentID client needs https and cannot be used on localhost.',
  invalid_redirect_uri: 'The AgentID redirect URI does not match this site.',
  access_denied: 'AgentID sign-in was cancelled.',
  missing_state: 'AgentID sign-in could not be matched. Start it again.',
  missing_code: 'AgentID did not return a sign-in code.',
  state_mismatch: 'AgentID sign-in could not be matched. Start it again.',
  state_expired: 'AgentID sign-in expired. Start it again.',
  iss_mismatch: 'AgentID sign-in was rejected.',
  token_exchange_failed: 'AgentID could not complete sign-in.',
  invalid_token: 'AgentID token could not be verified.',
  userinfo_failed: 'AgentID profile could not be loaded.',
};

export function AgentIdSignIn() {
  const [agent, setAgent] = useState<AgentSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('auth_error');
    if (code) {
      setError(ERROR_TEXT[code] ?? 'AgentID sign-in failed.');
      params.delete('auth_error');
      const next = params.toString();
      const path = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', path);
    }

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data: { authenticated?: boolean; agent?: AgentSession }) => {
        if (data.authenticated && data.agent) setAgent(data.agent);
      })
      .catch(() => {
        // The simulation stays usable when the auth route is unreachable.
      });
  }, []);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAgent(null);
  }

  if (agent) {
    const label = agent.preferredUsername || agent.name || agent.email || agent.sub;
    const detail = [agent.email, agent.ownerEmail ? `Owner ${agent.ownerEmail}` : undefined].filter(Boolean).join(' · ');
    return (
      <div className="flex items-center gap-2">
        <img src="/agentid-icon-white.svg" alt="" width={16} height={16} className="h-4 w-auto shrink-0" />
        <span className="text-[11px] text-slate-300 max-w-[12rem] truncate" title={detail || label}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-[11px] text-rose-300 max-w-[16rem] leading-snug">{error}</span>
      )}
      <a
        href="/api/auth/agentid/login"
        className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 transition-colors"
      >
        <img src="/agentid-icon-white.svg" alt="" width={16} height={16} className="h-4 w-auto shrink-0" />
        <span>Sign in with AgentID</span>
      </a>
    </div>
  );
}
