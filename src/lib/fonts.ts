import localFont from "next/font/local";

// Dieselben vier Schriften wie bei Kochkiste, aus demselben Grund selbst ausgeliefert und
// nicht über Google Fonts geladen: Das wäre der einzige Fremdaufruf beim Seitenaufbau. Die
// Dateien sind auf den lateinischen Zeichensatz reduziert.
//
// Die Variablennamen tragen bewusst den Schriftnamen, nicht die Rolle: Tailwind 4 benutzt
// --font-* selbst als Theme-Schlüssel, ein --font-display hier würde sich in globals.css
// zu "--font-display: var(--font-display)" selbst referenzieren. Die Rollenzuordnung
// (display/sans/mono/hand) passiert dort im @theme-Block.

/** Buchtitel und Überschriften. Variable Achse opsz steuert den Strichkontrast. */
export const fraunces = localFont({
  src: "../fonts/fraunces.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
});

/** Fließtext: Autorennamen, Bedienelemente, Formulare. */
export const publicSans = localFont({
  src: "../fonts/publicsans.woff2",
  variable: "--font-publicsans",
  weight: "400 700",
  display: "swap",
});

/**
 * Metadaten: ISBN, Bandnummer, Erscheinungsjahr, Filterchips. Nur ein Schnitt (400)
 * eingebettet — höhere Gewichte würde der Browser künstlich fetten, was in einer Monospace
 * besonders unschön aussieht. Für Betonung stattdessen Laufweite und Farbe nutzen.
 */
export const plexMono = localFont({
  src: "../fonts/plexmono.woff2",
  variable: "--font-plexmono",
  weight: "400",
  display: "swap",
});

/** Nur für den Ausleih-Vermerk auf der Buchseite: der einzige handschriftliche Ton der App. */
export const caveat = localFont({
  src: "../fonts/caveat.woff2",
  variable: "--font-caveat",
  weight: "400 700",
  display: "swap",
});

export const fontVariables = [
  fraunces.variable,
  publicSans.variable,
  plexMono.variable,
  caveat.variable,
].join(" ");
