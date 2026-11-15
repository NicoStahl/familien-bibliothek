// Ein MARC21-XML-Datensatz der Deutschen Nationalbibliothek, flach zerlegt.
//
// Eigene Datei ohne Importe, aus zwei Gründen: buchapi.ts ist "server-only" und zieht Zod nach
// sich, und das Regelwerk der Kategorie-Vorschläge samt seinen Tests soll den Parser nutzen
// können, ohne all das mitzuladen. Die Tests laufen mit dem nackten Node (`npm test`), und der
// löst keine Pfad-Aliasse und keine Importe ohne Endung auf.
//
// Ein XML-Parser als Abhängigkeit lohnt für die paar flachen Felder nicht.

/** Ein MARC-Datenfeld: Kennzahl, zweiter Indikator, Unterfelder in Reihenfolge. */
export type MarcFeld = { tag: string; ind2: string; unter: { code: string; wert: string }[] };

/** Die fünf vordefinierten XML-Entitäten und numerische Zeichenreferenzen. */
export function xmlText(roh: string): string {
  return roh
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dez: string) => String.fromCodePoint(Number(dez)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Die Datenfelder eines MARC21-XML-Datensatzes.
 *
 * Katalogdaten klammern Artikel, die beim Sortieren übersprungen werden, mit den Steuerzeichen
 * U+0098/U+009C ein („Die Lügen der Frauen" kommt als `&#152;Die&#156; Lügen der Frauen`) —
 * unsichtbar, aber sie würden Suche und Serienabgleich zwischen zwei Wörtern zerschneiden.
 */
export function marcFelder(xml: string): MarcFeld[] {
  return [
    ...xml.matchAll(/<datafield tag="(\d{3})" ind1="." ind2="(.)">([\s\S]*?)<\/datafield>/g),
  ].map(([, tag, ind2, inhalt]) => ({
    tag,
    ind2,
    unter: [...inhalt.matchAll(/<subfield code="(\w)">([^<]*)<\/subfield>/g)].map(([, code, wert]) => ({
      code,
      wert: xmlText(wert).replace(/[\u0098\u009c¬]/g, "").trim(),
    })),
  }));
}

/** Das erste nicht leere Unterfeld mit diesem Code. */
export function unterfeld(feld: MarcFeld | undefined, code: string): string | undefined {
  return feld?.unter.find((u) => u.code === code)?.wert || undefined;
}
