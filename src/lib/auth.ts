import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

const COOKIE = "bf_session";
// 30 Tage. Bewusst lang: Eine vom Startbildschirm gestartete PWA hat auf iOS eine eigene
// Cookie-Partition, der Anmelde-Umweg über Safari ist dort also spürbar. Hier wiegt das
// schwerer als bei Kochkiste — der Scanner wird im Stehen vor dem Regal benutzt, und eine
// Anmeldung mittendrin bricht genau den Arbeitsfluss, für den die App gebaut ist.
const MAX_AGE = 60 * 60 * 24 * 30;

// Wer sich anmelden darf, entscheidet ausschließlich DSM (Synology SSO Server, OIDC).
// Diese App kennt keine eigenen Passwörter, siehe src/lib/oidc.ts.
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // Nur für die lokale Entwicklung. In Produktion MUSS SESSION_SECRET gesetzt sein.
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET ist nicht gesetzt.");
    }
    return "dev-insecure-secret";
  }
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

/**
 * Prüft ein Session-Cookie der Form userId.ausgestelltAm.HMAC.
 *
 * Der Ausstellungszeitpunkt steht bewusst in der signierten Nutzlast und wird serverseitig
 * gegen MAX_AGE geprüft: Das Cookie-maxAge ist nur eine Bitte an den Browser, eine einmal
 * kopierte Cookie-Zeichenkette wäre ohne diese Prüfung unbegrenzt gültig.
 */
function verifyToken(token: string): number | null {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(value);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [idPart, issuedPart] = value.split(".");
  const id = Number(idPart);
  const issuedAt = Number(issuedPart);
  if (!Number.isInteger(id) || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > MAX_AGE * 1000) return null;
  return id;
}

export type SessionUser = {
  id: number;
  username: string;
  display_name: string | null;
  is_admin: number;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = getDb()
    .prepare("SELECT id, username, display_name, is_admin FROM users WHERE id = ?")
    .get(userId) as SessionUser | undefined;
  return user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}

export async function setSession(userId: number): Promise<void> {
  const store = await cookies();
  const payload = `${userId}.${Date.now()}`;
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    // Über reines HTTP im LAN muss secure=false sein, sonst wird das Cookie nie gesendet.
    // Sobald die HTTPS-Reverse-Proxy-Regel steht: COOKIE_SECURE=1 setzen.
    secure: process.env.COOKIE_SECURE === "1",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * Legt einen Nutzer beim ersten SSO-Login an oder aktualisiert seinen Anzeigenamen.
 *
 * Admin kommt aus ADMIN_USERNAMES; ist die Variable leer, wird der zuerst angelegte Nutzer
 * automatisch Admin.
 */
export function provisionUser(username: string, displayName: string | null): number {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as
    | { id: number }
    | undefined;
  if (existing) {
    if (displayName) {
      db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(displayName, existing.id);
    }
    return existing.id;
  }
  const userCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  const isAdmin =
    ADMIN_USERNAMES.length > 0
      ? ADMIN_USERNAMES.includes(username)
        ? 1
        : 0
      : userCount === 0
        ? 1
        : 0;
  const info = db
    .prepare("INSERT INTO users (username, display_name, is_admin) VALUES (?,?,?)")
    .run(username, displayName, isAdmin);
  return Number(info.lastInsertRowid);
}

/** Dev-Login-Umgehung (Formular ohne Passwort) nur außerhalb von Produktion. */
export function isDevBypassAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
