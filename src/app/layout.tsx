import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { aktuelleSprache, texte } from "@/lib/i18n/server";
import { SpracheProvider } from "@/components/SpracheProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await texte();
  return { title: "Bücherfuchs", description: t.appBeschreibung };
}

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

// `lang` folgt der Sprache der Oberfläche. Das ist mehr als Formsache: Die Silbentrennung der
// Cover-Platzhalter (hyphens-auto) richtet sich danach.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const sprache = await aktuelleSprache();
  return (
    <html lang={sprache} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <SpracheProvider sprache={sprache}>{children}</SpracheProvider>
      </body>
    </html>
  );
}
