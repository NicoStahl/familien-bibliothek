import { getCurrentUser } from "@/lib/auth";
import { Fuchs } from "@/components/Fuchs";
import { anzahlBuecher } from "@/lib/suche";
import { SPRACHEN, woerterbuch } from "@/lib/i18n";
import { texte } from "@/lib/i18n/server";
import { setzeSprache } from "@/lib/spracheActions";
import packageJson from "../../../../package.json";

// Alles, was selten gebraucht wird: Export, Abmelden, Auskunft über die App.

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await texte();
  return { title: t.seitentitel(t.mehr.titel) };
}

export default async function MehrSeite() {
  const user = await getCurrentUser();
  const gesamt = anzahlBuecher();
  const t = await texte();

  return (
    <div className="px-5 pt-6">
      <h1 className="titel-gross text-[27px]">{t.mehr.titel}</h1>

      <section className="mt-6">
        <h2 className="utility text-[10px] text-stein">{t.mehr.export}</h2>
        <div className="mt-2 rounded-xl border border-linie-zart bg-karte p-4">
          <p className="text-sm leading-relaxed text-tinte">
            {t.mehr.exportText}
          </p>
          <p className="utility mt-2 text-[9.5px] text-stein">
            {t.mehr.zeilen(gesamt)} · {t.mehr.exportFormat}
          </p>
          {/* Ein normaler Link, kein fetch: Der Browser lädt die Datei damit selbst herunter,
              samt Dateiname aus dem Content-Disposition-Header. */}
          <a
            href="/api/export"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier"
          >
            {t.mehr.exportieren}
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="utility text-[10px] text-stein">{t.mehr.sprache}</h2>
        {/* Jede Sprache in ihrem eigenen Namen ("English", nicht "Englisch"): Wer die aktuelle
            Sprache nicht liest, muss die eigene trotzdem finden. */}
        <form action={setzeSprache} className="mt-2 rounded-xl border border-linie-zart bg-karte p-4">
          <div className="flex gap-2">
            {SPRACHEN.map((s) => {
              const aktiv = s === t.sprache;
              return (
                <button
                  key={s}
                  type="submit"
                  name="sprache"
                  value={s}
                  lang={s}
                  aria-pressed={aktiv}
                  className={`h-11 flex-1 rounded-lg text-sm font-semibold ${
                    aktiv ? "bg-tinte text-papier" : "border border-linie text-tinte"
                  }`}
                >
                  {woerterbuch(s).sprachname}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-stein">{t.mehr.spracheText}</p>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="utility text-[10px] text-stein">{t.mehr.anmeldung}</h2>
        <div className="mt-2 rounded-xl border border-linie-zart bg-karte p-4">
          <p className="text-sm text-tinte">
            {t.mehr.angemeldetAls} <strong className="font-semibold">{user?.display_name ?? user?.username}</strong>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-stein">
            {t.mehr.anmeldungText}
          </p>
          <a
            href="/api/auth/logout"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-lg border border-linie text-sm font-semibold text-tinte"
          >
            {t.mehr.abmelden}
          </a>
        </div>
      </section>

      <section className="mt-8 pb-4">
        <h2 className="utility text-[10px] text-stein">{t.mehr.ueber}</h2>
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-linie-zart bg-karte p-4">
          <Fuchs className="h-11 w-11 shrink-0" />
          <div>
            <p className="titel-klein text-[16px]">Bücherfuchs</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stein">
              {t.mehr.ueberText}
            </p>
            {/* Liest die Version direkt aus package.json statt sie hier ein zweites Mal
                hinzuschreiben -- genau das Auseinanderlaufen ist zuvor passiert: Die Zahl
                stand hier fest auf "0.3", während package.json längst bei 0.5 war. */}
            <p className="utility mt-2 text-[9.5px] text-stein">{t.mehr.version(packageJson.version)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
