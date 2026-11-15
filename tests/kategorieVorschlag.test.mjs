// Prüft das Regelwerk der Kategorie-Vorschläge gegen echte Antworten der DNB.
//
// Die XML-Dateien unter tests/dnb sind unveränderte SRU-Antworten (MARC21-xml), abgerufen am
// 15.11.2026. Sie liegen bewusst im Repo statt live abgefragt zu werden: Ein Test, der vom
// Netz und vom Katalogstand der DNB abhängt, schlägt irgendwann aus Gründen fehl, die mit dem
// Code nichts zu tun haben.
//
// Ausführen: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { marcFelder } from "../src/lib/marc.ts";
import { kategorieAusMarc, kategorieAusSignale } from "../src/lib/kategorieVorschlag.ts";
import { KATEGORIEN } from "../src/lib/kategorien.ts";

const ERWARTET = {
  "9783473462889": ["Erstleser", "Leserabe: Zielgruppe Leseanfänger"],
  "9783473462100": ["Erstleser", "Leserabe, den die DNB AUCH als Bilderbuch führt"],
  "9783788677107": ["Sachbuch Kinder", "Was ist was: Kindersachbuch"],
  "9783751205641": ["Jugendbuch", "Tribute von Panem: Jugendbücher ab 12"],
  "9783692670607": ["Roman", "Die Mitternachtsbibliothek: Sachgruppe B"],
  "9783426574096": ["Comic", "Die Mitternachtsbibliothek als Graphic Novel: 741.5"],
  "9783841331557": ["Comic", "Lustiges Taschenbuch"],
  "9783742327437": ["Kochbuch", "Airfryer-Kochbuch: Inhaltsart Kochbuch"],
  "9783570555392": ["Sachbuch", "Harari, Nexus: nur Sachgruppe 300"],
  "9783407792303": ["Bilderbuch", "Der Grüffelo von 1999: alte Sachgruppe in 084"],
  "9789524140607": [null, "Finnische Ausgabe ohne jede Klassifikation"],
  // Seit v0.12.1, aus dem Abgleich mit den von Hand eingeordneten Scans vom 15.11.2026:
  "9783868274219": ["Bilderbuch", "Du bist ein Geschenk des Himmels: Bilderbuch trotz Sachgruppe 230"],
  "9783473418015": ["Sachbuch Kinder", "tiptoi Erste Zahlen: Lernen im Vorschulalter"],
  "9783473418008": ["Sachbuch Kinder", "tiptoi Erste Buchstaben: Lernen im Vorschulalter"],
  "9783473492749": ["Sachbuch Kinder", "tiptoi Lern-Spiel-Welt Buchstaben: Lernen im Vorschulalter"],
};

for (const [isbn, [kategorie, wer]] of Object.entries(ERWARTET)) {
  test(`${wer} → ${kategorie ?? "kein Vorschlag"}`, () => {
    const xml = fs.readFileSync(new URL(`./dnb/${isbn}.xml`, import.meta.url), "utf8");
    assert.equal(kategorieAusMarc(marcFelder(xml)), kategorie);
  });
}

const leer = { sachgruppen: [], merkmale: [], zielgruppen: [] };

test("nur Sachgruppe K → kein Vorschlag statt eines Tipps", () => {
  assert.equal(kategorieAusSignale({ ...leer, sachgruppen: ["K"] }), null);
});

test("K mit Warengruppe bis 11 Jahre → Kinderroman", () => {
  assert.equal(kategorieAusSignale({ ...leer, sachgruppen: ["K"], merkmale: ["kinderbücher bis 11 jahre"] }), "Kinderroman");
});

test("830 ohne B ist Literaturwissenschaft → Sachbuch", () => {
  assert.equal(kategorieAusSignale({ ...leer, sachgruppen: ["830"] }), "Sachbuch");
});

test("Sachgebiet mit Zielgruppe Kind → Sachbuch Kinder", () => {
  assert.equal(kategorieAusSignale({ ...leer, sachgruppen: ["590"], zielgruppen: ["kind"] }), "Sachbuch Kinder");
});

test("Schulbuch (Sachgruppe S) → kein Vorschlag", () => {
  assert.equal(kategorieAusSignale({ ...leer, sachgruppen: ["S"] }), null);
});

test("jeder Vorschlag steht in der Kategorienliste", () => {
  for (const [kategorie] of Object.values(ERWARTET)) {
    if (kategorie !== null) assert.ok(KATEGORIEN.includes(kategorie), kategorie);
  }
});
