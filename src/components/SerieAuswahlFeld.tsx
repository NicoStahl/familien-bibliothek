"use client";

// Verbindet AuswahlFeld mit dem erkannten Serienvorschlag (siehe SerienVorschlag.tsx). Eigene
// Datei statt direkt in BuchFormular, weil BuchFormular eine Server-Komponente ist und
// useErkannteSerie() als Hook nur in einer Client-Komponente laufen kann.

import { AuswahlFeld } from "@/components/AuswahlFeld";
import { useErkannteSerie } from "@/components/SerienVorschlag";
import { useTexte } from "@/components/SpracheProvider";

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
  const t = useTexte();

  return (
    <AuswahlFeld
      name="serie"
      label={t.formular.serie}
      werte={serien}
      vorgabe={vorgabe}
      leerText={t.formular.keineSerie}
      neuText={t.formular.neueSerie}
      platzhalter={t.formular.seriePlatzhalter}
      labelClass={labelClass}
      eingabeClass={eingabeClass}
      vorschlag={vorschlag}
    />
  );
}
