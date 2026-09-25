import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeitenKopf } from "@/components/SeitenKopf";
import { SerieUmbenennen } from "@/components/SerieUmbenennen";
import { BuchKachel } from "@/components/BuchKachel";
import { buecherDerSerie } from "@/lib/buecher";
import { serienVorschlaege } from "@/lib/buchapi";
import { stoerungsText } from "@/lib/stoerung";
import { texte } from "@/lib/i18n/server";

// Eine Serie: was davon im Regal steht, und darunter unverbindliche Vorschläge, was es sonst
// noch geben könnte.
//
// Der Plan ist an dieser Stelle ungewöhnlich deutlich, und daran hält sich diese Seite: Die
// Vorschlagsliste ist eine ANREGUNG ("das könnten weitere Bände sein"), kein Abgleich. Es gibt
// keinen Zähler, keine Häkchen und keine Behauptung, die Liste sei vollständig — die
// Trefferqualität der API gibt das nicht her. Der Abgleich bleibt beim Menschen davor.

export const dynamic = "force-dynamic";

export default async function SerienDetailSeite({ params }: { params: Promise<{ serie: string }> }) {
  const { serie } = await params;
  const name = decodeURIComponent(serie);
  const buecher = buecherDerSerie(name);
  if (buecher.length === 0) notFound();
  const t = await texte();

  return (
    <div className="pb-4">
      <SeitenKopf
        titel={name}
        titelZeile={<SerieUmbenennen name={name} />}
        zurueck="/serien"
        zurueckLabel={t.serien.titel}
        untertitel={t.serien.imRegal(buecher.length)}
      />

      <div className="px-5">
        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {buecher.map((b) => (
            <div key={b.id}>
              <BuchKachel buch={b} />
              {b.band !== null && (
                <p className="utility mt-1.5 text-center text-[9.5px] text-stein">{t.serien.band(b.band)}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-9 border-t border-linie-zart pt-5">
          <h2 className="titel-klein text-[17px]">{t.serien.koennteDazugehoeren}</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-stein">
            {t.serien.vorschlagHinweis}
          </p>

          {/* Eigene Suspense-Grenze: Der API-Aufruf dauert bis zu acht Sekunden, und solange
              soll das Regal oben nicht auf sich warten lassen. */}
          <Suspense fallback={<p className="mt-4 text-sm text-stein">{t.serien.wirdGesucht}</p>}>
            <Vorschlaege serie={name} vorhandeneTitel={buecher.map((b) => b.titel)} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Vorschlaege({
  serie,
  vorhandeneTitel,
}: {
  serie: string;
  vorhandeneTitel: string[];
}) {
  const { quelle, vorschlaege: alle, stoerungen } = await serienVorschlaege(serie);
  const t = await texte();

  // Was schon im Regal steht, gehört nicht in eine Kaufanregung. Verglichen wird über den
  // kleingeschriebenen Titel und nicht über die ISBN: Der vorhandene Band ist oft eine andere
  // Ausgabe als die, die Google zuerst nennt — über die ISBN würde er durchrutschen und
  // stünde dann als Vorschlag da, obwohl er zwei Zentimeter weiter oben liegt.
  const bekannt = new Set(vorhandeneTitel.map((t) => t.toLowerCase()));
  const offen = alle.filter((v) => !bekannt.has(v.titel.toLowerCase())).slice(0, 8);

  if (offen.length === 0) {
    // Dieselbe Unterscheidung wie beim Scan: Eine leere Liste, weil die Dienste schweigen, ist
    // keine Aussage über die Serie.
    const hinweis = stoerungsText(t, stoerungen);
    return hinweis ? (
      <p className="mt-4 rounded-lg border border-rost/40 bg-rost/5 p-3 text-sm leading-relaxed text-tinte">
        {hinweis}
      </p>
    ) : (
      <p className="mt-4 text-sm text-stein">
        {t.serien.keineWeiteren}
      </p>
    );
  }

  return (
    <>
      <p className="utility mt-3 text-[9.5px] text-stein">{t.serien.quelle(quelle ?? "")}</p>
      <ul className="mt-3 space-y-3">
        {offen.map((v, i) => (
          <li
            key={`${v.isbn ?? v.titel}-${i}`}
            className="flex gap-3 rounded-xl border border-linie-zart bg-karte p-3"
          >
            {v.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.coverUrl} alt="" className="h-[72px] w-12 shrink-0 rounded object-cover" />
            ) : (
              <div className="h-[72px] w-12 shrink-0 rounded bg-papier" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="titel-klein text-[14.5px]">{v.titel}</p>
              {v.autor && <p className="mt-0.5 text-[12px] text-stein">{v.autor}</p>}
              <p className="utility mt-1 text-[9.5px] text-stein">
                {[v.jahr, v.isbn].filter(Boolean).join(" · ") || t.serien.ohneAngaben}
              </p>
              {v.isbn && (
                <Link
                  href={`/hinzufuegen/erfassen?isbn=${v.isbn}`}
                  className="utility mt-1.5 inline-block text-[9.5px] text-tinte underline"
                >
                  {t.serien.habenWir}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
