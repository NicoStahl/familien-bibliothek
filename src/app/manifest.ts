import type { MetadataRoute } from "next";

// Web-App-Manifest: sorgt dafür, dass "Zum Startbildschirm hinzufügen" einen richtigen Namen
// bekommt und die App danach ohne Browserleiste startet. Genau so soll der Bücherfuchs benutzt
// werden — der Scanner braucht die Kamera, und die will man nicht durch eine Browserleiste
// hindurch bedienen.
//
// Hinweis für später: Im Standalone-Modus hat iOS eine eigene Cookie-Partition. Die Anmeldung
// aus dem Safari-Browser gilt dort nicht; deshalb die lange Session-Laufzeit in auth.ts.
//
// Die Symbole kommen aus public/ und nicht aus den Next-Metadaten-Dateien (app/icon.png,
// app/apple-icon.png): Deren Adressen tragen einen Build-Hash, im Manifest brauchen sie aber
// eine feste. Beide Wege sind gewollt und liegen nebeneinander — app/icon.png bedient
// Browser-Tab und Lesezeichen, app/apple-icon.png das iOS-Startbildschirmsymbol, und die
// beiden hier das Manifest für Android.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bücherfuchs",
    short_name: "Bücherfuchs",
    description: "Die Familienbibliothek mit Barcode-Scanner",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#efede8",
    theme_color: "#efede8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
