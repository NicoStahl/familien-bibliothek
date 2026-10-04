// Erkennt eine schon vergebene Serie und die Bandnummer eines neuen Buchs -- kein server-only,
// weil die Funktionen clientseitig (SerienVorschlag.tsx, beim Erfassen) und ganz ohne
// Datenbankzugriff laufen.
//
// Zwei Stufen, in dieser Rangfolge: Steckt der Serienname im Titel, ist das die stärkste
// Auskunft. Sonst hilft der Autor, wenn er im Katalog in genau einer Serie vorkommt (seit
// 04.10.2026).
//
// Bewusst kein Seriennamen aus einer externen Quelle, am 04.10.2026 nachgeprüft: Die DNB führt
// nur Verlagsreihen („dtv ; 25261"), Open Library nur übersetzte Bestseller und die unter
// englischem Namen („Diary of a Wimpy Kid" statt „Gregs Tagebuch"), Wikidata kennt die deutschen
// ISBNs nicht. Der eigene Katalog ist die einzige Quelle für den Namen, der hier gilt. Nur die
// Bandnummer darf von außen kommen (`bandAusOpenLibrary` in buchapi.ts) — eine Zahl hat keine
// Schreibweise.

/** Zeichen, die in einem regulären Ausdruck etwas bedeuten und deshalb escaped werden müssen. */
function alsMuster(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Serien unter dieser Länge sind zu unspezifisch -- sie träfen auf fast jeden Titel. */
const MINDESTLAENGE = 3;

/**
 * Sucht unter den schon vergebenen Serien diejenige, die als eigenes Wort im Titel vorkommt.
 *
 * Wortgrenzen über Unicode-Eigenschaften (`\p{L}`/`\p{N}` mit `u`-Flag) statt `\b`: Das native
 * `\b` kennt nur ASCII-Wortzeichen, ein "Ärger" würde die Grenze mitten im Umlaut ziehen -- genau
 * das Problem, das `klein()` in db.ts für den SQL-Vergleich schon löst.
 *
 * Passen mehrere Serien, gewinnt die längste (spezifischste): Bei den Serien "Star Wars" und
 * "Star Wars: X-Wing" im Titel "Star Wars: X-Wing 3" ist Letzteres die bessere Auskunft.
 */
export function erkenneSerie(titel: string, serien: string[]): string | null {
  const klein = titel.toLowerCase();
  let bester: string | null = null;

  for (const serie of serien) {
    const name = serie.trim();
    if (name.length < MINDESTLAENGE) continue;

    const muster = new RegExp(
      `(?<![\\p{L}\\p{N}])${alsMuster(name.toLowerCase())}(?![\\p{L}\\p{N}])`,
      "u"
    );
    if (muster.test(klein) && (!bester || name.length > bester.length)) {
      bester = serie;
    }
  }

  return bester;
}

/**
 * Vergleichsschlüssel für einen Autorennamen: „J. K. Rowling", „J.K. Rowling" und „j k rowling"
 * werden gleich. Die Quellen setzen Initialen und Leerzeichen unterschiedlich (DNB mit
 * Leerzeichen, Google ohne), und die Schreibweise im Katalog hängt davon ab, woher ein Buch kam.
 */
export function autorSchluessel(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Mehrere Autoren stehen kommagetrennt in einem Feld („Federico Italiano, Michael Krüger"). */
export function autorenSchluessel(autor: string): string[] {
  return autor.split(",").map(autorSchluessel).filter(Boolean);
}

/** Je Autorenschlüssel die Serien, in denen dieser Autor im Katalog vorkommt. */
export type AutorenSerien = Record<string, string[]>;

/**
 * Die Serie, die sich aus dem Autor ergibt — aber nur, wenn es genau eine ist.
 *
 * Die zweite Stufe nach dem Titelabgleich, für Bände, deren Titel den Seriennamen nicht
 * enthält: „Die zwei Türme", „Dumm gelaufen!". Hat derselbe Autor im Katalog Bücher in zwei
 * Serien, wäre jede Wahl geraten, also gibt es dann keinen Vorschlag.
 *
 * Bekannte Schwäche: Ein Autor mit Einzelbänden neben seiner Reihe bekommt die Reihe auch für
 * den Einzelband vorgeschlagen. Das ist eine Vorauswahl, die man mit einem Tipp verwirft.
 */
export function erkenneSerieNachAutor(autor: string, autorenSerien: AutorenSerien): string | null {
  const gefunden = new Set<string>();
  for (const schluessel of autorenSchluessel(autor)) {
    for (const serie of autorenSerien[schluessel] ?? []) gefunden.add(serie);
  }
  return gefunden.size === 1 ? [...gefunden][0] : null;
}

/** Eine Bandnummer zwischen 1 und 999, sonst null — Jahreszahlen sind keine Bände. */
function bandnummer(text: string): number | null {
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

const BAND_WORT =
  /(?<![\p{L}\p{N}])(?:band|bd\.|folge|teil|nr\.|vol\.|volume|book)\s*(\d{1,3})(?!\d)/iu;

/**
 * Die Bandnummer, wie sie im Titel steht: „Band 3", „Folge 12", „Teil 2" — oder direkt hinter
 * dem Seriennamen, „Eragon 4", „Gregs Tagebuch 7 – Dumm gelaufen!".
 *
 * Das Wort muss für sich stehen: „Sammelband 2" ist kein zweiter Band.
 */
export function erkenneBand(titel: string, serie: string | null): number | null {
  const klein = titel.toLowerCase();
  const nachWort = BAND_WORT.exec(klein);
  if (nachWort) return bandnummer(nachWort[1]);

  if (serie && serie.trim().length >= MINDESTLAENGE) {
    const nachSerie = new RegExp(
      `(?<![\\p{L}\\p{N}])${alsMuster(serie.trim().toLowerCase())}\\s*[-–:,.]?\\s*(\\d{1,3})(?![\\p{L}\\p{N}])`,
      "u"
    ).exec(klein);
    if (nachSerie) return bandnummer(nachSerie[1]);
  }
  return null;
}
