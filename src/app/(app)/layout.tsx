import { requireUser } from "@/lib/auth";
import { TabBar } from "@/components/TabBar";

// Alles unterhalb dieser Route-Gruppe setzt eine Anmeldung voraus. requireUser leitet
// andernfalls auf /api/auth/login um, das je nach Konfiguration zu DSM-SSO oder (nur
// außerhalb von Produktion) zum Dev-Login-Formular führt.
//
// Die Prüfung hier allein reicht NICHT: Bei einer RSC-Navigation rendert Next.js nur die
// Segmente, die der Client laut Next-Router-State-Tree noch nicht hat — und dieser Header ist
// frei wählbar. Wer behauptet, das (app)-Layout schon zu haben, überspringt es samt diesem
// Aufruf. Deshalb ruft jede Seite (und jedes generateMetadata, das die Datenbank liest)
// requireUser() noch einmal selbst auf. Neue Seiten unter (app) müssen das ebenfalls tun.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="hat-tabbar min-h-dvh">
      {/* 672 px statt der 512 px der Kochkiste: Ein Cover-Grid nutzt Breite, ein Rezept nicht.
          Am Rechner bekommt der Katalog damit vier Spalten (siehe page.tsx), Formulare und
          Detailseiten bleiben lesbar schmal. Die Tab-Leiste deckelt auf dieselbe Breite. */}
      <main className="mx-auto max-w-2xl">{children}</main>
      <TabBar />
    </div>
  );
}
