import { notFound } from "next/navigation";
import { BuchFormular } from "@/components/BuchFormular";
import { SeitenKopf } from "@/components/SeitenKopf";
import { speichereBuch } from "@/lib/buchActions";
import { holeBuch } from "@/lib/buecher";
import { vergebeneSerien, vergebeneVerlage } from "@/lib/suche";
import { texte } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function BearbeitenSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buch = holeBuch(Number(id));
  if (!buch) notFound();
  const t = await texte();

  return (
    <div>
      <SeitenKopf titel={t.buch.bearbeiten} zurueck={`/buch/${buch.id}`} zurueckLabel={buch.titel} />
      <BuchFormular
        action={speichereBuch}
        id={buch.id}
        knopf={t.buch.aenderungenSpeichern}
        serien={vergebeneSerien()}
        verlage={vergebeneVerlage()}
        vorgabe={{
          titel: buch.titel,
          autor: buch.autor,
          isbn: buch.isbn,
          kategorie: buch.kategorie,
          besitzer: buch.besitzer,
          serie: buch.serie,
          band: buch.band,
          verlag: buch.verlag,
          jahr: buch.jahr,
          coverDatei: buch.cover_datei,
        }}
      />
    </div>
  );
}
