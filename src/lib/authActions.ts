"use server";

import { redirect } from "next/navigation";
import { clearSession, isDevBypassAllowed, provisionUser, setSession } from "./auth";

/**
 * Meldet in der lokalen Entwicklung ohne SSO an. Es gibt kein Passwort — der Name allein
 * genügt, weil dieser Pfad in Produktion gar nicht existiert (isDevBypassAllowed).
 */
export async function devLogin(formData: FormData): Promise<void> {
  if (!isDevBypassAllowed()) {
    throw new Error("Dev-Login ist in Produktion nicht verfügbar.");
  }
  const username = String(formData.get("username") ?? "").trim();
  if (!username) redirect("/dev-login?fehler=leer");

  const userId = provisionUser(username, null);
  await setSession(userId);
  redirect("/");
}

/**
 * Meldet ab. Beendet nur die Sitzung dieser App; die DSM-Anmeldung selbst bleibt bestehen,
 * ein erneutes Anmelden geht deshalb ohne Passworteingabe durch. Das ist gewollt: Ein
 * Single-Logout aus DSM würde auch Kochkiste und die anderen Apps mit abmelden.
 */
export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
