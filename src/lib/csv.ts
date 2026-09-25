import "server-only";
import { alleBuecher } from "./buecher";
import { formatiereIsbn } from "./isbn";

// CSV-Export des gesamten Katalogs. Zweck laut Plan: unter anderem Versicherungsnachweis bei
// Verlust oder Schaden — die Datei wird also im Zweifel von jemandem gelesen, der die App nie
// gesehen hat. Deshalb ausgeschriebene Spaltenüberschriften statt Feldnamen.

const SPALTEN = [
  "Titel",
  "Autor",
  "ISBN",
  "Kategorie",
  "Besitzer",
  "Serie",
  "Band",
  "Verlag",
  "Jahr",
  "Ausgeliehen an",
  "Ausgeliehen seit",
  "Erfasst am",
] as const;

/**
 * Setzt ein Feld in Anführungszeichen und verdoppelt darin enthaltene.
 *
 * Der führende Apostroph bei =, +, - und @ ist kein Zierrat: Excel und LibreOffice lesen ein
 * Feld, das so beginnt, als Formel. Ein Buchtitel wie "-Und dann gab es keines mehr" landete
 * ohne diesen Schutz als Fehlerwert in der Tabelle, im schlimmeren Fall als ausgeführter
 * Ausdruck.
 */
function feld(wert: string | number | null): string {
  if (wert === null || wert === undefined) return '""';
  let s = String(wert);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Baut die vollständige CSV-Datei.
 *
 * Zwei Entscheidungen, die beide nur einen Zweck haben — dass ein Doppelklick unter Windows
 * eine lesbare Tabelle zeigt:
 *
 *  • Semikolon als Trennzeichen. Excel in deutscher Lokalisierung erwartet das; mit Komma
 *    landet die ganze Zeile in Spalte A.
 *  • Ein UTF-8-BOM am Anfang. Ohne ihn liest Excel die Datei als Windows-1252, und aus
 *    "Grüffelo" wird "GrÃ¼ffelo".
 */
export function katalogAlsCsv(): string {
  const zeilen = [SPALTEN.map(feld).join(";")];

  for (const b of alleBuecher()) {
    zeilen.push(
      [
        feld(b.titel),
        feld(b.autor),
        feld(b.isbn ? formatiereIsbn(b.isbn) : null),
        feld(b.kategorie),
        feld(b.besitzer),
        feld(b.serie),
        feld(b.band),
        feld(b.verlag),
        feld(b.jahr),
        feld(b.ausgeliehen_an),
        feld(b.ausgeliehen_am),
        feld(b.erstellt_am.slice(0, 10)),
      ].join(";")
    );
  }

  return `﻿${zeilen.join("\r\n")}\r\n`;
}

/** Dateiname mit Datum: buecherfuchs-katalog-2026-09-04.csv */
export function csvDateiname(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `buecherfuchs-katalog-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.csv`;
}
