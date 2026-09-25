import Link from "next/link";
import { notFound } from "next/navigation";
import { BuchFormular } from "@/components/BuchFormular";
import { SeitenKopf } from "@/components/SeitenKopf";
import { speichereNeuesBuch } from "@/lib/buchActions";
import { metadatenZuIsbn } from "@/lib/buchapi";
import { findeNachIsbn } from "@/lib/buecher";
import { vergebeneSerien, vergebeneVerlage } from "@/lib/suche";
import { normalisiereIsbn } from "@/lib/isbn";
import { stoerungsText } from "@/lib/stoerung";
import { texte } from "@/lib/i18n/server";

// Das vorausgefüllte Formular nach einem Scan.
//
// Die Metadaten werden hier ein zweites Mal geholt, obwohl der Scanner sie schon einmal
// abgefragt hat. Das ist Absicht: Damit trägt die Adresse den vollständigen Zustand. Die Seite
// überlebt ein Neuladen, lässt sich aus dem Verlauf wieder aufrufen und funktioniert auch,
// wenn die ISBN von Hand eingetippt wurde. Der Preis ist eine Abfrage von wenigen hundert
// Millisekunden — die Alternative wäre gewesen, die Antwort durch den Browser-Speicher zu
// schleusen und sich einen Zustand einzuhandeln, der nirgends steht.

export const dynamic = "force-dynamic";

export default async function ErfassenSeite({
  searchParams,
}: {
  searchParams: Promise<{ isbn?: string }>;
}) {
  const { isbn } = await searchParams;
  const normalisiert = isbn ? normalisiereIsbn(isbn) : null;
  if (!normalisiert) notFound();

  const [auskunft, duplikate] = await Promise.all([
    metadatenZuIsbn(normalisiert),
    Promise.resolve(findeNachIsbn(normalisiert)),
  ]);
  const { treffer, stoerungen } = auskunft;

  // Steht hier ein Satz, war die Frage unbeantwortet — nicht verneint. Der Kopf sagt das dann
  // auch: "Nichts gefunden" wäre eine Behauptung über das Buch, die niemand geprüft hat.
  const t = await texte();
  const hinweis = stoerungsText(t, stoerungen);

  return (
    <div>
      <SeitenKopf
        titel={treffer ? t.hinzufuegen.gefunden : hinweis ? t.hinzufuegen.nichtAbrufbar : t.hinzufuegen.nichtsGefunden}
        zurueck="/hinzufuegen"
        zurueckLabel={t.hinzufuegen.zurueck}
        untertitel={
          treffer
            ? t.hinzufuegen.gefundenUntertitel
            : hinweis
              ? hinweis
              : t.hinzufuegen.nichtsGefundenUntertitel
        }
      />

      {duplikate.length > 0 && (
        <div className="mx-5 mt-4 rounded-lg border border-messing/50 bg-messing/10 p-3">
          <p className="text-sm leading-relaxed text-tinte">
            {duplikate.length === 1
              ? t.hinzufuegen.duplikatEins(duplikate[0].besitzer)
              : t.hinzufuegen.duplikatMehrere(duplikate.length)}{" "}
            {t.hinzufuegen.duplikatOk}
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            {duplikate.map((d) => (
              <Link key={d.id} href={`/buch/${d.id}`} className="utility text-[10.5px] text-tinte underline">
                {t.hinzufuegen.exemplarVon(d.besitzer)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <BuchFormular
        action={speichereNeuesBuch}
        knopf={t.formular.insRegal}
        serien={vergebeneSerien()}
        verlage={vergebeneVerlage()}
        vorgabe={{
          titel: treffer?.titel,
          autor: treffer?.autor,
          isbn: normalisiert,
          verlag: treffer?.verlag,
          jahr: treffer?.jahr,
          coverUrl: treffer?.coverUrl,
        }}
      />
    </div>
  );
}
