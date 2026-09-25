import "server-only";
import { cookies, headers } from "next/headers";
import { SPRACH_COOKIE, istSprache, woerterbuch, type Sprache, type Woerterbuch } from "./index";

/**
 * Welche Sprache gilt, in dieser Reihenfolge:
 *
 *  1. die Wahl unter „Mehr" (Cookie) — sie gilt pro Gerät und Browser,
 *  2. SPRACHE aus der .env — die Vorgabe des Haushalts,
 *  3. die Sprache des Browsers (Accept-Language),
 *  4. Deutsch.
 *
 * Die .env steht bewusst VOR dem Browser: Ein Kind mit englisch eingestelltem Tablet soll in
 * einem deutschen Haushalt trotzdem die deutsche Oberfläche sehen, solange niemand
 * ausdrücklich umschaltet.
 */
export async function aktuelleSprache(): Promise<Sprache> {
  const gewaehlt = (await cookies()).get(SPRACH_COOKIE)?.value;
  if (istSprache(gewaehlt)) return gewaehlt;

  const vorgabe = process.env.SPRACHE?.trim().toLowerCase();
  if (istSprache(vorgabe)) return vorgabe;

  const browser = (await headers()).get("accept-language") ?? "";
  for (const teil of browser.split(",")) {
    const kuerzel = teil.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (istSprache(kuerzel)) return kuerzel;
  }

  return "de";
}

export async function texte(): Promise<Woerterbuch> {
  return woerterbuch(await aktuelleSprache());
}
