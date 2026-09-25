import "server-only";
import crypto from "node:crypto";

// Minimaler OIDC Authorization-Code-Client (mit PKCE) gegen den Synology "SSO Server".
// Übernommen aus Kochkiste, dort aus der Haushaltsrechnung — seit Juli 2026 im Einsatz.
//
// Kein externes SDK, damit keine Abhängigkeit von einer bestimmten openid-client-API-Version
// besteht: Der Flow ist Standard-OIDC und mit fetch leicht selbst umzusetzen.

export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getOidcConfig(): OidcConfig | null {
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  const redirectUri = process.env.OIDC_REDIRECT_URI;
  if (!issuer || !clientId || !clientSecret || !redirectUri) return null;
  return { issuer: issuer.replace(/\/$/, ""), clientId, clientSecret, redirectUri };
}

type Discovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
};

let discoveryCache: { value: Discovery; issuer: string } | null = null;

async function discover(issuer: string): Promise<Discovery> {
  if (discoveryCache && discoveryCache.issuer === issuer) return discoveryCache.value;
  const res = await fetch(`${issuer}/.well-known/openid-configuration`, { cache: "no-store" });
  if (!res.ok) throw new Error(`OIDC-Discovery fehlgeschlagen (${res.status})`);
  const value = (await res.json()) as Discovery;
  discoveryCache = { value, issuer };
  return value;
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export async function buildAuthorizeUrl(
  cfg: OidcConfig,
  state: string,
  codeChallenge: string
): Promise<string> {
  const { authorization_endpoint } = await discover(cfg.issuer);
  const url = new URL(authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeCode(
  cfg: OidcConfig,
  code: string,
  verifier: string
): Promise<{ access_token: string; id_token?: string }> {
  const { token_endpoint } = await discover(cfg.issuer);
  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Token-Austausch fehlgeschlagen (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function fetchUserInfo(
  cfg: OidcConfig,
  accessToken: string
): Promise<Record<string, unknown>> {
  const { userinfo_endpoint } = await discover(cfg.issuer);
  const res = await fetch(userinfo_endpoint, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Userinfo-Abruf fehlgeschlagen (${res.status})`);
  return res.json();
}
