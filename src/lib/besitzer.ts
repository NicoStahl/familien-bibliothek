/**
 * Die Besitzer der Bücher. Eine feste Liste wie die Kategorien — das ist eine Familie, keine
 * Nutzerverwaltung. Sie kommt aus der Umgebungsvariable BESITZER, damit jede Familie ihre
 * eigenen Namen einträgt, ohne den Code anzufassen:
 *
 *   BESITZER=Anna,Ben:#4A6B57,Clara
 *
 * Kommagetrennt, in der Reihenfolge der Auswahlfelder. Hinter einem Doppelpunkt darf eine
 * Badge-Farbe stehen; ohne sie wird reihum aus der Palette unten vergeben.
 *
 * Wichtig: Der Besitzer hat NICHTS mit der Anmeldung zu tun. Angemeldet wird sich über SSO,
 * der Besitzer ist eine Eigenschaft des Buchs. Kinder brauchen kein eigenes Konto.
 *
 * Jeder bekommt einen Buchstaben und eine Farbe für das Badge auf der Cover-Ecke. Alle
 * Palettenfarben tragen papiergraue Schrift und liegen über 5:1 Kontrast — bei Badges von
 * 22 px zählt jeder Punkt, weil der Buchstabe klein und die Fläche daneben bunt ist. Wer eine
 * eigene Farbe setzt, sollte eine ähnlich dunkle wählen.
 *
 * Das Bronze ist deshalb dunkler als das Messing-Gold der Palette (#B8924A): Auf dem hellen
 * Messing erreicht weder helle noch dunkle Schrift 4.5:1 — Gold ist ein Mittelton. Das echte
 * Messing bleibt der App als Akzentfarbe für Flächen, Linien und Symbole erhalten, nur eben
 * nicht als Untergrund für Text.
 */
const PALETTE = ["#4A6B57", "#7A5C1C", "#8A4B62", "#2B3A4A", "#5A4E7A", "#6B4A3A"] as const;
const SCHRIFT = "#EFEDE8";

/** Ohne gesetzte Variable: ein einziger Besitzer, damit die App trotzdem benutzbar ist. */
const VORGABE = "Familie";

export type Besitzer = { name: string; kuerzel: string; farbe: string; schrift: string };

function einlesen(roh: string): Besitzer[] {
  const liste: Besitzer[] = [];
  for (const eintrag of roh.split(",")) {
    const [namensteil, farbteil] = eintrag.split(":");
    const name = namensteil.trim();
    if (!name || liste.some((b) => b.name === name)) continue;
    const farbe = /^#[0-9a-fA-F]{6}$/.test(farbteil?.trim() ?? "")
      ? farbteil.trim()
      : PALETTE[liste.length % PALETTE.length];
    liste.push({ name, kuerzel: name[0].toUpperCase(), farbe, schrift: SCHRIFT });
  }
  return liste;
}

/**
 * Zur Laufzeit gelesen, nicht beim Bauen: Das Docker-Image ist für alle gleich, die Namen
 * stehen in der .env neben der docker-compose.yml.
 */
export function besitzerListe(): Besitzer[] {
  const liste = einlesen(process.env.BESITZER ?? "");
  return liste.length > 0 ? liste : einlesen(VORGABE);
}

export function besitzerNamen(): string[] {
  return besitzerListe().map((b) => b.name);
}

/**
 * Sucht die Badge-Darstellung zu einem gespeicherten Namen. Steht in der Datenbank ein Name,
 * den es in der Liste nicht (mehr) gibt, wird daraus ein neutrales graues Badge mit dem ersten
 * Buchstaben — das ist besser als ein Absturz oder eine leere Ecke.
 */
export function besitzerBadge(name: string): { kuerzel: string; farbe: string; schrift: string } {
  const treffer = besitzerListe().find((b) => b.name === name);
  if (treffer) return { kuerzel: treffer.kuerzel, farbe: treffer.farbe, schrift: treffer.schrift };
  return { kuerzel: (name[0] ?? "?").toUpperCase(), farbe: "#6F6A62", schrift: SCHRIFT };
}
