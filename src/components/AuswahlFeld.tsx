"use client";

import { useState } from "react";
import { useTexte } from "@/components/SpracheProvider";

// Auswahl aus den schon vergebenen Werten, mit Ausweg in den Freitext -- für Serie und Verlag.
//
// Entstanden am 07.09.2026 als Serienfeld; am 16.09.2026 auf Nicos Wunsch für den Verlag
// verallgemeinert, weil dort dasselbe Problem droht ("Ravensburger" neben "Ravensburger
// Verlag"). Der Verlag kommt meist aus dem Import und steht dann schon richtig drin -- die
// Auswahl ist für die Fälle, in denen er fehlt.
//
// Vorher war die Serie ein Freitextfeld. Bei einer Familienbibliothek tippt man denselben Namen
// aber ein Dutzend Mal — und ein einziges "Die drei ???" neben "Die Drei ???" reicht, damit
// die Serienseite zwei halbe Reihen statt einer ganzen zeigt. Die Auswahl macht den
// Wiederholungsfall zum Normalfall; neu anlegen bleibt jederzeit möglich.
//
// Deshalb ein natives <select> und kein Eigenbau-Aufklappmenü: Auf dem iPhone öffnet das
// Auswahlrad am unteren Bildschirmrand, das man mit dem Daumen bedient — dieselbe Festlegung
// wie in KatalogFilter.
//
// Das ist die einzige Client-Komponente im ansonsten zustandslosen BuchFormular. Sie braucht
// den Zustand wirklich: "Neue Serie" ist ein Umschalten zwischen zwei Feldern, und das kann
// der Browser von sich aus nicht.

/** Kein echter Wert, sondern der Umschalter im Auswahlfeld. */
const NEU = "__neu__";

export function AuswahlFeld({
  name,
  label,
  werte,
  vorgabe,
  leerText,
  neuText,
  platzhalter,
  labelClass,
  eingabeClass,
  vorschlag,
}: {
  /** Feldname im Formular, z. B. "serie". */
  name: string;
  label: string;
  /** Die schon vergebenen Werte, für die Auswahl statt Freitext. */
  werte: string[];
  vorgabe: string | null;
  /** Beschriftung der leeren Wahl, z. B. "Keine Serie". */
  leerText: string;
  /** Beschriftung des Umschalters, z. B. "Neue Serie …". */
  neuText: string;
  platzhalter: string;
  labelClass: string;
  eingabeClass: string;
  /** Aus dem Titel erkannte Serie (siehe SerienVorschlag.tsx) -- ungenutzt beim Verlag. */
  vorschlag?: string | null;
}) {
  // Beim Bearbeiten steht der Wert des Buchs schon da. Er wird ohne Rücksicht auf Groß-
  // und Kleinschreibung gesucht, weil `vergebeneSerien()` über `klein(serie)` gruppiert und
  // damit nur eine Schreibweise je Serie zurückgibt: Ein Buch mit "eragon" fiele bei exaktem
  // Vergleich in die Neuanlage, obwohl die Serie längst in der Liste steht.
  const bekannt = vorgabe
    ? (werte.find((s) => s.toLowerCase() === vorgabe.toLowerCase()) ?? null)
    : null;

  const t = useTexte();
  const [wahl, setWahl] = useState<string>(vorgabe ? (bekannt ?? NEU) : "");
  const [neuerName, setNeuerName] = useState(bekannt ? "" : (vorgabe ?? ""));
  /** Stand das Formular von Anfang an im Eingabemodus? Dann nicht ungefragt den Fokus holen. */
  const [startetImEingabemodus] = useState(() => Boolean(vorgabe) && !bekannt);
  /** Hat der Nutzer das Feld schon selbst bedient? Dann darf ein Vorschlag nichts mehr
   *  überschreiben -- auch nicht die bewusste Wahl "Keine Serie". */
  const [beruehrt, setBeruehrt] = useState(false);

  // Der erkannte Serienvorschlag (siehe SerienVorschlag.tsx) wird während des Renderns aus dem
  // vorhandenen Zustand abgeleitet statt per Effekt nachgetragen -- er soll ja gerade NICHT den
  // eigenen `wahl`-Zustand verändern, solange das Feld unberührt ist, sonst würde ein später
  // eintreffender Vorschlag eine schon getroffene Entscheidung überschreiben.
  const vorschlagsTreffer =
    !beruehrt && wahl === "" && vorschlag
      ? (werte.find((s) => s.toLowerCase() === vorschlag.toLowerCase()) ?? null)
      : null;

  return (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>

      {wahl === NEU ? (
        <>
          <input
            id={name}
            name={name}
            type="text"
            // Nach dem Umschalten steht der Cursor sofort im Feld und am Handy geht die
            // Tastatur auf. Beim ersten Rendern nicht: Dort wäre es ein Sprung, den niemand
            // ausgelöst hat.
            autoFocus={!startetImEingabemodus}
            value={neuerName}
            onChange={(e) => setNeuerName(e.target.value)}
            placeholder={platzhalter}
            className={eingabeClass}
          />
          {werte.length > 0 && (
            <button
              type="button"
              onClick={() => setWahl(bekannt ?? "")}
              className="utility mt-1.5 text-[10px] text-stein underline"
            >
              {t.formular.dochAusDerListe}
            </button>
          )}
        </>
      ) : (
        <select
          id={name}
          name={name}
          value={vorschlagsTreffer ?? wahl}
          onChange={(e) => {
            setBeruehrt(true);
            setWahl(e.target.value);
          }}
          className={eingabeClass}
        >
          <option value="">{leerText}</option>
          {werte.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value={NEU}>{neuText}</option>
        </select>
      )}
    </div>
  );
}
