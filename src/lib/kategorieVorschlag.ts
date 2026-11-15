// Kategorie-Vorschlag aus dem Katalogdatensatz der Deutschen Nationalbibliothek.
//
// Keine KI und keine Schätzung aus dem Titel, sondern feste Regeln über das, was die DNB
// ohnehin in jeden Datensatz schreibt. Drei Arten von Angaben genügen für unsere Liste:
//
//  • Sachgruppe (082/083, ältere Sätze 084, jeweils mit $2 „…sdnb"): grob, aber fast immer
//    da. `K` heißt Kinder- und Jugendliteratur, `B` Belletristik, `741.5` Comics, eine
//    dreistellige Zahl ein Sachgebiet nach Dewey.
//  • Inhaltsart und Warengruppe (655): „Bilderbuch", „Kindersachbuch", „Jugendbuch", „Comic",
//    „Kochbuch" aus der Normdatei, dazu die Warengruppen des Buchhandels mit Altersstufe
//    („Erstlesealter, Vorschulalter", „Kinderbücher bis 11 Jahre", „Jugendbücher ab 12 Jahre").
//  • Zielgruppe (385): „Leseanfänger", „Vorschulkind", „Kind", „Jugend".
//
// Es bleibt ein VORSCHLAG. Das Formular wählt ihn vor, die Familie kann ihn ändern. Wo die
// Angaben nicht reichen, kommt bewusst nichts zurück statt eines Tipps: „Sonstiges" ist
// sichtbar unbestimmt, eine geratene Kategorie wäre unsichtbar falsch (dieselbe Abwägung wie
// am Auswahlfeld in BuchFormular.tsx).
//
// Nur Typ-Importe: Die Tests laufen mit dem nackten Node (`npm test`), siehe marc.ts.

import type { Kategorie } from "./kategorien";
import type { MarcFeld } from "./marc";

export type KategorieSignale = {
  /** Sachgruppen der DNB, z. B. „K", „B", „830", „741.5". */
  sachgruppen: string[];
  /** Inhaltsarten und Warengruppen aus Feld 655, klein geschrieben. */
  merkmale: string[];
  /** Zielgruppen aus Feld 385, klein geschrieben. */
  zielgruppen: string[];
};

function werte(feld: MarcFeld, code: string): string[] {
  return feld.unter.filter((u) => u.code === code && u.wert !== "").map((u) => u.wert);
}

/** Zieht die für die Kategorie entscheidenden Angaben aus einem DNB-Datensatz. */
export function kategorieSignale(felder: MarcFeld[]): KategorieSignale {
  const sachgruppen = felder
    .filter((f) => ["082", "083", "084"].includes(f.tag) && werte(f, "2").some((q) => /sdnb$/.test(q)))
    .flatMap((f) => werte(f, "a"))
    .map((g) => g.trim().toUpperCase());

  const klein = (tag: string) =>
    felder.filter((f) => f.tag === tag).flatMap((f) => werte(f, "a")).map((w) => w.toLowerCase());

  return {
    sachgruppen: [...new Set(sachgruppen)],
    merkmale: [...new Set(klein("655"))],
    zielgruppen: [...new Set(klein("385"))],
  };
}

const hat = (liste: string[], muster: RegExp) => liste.some((w) => muster.test(w));

/**
 * Die Regeln, in fester Reihenfolge — die erste, die greift, entscheidet.
 *
 * Die Reihenfolge trägt Bedeutung. Ein Leserabe-Band etwa führt die DNB als Inhaltsart
 * „Bilderbuch" UND mit Zielgruppe „Leseanfänger"; gemeint ist ein Erstleser, also steht
 * Erstleser vor Bilderbuch. „Sachbilderbuch" gehört zum Kindersachbuch, nicht zum Bilderbuch.
 * Comic und Kochbuch stehen ganz vorn, weil sie quer zum Alter liegen: Ein Kinder-Comic ist
 * im Regal zuerst ein Comic.
 */
export function kategorieAusSignale({ sachgruppen, merkmale, zielgruppen }: KategorieSignale): Kategorie | null {
  const kinder = sachgruppen.includes("K");
  const belletristik = sachgruppen.includes("B");
  // Nur dreistellige Gruppen sind Dewey-Sachgebiete. Sätze aus der Zeit vor 2004 tragen noch
  // zweistellige Sachgruppen eines älteren Schemas („07"), die hier nichts aussagen.
  const sachgebiete = sachgruppen.filter((g) => /^\d{3}/.test(g));
  const alles = [...merkmale, ...zielgruppen];

  if (sachgebiete.some((g) => g.startsWith("741.5")) || hat(merkmale, /^comic|graphic novel|manga/)) {
    return "Comic";
  }
  if (hat(merkmale, /kochbuch|backbuch|kochen|backen|essen (und|&) trinken/)) return "Kochbuch";
  if (hat(alles, /leseanfänger|erstles/)) return "Erstleser";

  // Ausdrückliche Angaben vor bloßen Kombinationen: Eine Inhaltsart oder Warengruppe hat jemand
  // bei der DNB oder im Verlag bewusst vergeben, „Sachgebiet + Zielgruppe Kind" ist nur ein Indiz.
  // Bis v0.12 standen beide Wege in einer Regel, und ein religiöses Bilderbuch (Sachgruppe 230,
  // Inhaltsart „Bilderbuch") wurde zum Kindersachbuch.
  //
  // „Lernen im Vorschulalter" (die Lern-tiptois) zählt zum Sachbuch Kinder, obwohl die DNB
  // dieselben Bände auch als „Bilderbuch" führt — so ordnet sie die Familie ein.
  if (hat(merkmale, /kindersachbuch|jugendsachbuch|sachbilderb|sachbücher.*(kinder|jugend)|lernen im vorschulalter/)) {
    return "Sachbuch Kinder";
  }
  if (hat(merkmale, /(?<!sach)bilderb/)) return "Bilderbuch";
  if (sachgebiete.length > 0 && !belletristik && hat(zielgruppen, /^(kind|kleinkind|vorschulkind|schulkind|jugend)/)) {
    return "Sachbuch Kinder";
  }
  if (hat(zielgruppen, /^(kleinkind|vorschulkind)$/)) return "Bilderbuch";
  if (hat(merkmale, /jugendb|junge erwachsene|young adult/) || (kinder && hat(zielgruppen, /^jugend/))) {
    return "Jugendbuch";
  }
  if (
    hat(merkmale, /kinderb|kinderroman/) ||
    (kinder && (hat(zielgruppen, /^(kind|schulkind)$/) || hat(merkmale, /erzählende|roman|fantasy|abenteuer/)))
  ) {
    return "Kinderroman";
  }

  // Nur „K" und sonst nichts: ein Kinderbuch, aber welches, sagt der Datensatz nicht.
  if (kinder) return null;

  if (belletristik || hat(merkmale, /erzählende literatur|roman|krimi|thriller|fantasy|science.?fiction|fiktionale darstellung/)) {
    return "Roman";
  }
  // Eine Zahl ohne „B" ist ein Sachgebiet — auch 830, denn ohne „B" ist das Literaturwissenschaft.
  if (sachgebiete.length > 0) return "Sachbuch";
  return null;
}

/** Kategorie-Vorschlag zu einem zerlegten DNB-Datensatz, oder null. */
export function kategorieAusMarc(felder: MarcFeld[]): Kategorie | null {
  return kategorieAusSignale(kategorieSignale(felder));
}
