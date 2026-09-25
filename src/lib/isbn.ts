// ISBN-Normalisierung. Läuft auf Server UND im Browser (der Scanner prüft die gelesenen
// Barcodes sofort selbst), deshalb ohne "server-only" und ohne Datenbank-Import.
//
// Grundsatz aus dem Plan: Intern gibt es nur ISBN-13. Sowohl ISBN-10 als auch ISBN-13 werden
// angenommen, gespeichert wird immer die 13-stellige Form. Sonst läge dasselbe Buch je nach
// Aufdruck (ältere Bücher tragen nur die 10-stellige Nummer) zweimal im Katalog, und die
// Duplikat-Warnung liefe ins Leere.
//
// Beide Prüfziffern-Verfahren sind Standard und in wenigen Zeilen zu rechnen — eine externe
// API dafür wäre eine Netzabhängigkeit für reine Arithmetik.

/** Wirft alles weg, was keine Ziffer und kein X ist: Bindestriche, Leerzeichen, "ISBN". */
function ziffern(eingabe: string): string {
  return eingabe.toUpperCase().replace(/[^0-9X]/g, "");
}

/**
 * Prüfziffer einer ISBN-10: Die Stellen werden mit 10…2 gewichtet, die Summe inklusive
 * Prüfziffer muss durch 11 teilbar sein. Die Prüfziffer selbst kann 10 sein — dafür steht das X.
 */
function pruefzifferIsbn10(neunStellen: string): string {
  let summe = 0;
  for (let i = 0; i < 9; i++) summe += (10 - i) * Number(neunStellen[i]);
  const rest = (11 - (summe % 11)) % 11;
  return rest === 10 ? "X" : String(rest);
}

/** Prüfziffer einer ISBN-13/EAN-13: Stellen abwechselnd mit 1 und 3 gewichtet, Summe mod 10. */
function pruefzifferIsbn13(zwoelfStellen: string): string {
  let summe = 0;
  for (let i = 0; i < 12; i++) summe += Number(zwoelfStellen[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (summe % 10)) % 10);
}

export function istGueltigeIsbn10(wert: string): boolean {
  const s = ziffern(wert);
  if (!/^[0-9]{9}[0-9X]$/.test(s)) return false;
  return pruefzifferIsbn10(s.slice(0, 9)) === s[9];
}

export function istGueltigeIsbn13(wert: string): boolean {
  const s = ziffern(wert);
  if (!/^[0-9]{13}$/.test(s)) return false;
  // 978 und 979 sind die beiden Buchpräfixe im EAN-Raum. Ein Barcode mit 977 (Zeitschrift,
  // ISSN) oder 400… (normales Handelsprodukt) hat eine gültige EAN-Prüfziffer, ist aber keine
  // ISBN — ohne diese Abfrage würde die App eine Müslipackung als Buch annehmen.
  if (!s.startsWith("978") && !s.startsWith("979")) return false;
  return pruefzifferIsbn13(s.slice(0, 12)) === s[12];
}

/**
 * Bringt eine beliebige Eingabe auf die gespeicherte Form (13 Ziffern) oder gibt null zurück,
 * wenn es keine gültige ISBN ist.
 *
 * ISBN-10 → ISBN-13 heißt: "978" davorsetzen, die alte Prüfziffer wegwerfen, neue rechnen.
 * Den umgekehrten Weg gibt es seit dem 05.09.2026 als `zuIsbn10` — nur für die Cover-Suche
 * bei Amazon, und nur für 978er-Nummern.
 */
export function normalisiereIsbn(eingabe: string): string | null {
  const s = ziffern(eingabe);

  if (s.length === 13) return istGueltigeIsbn13(s) ? s : null;

  if (s.length === 10) {
    if (!istGueltigeIsbn10(s)) return null;
    const zwoelf = `978${s.slice(0, 9)}`;
    return zwoelf + pruefzifferIsbn13(zwoelf);
  }

  return null;
}

/**
 * Ergebnis einer von Hand eingetippten ISBN. Beim Scannen genügt „gültig oder nicht" — ein
 * falsch gelesener Barcode wird einfach weitergelesen. Wer tippt, macht dagegen Tippfehler und
 * soll erfahren, *welchen*: Eine zu kurze Nummer, eine Nummer, die gar keine ISBN ist, und eine
 * verdrehte Ziffer verlangen drei verschiedene Reaktionen.
 */
export type IsbnPruefung =
  | { art: "ok"; isbn13: string }
  | { art: "leer" }
  | { art: "laenge" }
  | { art: "kein-buch" }
  | { art: "pruefziffer" };

/**
 * Prüft eine Eingabe und sagt bei einem Fehler, woran es lag.
 *
 * Bindestriche, Leerzeichen und ein vorangestelltes „ISBN" sind erlaubt — genau so steht die
 * Nummer im Impressum, und niemand soll sie erst säubern müssen.
 */
export function pruefeIsbnEingabe(eingabe: string): IsbnPruefung {
  const s = ziffern(eingabe.replace(/isbn/gi, ""));
  if (s.length === 0) return { art: "leer" };
  if (s.length !== 10 && s.length !== 13) return { art: "laenge" };

  // Reihenfolge mit Bedacht: Erst die Frage, ob das überhaupt eine Buchnummer ist, dann die
  // Prüfziffer. Bei einem Zeitschriften- oder Handelsbarcode wäre „die Prüfziffer stimmt nicht"
  // eine Einladung, die Ziffern noch dreimal zu vergleichen — obwohl sie stimmen.
  if (s.length === 13 && !s.startsWith("978") && !s.startsWith("979")) {
    return { art: "kein-buch" };
  }

  const isbn13 = normalisiereIsbn(s);
  return isbn13 ? { art: "ok", isbn13 } : { art: "pruefziffer" };
}

/**
 * Rechnet eine ISBN-13 zurück auf ihre 10-stellige Form, oder null, wenn das nicht geht.
 *
 * Möglich ist das nur für das Präfix **978**: Die 979er-Nummern sind erst mit der ISBN-13
 * vergeben worden und haben schlicht keine 10-stellige Entsprechung. Genau das schließt hier
 * die zweite Zeile aus, statt eine falsche Nummer zu erfinden.
 *
 * Gebraucht wird die alte Form nur an einer Stelle: Amazon führt seine Coverbilder unter der
 * ISBN-10. Der Katalog selbst kennt weiterhin ausschließlich ISBN-13.
 */
export function zuIsbn10(isbn13: string): string | null {
  const s = ziffern(isbn13);
  if (!istGueltigeIsbn13(s)) return null;
  if (!s.startsWith("978")) return null;

  const neun = s.slice(3, 12);
  return neun + pruefzifferIsbn10(neun);
}

/**
 * Gruppiert eine ISBN-13 für die Anzeige: 978-3-570-15291-1.
 *
 * Korrekte Bindestriche verlangen eigentlich die Bereichstabelle der ISBN-Agentur (welche
 * Verlagsnummer wie lang ist) — die ist mehrere hundert Einträge groß und ändert sich. Hier
 * wird nur nach dem festen Muster 3-1-3-4-1 getrennt, das für den mit Abstand häufigsten Fall
 * (deutschsprachige Titel, Gruppe 3) stimmt und sonst wenigstens lesbar bleibt. Die Nummer
 * wird nirgends aus dieser Darstellung zurückgelesen, der Fehler bleibt also kosmetisch.
 */
export function formatiereIsbn(isbn13: string): string {
  const s = ziffern(isbn13);
  if (s.length !== 13) return isbn13;
  return `${s.slice(0, 3)}-${s.slice(3, 4)}-${s.slice(4, 7)}-${s.slice(7, 12)}-${s.slice(12)}`;
}
