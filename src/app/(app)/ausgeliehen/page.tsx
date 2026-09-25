import Link from "next/link";
import { CoverPlatzhalter } from "@/components/CoverPlatzhalter";
import { listeAusgeliehen } from "@/lib/buecher";
import { langesDatum, seitWann } from "@/lib/datum";
import { texte } from "@/lib/i18n/server";

// Was gerade nicht im Regal steht.
//
// Bewusst eine Liste und kein Grid: Hier zählt nicht das Cover, sondern die Zeile "bei wem,
// seit wann". Das am längsten verliehene Buch steht oben — die einzige Sortierung, die zu der
// Frage passt, die man an diese Seite stellt.

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await texte();
  return { title: t.seitentitel(t.verliehenSeite.titel) };
}

export default async function AusgeliehenSeite() {
  const t = await texte();
  const buecher = listeAusgeliehen();

  return (
    <div className="px-5 pt-6">
      <h1 className="titel-gross text-[27px]">{t.verliehenSeite.titel}</h1>

      {buecher.length === 0 ? (
        <p className="mt-10 text-center text-sm text-stein">
          {t.verliehenSeite.alleZuhause}
        </p>
      ) : (
        <>
          <p className="utility mt-2 text-[10px] text-stein">
            {t.verliehenSeite.unterwegs(buecher.length)}
          </p>

          <ul className="mt-5 space-y-3">
            {buecher.map((b) => (
              <li key={b.id}>
                <Link href={`/buch/${b.id}`} className="flex gap-3 rounded-xl border border-linie-zart bg-karte p-3">
                  <div className="w-12 shrink-0 overflow-hidden rounded shadow-[0_1px_2px_rgba(43,58,74,.18)]">
                    <div className="relative aspect-[2/3]">
                      {b.cover_datei ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/cover/${b.cover_datei}`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <CoverPlatzhalter titel={b.titel} klein className="relative h-full w-full" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="titel-klein text-[15px]">{b.titel}</p>
                    {b.autor && <p className="mt-0.5 text-[12.5px] text-stein">{b.autor}</p>}
                    <p className="hand mt-1.5 text-rost">{t.ausleihe.bei(b.ausgeliehen_an ?? "")}</p>
                    <p className="utility mt-1 text-[9.5px] text-stein">
                      {seitWann(t, b.ausgeliehen_am) ?? langesDatum(t, b.ausgeliehen_am) ?? t.datum.ohneDatum}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
