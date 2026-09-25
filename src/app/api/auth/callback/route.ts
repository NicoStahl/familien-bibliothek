import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, fetchUserInfo, getOidcConfig } from "@/lib/oidc";
import { getCurrentUser, provisionUser, setSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cfg = getOidcConfig();
  // req.url spiegelt hinter dem DSM-Reverse-Proxy im Docker-Container nicht die öffentliche
  // Domain wider, sondern die interne Container-Adresse — eine Adresse, die es außerhalb des
  // Containers nicht gibt. redirectUri aus OIDC_REDIRECT_URI ist die verlässliche Quelle für
  // die öffentliche Origin. Genau dieser Fehler steckte in Riezlern, Haushaltsrechnung und
  // Umsatzbeteiligung; Kochkiste hat ihn als erste App vermieden.
  const origin = cfg ? new URL(cfg.redirectUri).origin : req.nextUrl.origin;

  if (!cfg) return NextResponse.redirect(new URL("/login-error?reason=config", origin));

  // Safari lädt Umleitungsziele spekulativ vor, wodurch dieser Callback auf dem iPhone
  // zweimal angefragt wird — beide Male mit demselben Autorisierungscode. DSM löst den nur
  // einmal ein und beantwortet den zweiten Versuch mit einem nichtssagenden `server_error`;
  // die Anmeldung war zu dem Zeitpunkt längst erfolgreich. Wer schon eine gültige Sitzung
  // mitbringt, braucht den Austausch daher gar nicht erst zu versuchen.
  if (await getCurrentUser()) return NextResponse.redirect(new URL("/", origin));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get("oidc_state")?.value;
  const verifier = store.get("oidc_verifier")?.value;
  store.delete("oidc_state");
  store.delete("oidc_verifier");

  if (!code || !state || !verifier || state !== expectedState) {
    return NextResponse.redirect(new URL("/login-error?reason=state", origin));
  }

  try {
    const tokens = await exchangeCode(cfg, code, verifier);
    const info = await fetchUserInfo(cfg, tokens.access_token);
    const username = String(info.preferred_username ?? info.username ?? info.sub ?? "").trim();
    if (!username) throw new Error("Keine Benutzerkennung in der SSO-Antwort.");
    const displayName = typeof info.name === "string" && info.name ? info.name : null;
    const userId = provisionUser(username, displayName);
    await setSession(userId);
  } catch (err) {
    console.error("OIDC-Callback fehlgeschlagen:", err);
    return NextResponse.redirect(new URL("/login-error?reason=exchange", origin));
  }

  return NextResponse.redirect(new URL("/", origin));
}
