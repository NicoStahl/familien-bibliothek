"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "./auth";
import { kategorieZuIsbn } from "./buchapi";
import { buecherOhneKategorie, setzeVorgeschlageneKategorie } from "./buecher";
import type { Kategorie } from "./kategorien";

// Nachkategorisierung von der Mehr-Seite aus: Bücher unter „Sonstiges" mit ISBN bekommen den
// Kategorie-Vorschlag, den ein neuer Scan auch bekäme (kategorieVorschlag.ts).
//
// In kleinen Schwüngen statt in einem Rutsch. Pro Buch geht eine Anfrage an die DNB, gut eine
// halbe Sekunde; bei ein paar hundert Büchern liefe eine einzige Anfrage minutenlang und damit
// in die Zeitgrenze des Reverse Proxys vor der NAS. So hält jeder Schritt nur wenige Sekunden,
// der Browser ruft den nächsten selbst auf und kann dabei den Fortschritt zeigen.
//
// Die Anfragen an die DNB laufen bewusst nacheinander: Sie ist ein öffentlicher Dienst ohne
// Schlüssel, und ein Familienregal hat es nicht eilig.

const SCHWUNG = 8;

export type NachtragSchritt = {
  geprueft: number;
  eingeordnet: { id: number; titel: string; kategorie: Kategorie }[];
  /** Ab dieser Kennung geht es weiter; null heißt fertig (oder abgebrochen, siehe `stoerung`). */
  weiterAb: number | null;
  /** Die DNB hat nicht geantwortet. Der Lauf endet dann, statt Bücher fälschlich abzuhaken. */
  stoerung: boolean;
};

export async function trageKategorienNach(abId: number): Promise<NachtragSchritt> {
  await requireUser();
  const ab = Number.isInteger(abId) && abId >= 0 ? abId : 0;
  const buecher = buecherOhneKategorie(ab, SCHWUNG);

  const schritt: NachtragSchritt = { geprueft: 0, eingeordnet: [], weiterAb: null, stoerung: false };
  for (const buch of buecher) {
    const { kategorie, stoerung } = await kategorieZuIsbn(buch.isbn ?? "");
    if (stoerung) {
      schritt.stoerung = true;
      break;
    }
    schritt.geprueft++;
    if (kategorie && setzeVorgeschlageneKategorie(buch.id, kategorie)) {
      schritt.eingeordnet.push({ id: buch.id, titel: buch.titel, kategorie });
    }
  }

  if (!schritt.stoerung && buecher.length === SCHWUNG) {
    schritt.weiterAb = buecher[buecher.length - 1].id;
  }
  if (schritt.eingeordnet.length > 0) revalidatePath("/");
  return schritt;
}
