import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { metadatenZuIsbn } from "@/lib/buchapi";
import { findeNachIsbn } from "@/lib/buecher";
import { normalisiereIsbn } from "@/lib/isbn";

// Die eine Anfrage, die der Scanner nach einem erkannten Barcode stellt.
//
// Sie beantwortet beide Fragen auf einmal — "was ist das für ein Buch?" und "haben wir das
// schon?" —, weil sie zusammen beantwortet werden müssen: Vor dem Ausfüllen des Formulars
// soll die Duplikat-Warnung stehen, nicht danach. Zwei getrennte Anfragen wären zwei
// Wartezeiten hintereinander, und das merkt man, wenn man mit dem Handy vor dem Regal steht.

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ isbn: string }> }) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }

  const { isbn } = await params;
  const normalisiert = normalisiereIsbn(isbn);
  if (!normalisiert) {
    return NextResponse.json({ fehler: "Keine gültige ISBN." }, { status: 400 });
  }

  // Der Katalog wird ZUERST befragt und die API danach: Die Duplikat-Auskunft steht damit auch
  // dann, wenn Google und Open Library beide nicht antworten.
  const duplikate = findeNachIsbn(normalisiert).map((b) => ({
    id: b.id,
    titel: b.titel,
    besitzer: b.besitzer,
  }));

  // `stoerungen` geht mit hinaus, damit der Scanner "kennt keiner" von "konnte gerade niemand
  // beantworten" unterscheiden kann. Ohne diese Angabe sehen beide Fälle gleich aus, und der
  // Unterschied entscheidet, ob man den Titel abtippt oder es später noch einmal versucht.
  const { treffer, stoerungen } = await metadatenZuIsbn(normalisiert);

  return NextResponse.json({ isbn: normalisiert, treffer, duplikate, stoerungen });
}
