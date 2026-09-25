import Link from "next/link";
import { CoverPlatzhalter } from "@/components/CoverPlatzhalter";
import { besitzerBadge } from "@/lib/besitzer";
import type { Buch } from "@/lib/buecher";
import { texte } from "@/lib/i18n/server";

/**
 * Eine Kachel im Cover-Grid.
 *
 * Kein Titel und kein Autor unter dem Bild — so verlangt es der Plan, und so machen es
 * Bibliotheks-Apps: Ein Regal erkennt man an den Buchdeckeln, nicht an einer Textliste.
 * Alles, was zusätzlich zu sehen ist, sitzt deshalb ALS Badge auf dem Cover:
 *
 *   • links oben der Besitzer als farbiger Buchstabe,
 *   • rechts oben ein Rost-Punkt, wenn das Buch gerade verliehen ist.
 *
 * Beide tragen zusätzlich Text für Screenreader (sr-only) — ein Buchstabe auf farbigem Grund
 * ist für sich genommen keine Auskunft.
 *
 * 2:3 ist das Seitenverhältnis, dem gedruckte Bücher am nächsten kommen. Weicht ein Cover
 * davon ab, wird es beschnitten statt verzerrt: object-cover.
 */
export async function BuchKachel({ buch }: { buch: Buch }) {
  const t = await texte();
  const badge = besitzerBadge(buch.besitzer);
  const verliehen = Boolean(buch.ausgeliehen_an && buch.ausgeliehen_an.trim() !== "");

  return (
    <Link
      href={`/buch/${buch.id}`}
      className="group relative block overflow-hidden rounded-lg shadow-[0_1px_3px_rgba(43,58,74,.18)]"
    >
      <div className="relative aspect-[2/3]">
        {buch.cover_datei ? (
          /* Cover liegen als Datei neben der Datenbank, nicht in public/ — sie entstehen zur
             Laufzeit und werden über /api/cover ausgeliefert. next/image bringt dafür keinen
             Vorteil. Die Unterdrückung muss unmittelbar über dem Element stehen, sonst gilt
             sie für die Kommentarzeile und nicht für das <img>. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/cover/${buch.cover_datei}`}
            alt={buch.titel}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <CoverPlatzhalter titel={buch.titel} autor={buch.autor} className="h-full w-full" />
        )}

        <span
          className="utility absolute left-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] leading-none shadow-[0_1px_2px_rgba(43,58,74,.35)]"
          style={{ backgroundColor: badge.farbe, color: badge.schrift }}
        >
          <span aria-hidden="true">{badge.kuerzel}</span>
          <span className="sr-only">{t.kachel.gehoert(buch.besitzer)}</span>
        </span>

        {verliehen && (
          <span
            className="absolute right-1 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-md bg-rost shadow-[0_1px_2px_rgba(43,58,74,.35)]"
            title={t.kachel.verliehenAn(buch.ausgeliehen_an ?? "")}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#EFEDE8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6l-6 6" />
            </svg>
            <span className="sr-only">{t.kachel.verliehenAn(buch.ausgeliehen_an ?? "")}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
