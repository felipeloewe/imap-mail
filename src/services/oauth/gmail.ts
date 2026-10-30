import { getEnvOptional } from "@/lib/env";

/**
 * Gmail OAuth path — configured via env only (GMAIL_CLIENT_ID / SECRET / REDIRECT_URI).
 * Stubbed for Fase 3 scaffold: returns auth URL shape and documents token exchange.
 * Never pass client secrets on argv.
 */
export function isGmailOAuthConfigured(): boolean {
  const env = getEnvOptional();
  return Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET);
}

export function buildGmailAuthUrl(state: string): {
  url: string;
  configured: boolean;
} {
  const env = getEnvOptional();
  const clientId = env.GMAIL_CLIENT_ID ?? "";
  const redirectUri =
    env.GMAIL_REDIRECT_URI ??
    "http://localhost:3001/api/oauth/gmail/callback";

  if (!clientId) {
    return {
      configured: false,
      url: "",
    };
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return {
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  };
}

export type GmailTokenStub = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  stub: true;
};

/**
 * Exchange authorization code for tokens.
 * Scaffold stub: does not call Google unless credentials are present;
 * production will POST to oauth2.googleapis.com/token using env secrets.
 */
export async function exchangeGmailCode(
  code: string,
): Promise<GmailTokenStub> {
  const env = getEnvOptional();
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET) {
    return {
      stub: true,
      error: "Gmail OAuth not configured (set GMAIL_CLIENT_ID/SECRET in env)",
    };
  }

  // Placeholder for live exchange — keep secrets in env, not argv.
  void code;
  return {
    stub: true,
    error:
      "Token exchange not yet enabled in scaffold; wire googleapis token endpoint next.",
  };
}
