// Erkennt eine schon vergebene Serie im Titel eines neuen Buchs -- kein server-only, weil die
// Funktion sowohl clientseitig (SerienVorschlag.tsx, beim Erfassen) als auch ganz ohne
// Datenbankzugriff läuft.
//
// Bewusst kein Abgleich über eine externe API: buchapi.ts zeigt schon, dass weder Google Books
// noch Open Library ein zuverlässiges Serienfeld liefern. Der eigene Katalog ist die einzige
// Quelle, der man hier trauen kann.

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
