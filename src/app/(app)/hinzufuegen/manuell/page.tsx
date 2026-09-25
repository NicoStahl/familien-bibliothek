import { BuchFormular } from "@/components/BuchFormular";
import { SeitenKopf } from "@/components/SeitenKopf";
import { speichereNeuesBuch } from "@/lib/buchActions";
import { vergebeneSerien, vergebeneVerlage } from "@/lib/suche";
import { texte } from "@/lib/i18n/server";

// Der Weg von Hand — für Bücher ohne Barcode und als Ausweg, wenn die Kamera streikt.

export async function generateMetadata() {
  const t = await texte();
  return { title: t.seitentitel(t.hinzufuegen.manuellTitel) };
}

// Dynamisch, seit die Serienauswahl die vorhandenen Serien anbietet: Vorgerendert stünde
// hier für immer die Liste vom Zeitpunkt des Docker-Builds.
export const dynamic = "force-dynamic";

export default async function ManuellSeite() {
  const t = await texte();
  const serien = vergebeneSerien();
  const verlage = vergebeneVerlage();

  return (
    <div>
      <SeitenKopf
        titel={t.hinzufuegen.manuellTitel}
        zurueck="/hinzufuegen"
        zurueckLabel={t.hinzufuegen.zurueck}
        untertitel={t.hinzufuegen.manuellUntertitel}
      />
      <BuchFormular
        action={speichereNeuesBuch}
        vorgabe={{}}
        serien={serien}
        verlage={verlage}
        knopf={t.formular.insRegal}
      />
    </div>
  );
}
