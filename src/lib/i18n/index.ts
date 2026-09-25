// Sprachauswahl, gemeinsam für Server und Browser. Welche Sprache gilt, entscheidet
// `server.ts`; im Browser kommt sie über den SpracheProvider an.

import { de, type Woerterbuch } from "./de";
import { en } from "./en";
import type { Kategorie } from "@/lib/kategorien";

export type { Woerterbuch };

export const SPRACHEN = ["de", "en"] as const;
export type Sprache = (typeof SPRACHEN)[number];

/** Name des Cookies, in dem die Wahl unter „Mehr" liegt. */
export const SPRACH_COOKIE = "bf_sprache";

const WOERTERBUECHER: Record<Sprache, Woerterbuch> = { de, en };

export function istSprache(wert: unknown): wert is Sprache {
  return typeof wert === "string" && (SPRACHEN as readonly string[]).includes(wert);
}

export function woerterbuch(sprache: Sprache): Woerterbuch {
  return WOERTERBUECHER[sprache];
}

/**
 * Anzeigename einer Kategorie. In der Datenbank steht immer der deutsche Schlüssel — so
 * bleiben Filter-Adressen, CSV und bestehende Daten unabhängig von der Sprache. Eine
 * Kategorie, die es in der Liste nicht mehr gibt, erscheint so, wie sie gespeichert ist.
 */
export function kategorieName(t: Woerterbuch, kategorie: string): string {
  return t.kategorien[kategorie as Kategorie] ?? kategorie;
}
