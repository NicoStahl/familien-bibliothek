import { getCurrentUser } from "@/lib/auth";
import { Fuchs } from "@/components/Fuchs";
import { anzahlBuecher } from "@/lib/suche";
import packageJson from "../../../../package.json";

// Alles, was selten gebraucht wird: Export, Abmelden, Auskunft über die App.

export const dynamic = "force-dynamic";

export const metadata = { title: "Mehr — Bücherfuchs" };

export default async function MehrSeite() {
  const user = await getCurrentUser();
  const gesamt = anzahlBuecher();

  return (
    <div className="px-5 pt-6">
      <h1 className="titel-gross text-[27px]">Mehr</h1>

      <section className="mt-6">
        <h2 className="utility text-[10px] text-stein">Export</h2>
        <div className="mt-2 rounded-xl border border-linie-zart bg-karte p-4">
          <p className="text-sm leading-relaxed text-tinte">
            Der gesamte Katalog als CSV-Datei — unter anderem als Nachweis für die Versicherung,
            falls einmal etwas abhandenkommt.
          </p>
          <p className="utility mt-2 text-[9.5px] text-stein">
            {gesamt === 1 ? "1 Zeile" : `${gesamt} Zeilen`} · Semikolon-getrennt, für Excel
          </p>
          {/* Ein normaler Link, kein fetch: Der Browser lädt die Datei damit selbst herunter,
              samt Dateiname aus dem Content-Disposition-Header. */}
          <a
            href="/api/export"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier"
          >
            Katalog exportieren
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="utility text-[10px] text-stein">Anmeldung</h2>
        <div className="mt-2 rounded-xl border border-linie-zart bg-karte p-4">
          <p className="text-sm text-tinte">
            Angemeldet als <strong className="font-semibold">{user?.display_name ?? user?.username}</strong>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-stein">
            Die Anmeldung läuft über das DSM-Konto. Abmelden beendet nur die Sitzung im
            Bücherfuchs — an DSM selbst bleibst du angemeldet.
          </p>
          <a
            href="/api/auth/logout"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-lg border border-linie text-sm font-semibold text-tinte"
          >
            Abmelden
          </a>
        </div>
      </section>

      <section className="mt-8 pb-4">
        <h2 className="utility text-[10px] text-stein">Über die App</h2>
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-linie-zart bg-karte p-4">
          <Fuchs className="h-11 w-11 shrink-0" />
          <div>
            <p className="titel-klein text-[16px]">Bücherfuchs</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stein">
              Die Familienbibliothek. Läuft auf dem eigenen Server, die Daten verlassen das
              Haus nicht.
            </p>
            {/* Liest die Version direkt aus package.json statt sie hier ein zweites Mal
                hinzuschreiben -- genau das Auseinanderlaufen ist zuvor passiert: Die Zahl
                stand hier fest auf "0.3", während package.json längst bei 0.5 war. */}
            <p className="utility mt-2 text-[9.5px] text-stein">Version {packageJson.version}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
