import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bücherfuchs",
  description: "Die Familienbibliothek mit Barcode-Scanner",
};

// Seit Next 15 ist `viewport` ein eigener Export, nicht mehr Teil von `metadata`.
//
// `viewportFit: "cover"` ist die Voraussetzung dafür, dass `env(safe-area-inset-bottom)` in der
// Tab-Leiste überhaupt einen Wert liefert — ohne diese Zeile liegt die Leiste auf iPhones unter
// dem Home-Balken.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Nur ein Wert: Die App hat bewusst keinen Dunkelmodus (siehe globals.css).
  themeColor: "#efede8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
