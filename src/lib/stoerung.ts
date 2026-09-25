// Warum eine Abfrage bei den Buch-Verzeichnissen nichts ergeben hat.
//
// Der Unterschied ist für den Menschen vor dem Regal der ganze Punkt: „Dieses Buch kennt
// keiner" heißt Titel von Hand eintippen und weitermachen. „Der Dienst antwortet gerade
// nicht" heißt später noch einmal versuchen — und wer das nicht weiß, tippt fünf Bücher von
// Hand ab, die morgen von selbst gefunden würden.
//
// Bis zum 05.09.2026 sah beides identisch aus: „Nichts gefunden". Der wahre Grund stand nur
// im Containerlog, und danach sucht niemand, der gerade einen Stapel Bücher erfasst. An dem
// Tag war Googles anonymes Tageskontingent erschöpft, fünf Scans hintereinander blieben leer,
// und die Suche danach ging in die App statt in die Konfiguration.
//
// Diese Datei liegt bewusst neben buchapi.ts und nicht darin: buchapi.ts ist `server-only`,
// die Texte werden aber auch im Scanner gebraucht, und der läuft im Browser.

export type Dienst = "Google Books" | "Open Library";

export type Stoerungsart =
  /** HTTP 429 — ohne eigenen Schlüssel teilt sich Google Books ein Kontingent mit aller Welt. */
  | "kontingent"
  /** Alles andere: Zeitüberschreitung, DNS, 5xx, unerwartete Antwortform. */
  | "ausfall";

export type Dienststoerung = { dienst: Dienst; art: Stoerungsart };

function grund(stoerung: Dienststoerung): string {
  return stoerung.art === "kontingent"
    ? `${stoerung.dienst} hat sein Tageskontingent erschöpft`
    : `${stoerung.dienst} hat nicht geantwortet`;
}

/**
 * Ein Satz, der sagt, warum nichts gefunden wurde — oder `null`, wenn beide Dienste sauber
 * geantwortet haben und die ISBN ihnen schlicht unbekannt ist. Nur im zweiten Fall ist
 * „Nichts gefunden" die ganze Wahrheit.
 *
 * Die Liste enthält ausschließlich Fehlschläge. Steht genau eine Störung darin, hat der
 * andere Dienst also geantwortet und das Buch nicht gekannt — dann ist der Fund noch offen,
 * aber nicht ausgeschlossen. Stehen zwei darin, wurde faktisch nichts gefragt.
 */
export function stoerungsText(stoerungen: Dienststoerung[]): string | null {
  if (stoerungen.length === 0) return null;

  const teile = stoerungen.map(grund).join(", ");
  const kopf =
    stoerungen.length >= 2
      ? `Ob dieses Buch bekannt ist, lässt sich gerade nicht sagen: ${teile}.`
      : `Das Buch ist womöglich doch bekannt: ${teile}, gefragt werden konnte nur der zweite Dienst.`;

  const rat = stoerungen.some((s) => s.art === "kontingent")
    ? "Ein eigener Google-Books-Schlüssel (GOOGLE_BOOKS_API_KEY in der .env) beendet das dauerhaft."
    : null;

  return [kopf, "Später noch einmal versuchen — oder die Angaben jetzt von Hand eintragen.", rat]
    .filter((s): s is string => s !== null)
    .join(" ");
}
