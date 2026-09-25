import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl, generatePkce, generateState, getOidcConfig } from "@/lib/oidc";
import { isDevBypassAllowed } from "@/lib/auth";

const FLOW_COOKIE_MAX_AGE = 300; // 5 Minuten, reicht für den Redirect-Umweg über DSM

export async function GET() {
  const cfg = getOidcConfig();
  if (!cfg) {
    if (isDevBypassAllowed()) {
      // Bewusst eine relative Umleitung statt `new URL("/dev-login", req.url)`: `req.url` trägt
      // die Adresse, an die der Dev-Server gebunden ist — bei `next dev` also localhost. Ein
      // Handy im WLAN landet damit auf einer Adresse, die es dort nicht gibt. Einen relativen
      // Location-Header löst der Browser gegen die tatsächlich aufgerufene Adresse auf.
      return new NextResponse(null, { status: 307, headers: { Location: "/dev-login" } });
    }
    return new NextResponse(
      "SSO ist nicht konfiguriert (OIDC_ISSUER / OIDC_CLIENT_ID / OIDC_CLIENT_SECRET / OIDC_REDIRECT_URI fehlen).",
      { status: 500 }
    );
  }

  const { verifier, challenge } = generatePkce();
  const state = generateState();
  const authorizeUrl = await buildAuthorizeUrl(cfg, state, challenge);

  const store = await cookies();
  const cookieOpts = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "1",
    path: "/",
    maxAge: FLOW_COOKIE_MAX_AGE,
  };
  store.set("oidc_verifier", verifier, cookieOpts);
  store.set("oidc_state", state, cookieOpts);

  return NextResponse.redirect(authorizeUrl);
}
