# Design-Referenz Bücherfuchs

## Palette „Nachtlese"

Die drei Farben aus dem Umsetzungsplan, dazu drei abgeleitete. Verbindlich ist
`src/app/globals.css`; hier steht, warum sie so aussehen.

| Rolle | Wert | Verwendung |
|---|---|---|
| `--tinte` | `#2B3A4A` | Text **und** Akzentfarbe. Anders als bei Kochkiste dasselbe: Tinte auf Papier ist das Bild, von dem die App ihren Namen hat. 9.9:1 auf Papier. |
| `--papier` | `#EFEDE8` | Grund. |
| `--messing` | `#B8924A` | Akzentflächen, Linien, der Streifen am Cover-Platzhalter. **Nicht für Text** — siehe unten. |
| `--stein` | `#6B6A63` | Sekundärtext. Bewusst dunkler als Kochkistes Pendant: erreicht so 4.64:1 auf dem helleren Papier und trägt damit auch die kleinen Metazeilen (ISBN, Verlag, Jahr). |
| `--rost` | `#A4462A` | Ausschließlich „verliehen". Eigene Farbe, keine Abwandlung des Messings: Der Status muss sich im Grid auf einen Blick von den Besitzerfarben unterscheiden, und Gold neben Gold täte das nicht. |
| `--karte` | `#FFFFFF` | Kartenflächen. |

### Warum Messing keine Textfarbe ist

Gold ist ein Mittelton. `#B8924A` erreicht gegen Papier nur 2.5:1, und tintenblaue Schrift
darauf nur 3.95:1 — beides zu wenig. Deshalb ist das Bronze der Besitzer-Palette dunkel (`#7A5C1C`,
5.3:1 mit papiergrauer Schrift) statt des Palettengoldes. Das echte Messing bleibt der App als
Akzent für Flächen und Linien erhalten.

### Besitzerfarben

Die Besitzer selbst stehen in der Umgebungsvariable `BESITZER`; wer dort keine eigene Farbe
angibt, bekommt reihum eine aus dieser Palette (`src/lib/besitzer.ts`). Alle tragen
papiergraue Schrift und liegen über 5:1. Bei Badges von 22 px zählt jeder Punkt, weil der
Buchstabe klein und die Fläche daneben bunt ist.

| # | Farbe | Kontrast |
|---|---|---|
| 1 | `#4A6B57` Moosgrün | 5.08:1 |
| 2 | `#7A5C1C` Bronze | 5.32:1 |
| 3 | `#8A4B62` Beere | 5.50:1 |
| 4 | `#2B3A4A` Tinte | 9.93:1 |
| 5 | `#5A4E7A` Pflaume | 6.40:1 |
| 6 | `#6B4A3A` Nussbraun | 6.73:1 |

## Typografie

Dieselben vier Schriften wie bei Kochkiste, selbst ausgeliefert aus `src/fonts/`:

- **Fraunces** — Überschriften und Buchtitel (`.titel-gross`, `.titel-klein`)
- **Public Sans** — Fließtext, Formulare
- **IBM Plex Mono** — ISBN, Bandnummern, Jahreszahlen, Filterchips (`.utility`)
- **Caveat** — ausschließlich der Ausleihvermerk („an Familie Bauer"), `.hand`

## Kein Dunkelmodus

Dieselbe Entscheidung wie bei Kochkiste, aus einem verwandten Grund: Ein Cover-Grid lebt davon,
dass die Buchdeckel die einzigen Farbflächen sind. Auf dunklem Grund leuchten sie nicht mehr,
sie flackern. Das ist eine Entscheidung, keine Lücke.

## Icons

SVG-only, inline, im Tabler-Outline-Stil: 24er Raster, Strichstärke 2, runde Enden,
`stroke="currentColor"`. Keine Icon-Bibliothek — für eine Handvoll Symbole lohnt keine
Abhängigkeit. In `components/NavIcons.tsx` und `components/IconButton.tsx`.

## App-Icon

Das endgültige Icon liegt seit dem 04.09.2026 vor: ein lesender Fuchs mit blauem Buch, von Nico
extern erstellen lassen. Der SVG-Platzhalter von vorher ist ersetzt.

Geliefert wurde zweimal — zuerst mit eingebranntem blauem Kasten, dann **freigestellt mit
Alphakanal** (582 × 630, Motiv bei x 7–579, y 6–621). Verwendet wird die freigestellte Fassung;
sie ist die brauchbarere, weil sich daraus beides erzeugen lässt: der Fuchs ohne Grund für die
Oberfläche und der Fuchs auf eigenem Grund fürs Betriebssystem.

### Die beiden Fassungen

**Freigestellt** — `design/app-icon-fuchs.png` (616 × 616, transparent). Daraus
`public/fuchs.png` (384 px), das `components/Fuchs.tsx` in Katalog-Kopfzeile, Dev-Login und
„Mehr" zeigt. Ohne Grund und ohne Ecken: Der Fuchs sitzt direkt auf dem Papier der App. Ein
Icon mit eigenem Kasten säße dort als Fremdkörper neben der Wortmarke — und genau daran hätte
sich die Farbsprache des Icons mit der der App gerieben.

**Deckend** — `design/app-icon-symbol.png` (1024 × 1024). Derselbe Fuchs auf tintenblauem
Quadrat (`#2B3A4A`), Motiv auf 80 % der Kante. Zwei Gründe für den Grund: iOS setzt ein
transparentes Startbildschirm-Symbol auf Schwarz, und im hellen Browser-Tab braucht das Symbol
bei 16 px eine dunkle Fläche, um überhaupt als Form zu erscheinen. Tinte ist dabei nicht
irgendeine dunkle Farbe, sondern die Hauptfarbe der App — damit ist die Kluft zwischen Icon und
Palette geschlossen, die die erste Lieferung noch aufgemacht hatte.

**Ohne eigene Rundung.** iOS und die Android-Starter legen ihre eigene Maske über das Symbol;
mitgelieferte runde Ecken ergäben doppelt gerundete. Deshalb ein vollflächiges Quadrat.

| Datei | Größe | Wofür |
|---|---|---|
| `public/fuchs.png` | 384, transparent | die Oberfläche (`components/Fuchs.tsx`) |
| `src/app/icon.png` | 512, deckend | Browser-Tab und Lesezeichen (Next-Metadatendatei) |
| `src/app/apple-icon.png` | 180, deckend | iOS-Startbildschirm |
| `public/icon-192.png` | 192, deckend | Manifest |
| `public/icon-512.png` | 512, deckend | Manifest |

Alle fünf lassen sich jederzeit aus den beiden Vorlagen in diesem Ordner neu rechnen — es ist
ein `sharp(vorlage).resize(n, n).toFile(...)` je Zeile. Soll der Grund des Symbols eine andere
Farbe bekommen, ist das eine Konstante im Erzeugungsschritt.
