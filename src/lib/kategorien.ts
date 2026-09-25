/**
 * Die festen Kategorien aus dem Umsetzungsplan ("feste, im Code gepflegte Auswahlliste —
 * keine Freitext-Tags"). Eine Familienbibliothek wächst langsam und in bekannten Bahnen; eine
 * frei wachsende Tag-Wolke wäre nach einem Jahr eine Liste mit "Kinderbuch", "kinderbuch" und
 * "Kinder-Buch" darin.
 *
 * Von Nico abgenommen am 04.09.2026. "Ratgeber" stand im Entwurf noch dazwischen und ist
 * bewusst wieder herausgeflogen: Die Grenze zu "Sachbuch" ist Auslegungssache, und eine
 * Kategorie, bei der man jedes zweite Mal überlegen muss, sortiert nicht — sie kostet nur Zeit.
 * Ratgeber landen jetzt unter "Sachbuch".
 *
 * Diese Liste zu ändern ist ausdrücklich vorgesehen und kostet nichts: Die Kategorie steht als
 * Text an der Zeile, es gibt keine Fremdschlüssel darauf. Wird ein Eintrag entfernt, behalten
 * bestehende Bücher ihn — sie tauchen dann nur nicht mehr im Filter auf.
 *
 * Bewusst eine eigene Datei und nicht schema.ts: Das Buchformular ist eine Client-Komponente,
 * über den Import landete sonst das komplette SQL-Schema im Browser-Bundle.
 */
export const KATEGORIEN = [
  "Bilderbuch",
  "Erstleser",
  "Kinderroman",
  "Jugendbuch",
  "Sachbuch Kinder",
  "Roman",
  "Sachbuch",
  "Comic",
  "Kochbuch",
  "Sonstiges",
] as const;

export type Kategorie = (typeof KATEGORIEN)[number];

/** Fällt eine Kategorie aus der Liste (oder fehlt beim Import), landet das Buch hier. */
export const KATEGORIE_FALLBACK: Kategorie = "Sonstiges";
