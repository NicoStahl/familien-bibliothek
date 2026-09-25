"use client";

// Verbindet AuswahlFeld mit dem erkannten Serienvorschlag (siehe SerienVorschlag.tsx). Eigene
// Datei statt direkt in BuchFormular, weil BuchFormular eine Server-Komponente ist und
// useErkannteSerie() als Hook nur in einer Client-Komponente laufen kann.

import { AuswahlFeld } from "@/components/AuswahlFeld";
import { useErkannteSerie } from "@/components/SerienVorschlag";

export function SerieAuswahlFeld({
  serien,
  vorgabe,
  labelClass,
  eingabeClass,
}: {
  serien: string[];
  vorgabe: string | null;
  labelClass: string;
  eingabeClass: string;
}) {
  const vorschlag = useErkannteSerie(serien);

  return (
    <AuswahlFeld
      name="serie"
      label="Serie"
      werte={serien}
      vorgabe={vorgabe}
      leerText="Keine Serie"
      neuText="Neue Serie …"
      platzhalter="z. B. Eragon"
      labelClass={labelClass}
      eingabeClass={eingabeClass}
      vorschlag={vorschlag}
    />
  );
}
