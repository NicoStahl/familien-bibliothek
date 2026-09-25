"use client";

// Trägt den Titel-Text vom Titelfeld zum Serienfeld, damit Letzteres eine passende Serie
// vorauswählen kann -- siehe erkenneSerie() in lib/serienAbgleich.ts.
//
// Ein eigener Context statt Props, weil Titel- und Serienfeld in BuchFormular nicht benachbart
// sind (Autor, Kategorie und Besitzer stehen dazwischen). Diese Felder bleiben dabei normale,
// unveränderte Server-gerenderte Eingaben -- der Provider umschließt sie nur, ohne sie
// anzufassen.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { erkenneSerie } from "@/lib/serienAbgleich";

const SerienVorschlagContext = createContext<{
  titel: string;
  meldeTitel: (titel: string) => void;
} | null>(null);

export function SerienVorschlagProvider({ children }: { children: React.ReactNode }) {
  const [titel, setTitel] = useState("");
  return (
    <SerienVorschlagContext.Provider value={{ titel, meldeTitel: setTitel }}>
      {children}
    </SerienVorschlagContext.Provider>
  );
}

/**
 * Ersetzt das rohe Titel-`<input>` 1:1 -- gleiche Props, gleiche Darstellung. Meldet seinen Wert
 * beim Verlassen des Felds an den Context, und einmal beim Einhängen: Ein aus dem Scan schon
 * vorausgefüllter Titel soll wirken, ohne dass jemand das Feld extra anfasst.
 */
export function TitelFeld(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const context = useContext(SerienVorschlagContext);
  const gemeldet = useRef(false);

  useEffect(() => {
    if (gemeldet.current) return;
    gemeldet.current = true;
    const anfangswert = typeof props.defaultValue === "string" ? props.defaultValue : "";
    if (anfangswert) context?.meldeTitel(anfangswert);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim ersten Rendern
  }, []);

  return (
    <input
      {...props}
      onBlur={(e) => {
        context?.meldeTitel(e.target.value);
        props.onBlur?.(e);
      }}
    />
  );
}

/** Die anhand des bisher gemeldeten Titels erkannte Serie, oder null ohne Treffer. */
export function useErkannteSerie(serien: string[]): string | null {
  const context = useContext(SerienVorschlagContext);
  const titel = context?.titel ?? "";
  return useMemo(() => (titel ? erkenneSerie(titel, serien) : null), [titel, serien]);
}
