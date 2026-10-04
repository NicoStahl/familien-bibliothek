// Welche Adresse der Browser für eine Cover-Vorschau laden soll. Läuft im Browser (Scan-Karte)
// und auf dem Server (Formular), deshalb ohne "server-only".
//
// Der MVB-Coverdienst der DNB steht hinter einem Bot-Schutz (Anubis): Wer sich als Browser
// ausweist, bekommt statt des Bildes eine Seite mit Rechenaufgabe — am 04.10.2026 gemessen,
// ausgelöst allein vom "Mozilla" im User-Agent. Der Server mit eigener Kennung bekommt das Bild,
// das Handy nicht. Die Vorschau geht deshalb über /api/cover-vorschau, die Adresse selbst bleibt
// in den Daten unverändert, weil der Server sie beim Speichern direkt herunterlädt.

export const MVB_COVER = "https://portal.dnb.de/opac/mvb/cover?isbn=";

export function vorschauAdresse(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith(MVB_COVER) ? `/api/cover-vorschau/${url.slice(MVB_COVER.length)}` : url;
}
