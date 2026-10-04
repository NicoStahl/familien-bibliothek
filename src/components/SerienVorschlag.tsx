"use client";

// Trägt Titel und Autor zum Serien- und Bandfeld, damit diese eine passende Serie und Nummer
// vorschlagen können -- siehe lib/serienAbgleich.ts.
//
// Ein eigener Context statt Props, weil die Felder in BuchFormular nicht benachbart sind
// (Kategorie und Besitzer stehen dazwischen). Diese Felder bleiben dabei normale,
// unveränderte Server-gerenderte Eingaben -- der Provider umschließt sie nur, ohne sie
// anzufassen.
//
// Vorschläge gibt es nur beim Neuanlegen (`aktiv`). Beim Bearbeiten stünde sonst in einem Buch
// mit bewusst leerer Serie oder Bandnummer plötzlich ein Vorschlag, und ein Speichern wegen
// einer ganz anderen Korrektur schriebe ihn unbemerkt mit fest.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  erkenneBand,
  erkenneSerie,
  erkenneSerieNachAutor,
  type AutorenSerien,
} from "@/lib/serienAbgleich";

type Kontext = {
  aktiv: boolean;
  titel: string;
  autor: string;
  autorenSerien: AutorenSerien;
  meldeTitel: (titel: string) => void;
  meldeAutor: (autor: string) => void;
};

const SerienVorschlagContext = createContext<Kontext | null>(null);

export function SerienVorschlagProvider({
  aktiv,
  autorenSerien,
  children,
}: {
  aktiv: boolean;
  autorenSerien: AutorenSerien;
  children: React.ReactNode;
}) {
  const [titel, meldeTitel] = useState("");
  const [autor, meldeAutor] = useState("");
  return (
    <SerienVorschlagContext.Provider
      value={{ aktiv, titel, autor, autorenSerien, meldeTitel, meldeAutor }}
    >
      {children}
    </SerienVorschlagContext.Provider>
  );
}

/**
 * Ein normales `<input>`, das seinen Wert beim Verlassen an den Context meldet — und einmal beim
 * Einhängen: Ein aus dem Scan schon vorausgefüllter Wert soll wirken, ohne dass jemand das Feld
 * extra anfasst.
 */
function MeldeFeld({
  melde,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { melde: (wert: string) => void }) {
  const gemeldet = useRef(false);

  useEffect(() => {
    if (gemeldet.current) return;
    gemeldet.current = true;
    const anfangswert = typeof props.defaultValue === "string" ? props.defaultValue : "";
    if (anfangswert) melde(anfangswert);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim ersten Rendern
  }, []);

  return (
    <input
      {...props}
      onBlur={(e) => {
        melde(e.target.value);
        props.onBlur?.(e);
      }}
    />
  );
}

/** Ersetzt das rohe Titel-`<input>` 1:1 — gleiche Props, gleiche Darstellung. */
export function TitelFeld(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const context = useContext(SerienVorschlagContext);
  return <MeldeFeld {...props} melde={(w) => context?.meldeTitel(w)} />;
}

/** Dito für den Autor — Grundlage der zweiten Abgleichsstufe. */
export function AutorFeld(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const context = useContext(SerienVorschlagContext);
  return <MeldeFeld {...props} melde={(w) => context?.meldeAutor(w)} />;
}

/**
 * Die vorgeschlagene Serie, oder null. Erst der Titel, dann der Autor — der Titel ist die
 * stärkere Auskunft, weil er sich auf genau dieses Buch bezieht.
 */
export function useErkannteSerie(serien: string[]): string | null {
  const context = useContext(SerienVorschlagContext);
  const aktiv = context?.aktiv ?? false;
  const titel = context?.titel ?? "";
  const autor = context?.autor ?? "";
  const autorenSerien = context?.autorenSerien;

  return useMemo(() => {
    if (!aktiv) return null;
    const ausTitel = titel ? erkenneSerie(titel, serien) : null;
    if (ausTitel) return ausTitel;
    return autor && autorenSerien ? erkenneSerieNachAutor(autor, autorenSerien) : null;
  }, [aktiv, titel, autor, serien, autorenSerien]);
}

/**
 * Das Bandfeld. Zeigt die gespeicherte Nummer, sonst einen Vorschlag — aus dem Titel („Band 3",
 * „Eragon 4"), danach die Position bei Open Library, die nur nach einem Scan mitkommt. Der
 * Titel geht vor, weil er auf genau dieser Ausgabe steht.
 *
 * Wie beim Serienfeld wird der Vorschlag beim Rendern abgeleitet und nicht in den Zustand
 * geschrieben: Sobald jemand das Feld selbst bedient, gilt nur noch die eigene Eingabe — auch
 * ein bewusst geleertes Feld.
 */
export function BandFeld({
  serien,
  vorgabe,
  vorschlag,
  label,
  labelClass,
  eingabeClass,
}: {
  serien: string[];
  vorgabe: number | null;
  /** Position bei Open Library, nur nach einem Scan gesetzt. */
  vorschlag: number | null;
  label: string;
  labelClass: string;
  eingabeClass: string;
}) {
  const context = useContext(SerienVorschlagContext);
  const serie = useErkannteSerie(serien);
  /** null heißt: noch nicht angefasst. */
  const [eigen, setEigen] = useState<string | null>(null);

  const ausTitel = context?.aktiv && context.titel ? erkenneBand(context.titel, serie) : null;
  const vorgeschlagen = context?.aktiv ? (ausTitel ?? vorschlag) : null;
  const angezeigt = eigen ?? String(vorgabe ?? vorgeschlagen ?? "");

  return (
    <div>
      <label htmlFor="band" className={labelClass}>{label}</label>
      <input
        id="band"
        name="band"
        type="number"
        inputMode="numeric"
        min="1"
        value={angezeigt}
        onChange={(e) => setEigen(e.target.value)}
        className={eingabeClass}
      />
    </div>
  );
}
