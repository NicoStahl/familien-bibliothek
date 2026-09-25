import { BuchFormular } from "@/components/BuchFormular";
import { SeitenKopf } from "@/components/SeitenKopf";
import { speichereNeuesBuch } from "@/lib/buchActions";
import { vergebeneSerien, vergebeneVerlage } from "@/lib/suche";

// Der Weg von Hand — für Bücher ohne Barcode und als Ausweg, wenn die Kamera streikt.

export const metadata = { title: "Von Hand eintragen — Bücherfuchs" };

// Dynamisch, seit die Serienauswahl die vorhandenen Serien anbietet: Vorgerendert stünde
// hier für immer die Liste vom Zeitpunkt des Docker-Builds.
export const dynamic = "force-dynamic";

export default function ManuellSeite() {
  const serien = vergebeneSerien();
  const verlage = vergebeneVerlage();

  return (
    <div>
      <SeitenKopf
        titel="Von Hand eintragen"
        zurueck="/hinzufuegen"
        zurueckLabel="Scannen"
        untertitel="Nur Titel und Besitzer sind Pflicht. Alles andere lässt sich später ergänzen."
      />
      <BuchFormular
        action={speichereNeuesBuch}
        vorgabe={{}}
        serien={serien}
        verlage={verlage}
        knopf="Ins Regal stellen"
      />
    </div>
  );
}
