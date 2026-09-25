import { Suspense } from "react";
import Link from "next/link";
import { BuchKachel } from "@/components/BuchKachel";
import { KatalogFilter } from "@/components/KatalogFilter";
import { Fuchs } from "@/components/Fuchs";
import { anzahlBuecher, filterAusParams, istLeer, sucheBuecher, vergebeneSerien } from "@/lib/suche";
import { besitzerNamen } from "@/lib/besitzer";

// Der Katalog: die Startseite und zugleich die Suche.
//
// Anders als bei Kochkiste gibt es keinen getrennten Suchbildschirm. Ein Bücherregal betrachtet
// man als Ganzes und greift dann heraus — Suchfeld und Filter stehen deshalb ÜBER demselben
// Grid, das man auch ungefiltert sieht, und nicht auf einer eigenen Seite.

export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  kategorie?: string;
  besitzer?: string;
  serie?: string;
  status?: string;
}>;

export default async function KatalogSeite({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const filter = filterAusParams(params);

  const buecher = sucheBuecher(filter);
  const serien = vergebeneSerien();
  const gesamt = anzahlBuecher();
  const gefiltert = !istLeer(filter);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <Fuchs className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="titel-gross text-[27px]">Bücherfuchs</h1>
          <p className="utility mt-0.5 text-[10px] text-stein">
            {gesamt === 1 ? "1 Buch" : `${gesamt} Bücher`}
          </p>
        </div>
        {/* Der Scan direkt im Kopf, wie beim Spielefuchs (Nicos Wunsch vom 15.09.2026): Wer vor
            dem Regal steht, soll nicht erst in den Reiter "Hinzufügen" wechseln. Führt auf
            dieselbe Seite wie der Reiter — dort öffnet die Kamera. */}
        <Link
          href="/hinzufuegen"
          aria-label="Barcode scannen"
          title="Barcode scannen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tinte text-papier"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 7V5a2 2 0 0 1 2 -2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1 -2 2h-2" />
            <path d="M7 21h-2a2 2 0 0 1 -2 -2v-2" />
            <path d="M7 8v8M10 8v8M13 8v8M16 8v8" />
          </svg>
        </Link>
      </div>

      <div className="mt-5">
        {/* useSearchParams braucht eine Suspense-Grenze, sonst zwingt Next die ganze Seite ins
            clientseitige Rendern. */}
        <Suspense fallback={<div className="h-[132px]" />}>
          <KatalogFilter serien={serien} besitzer={besitzerNamen()} />
        </Suspense>
      </div>

      {buecher.length === 0 ? (
        <LeererKatalog gefiltert={gefiltert} />
      ) : (
        <>
          {gefiltert && (
            <p className="utility mt-4 text-[10px] text-stein">
              {buecher.length === 1 ? "1 Treffer" : `${buecher.length} Treffer`}
            </p>
          )}
          {/* Drei Spalten, große Kacheln — so steht es im Plan. Ab Tablet-Breite vier: Bei 672 px
              Breite wären drei Kacheln je 200 px, das ist kein Regal mehr, sondern ein Plakat. */}
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {buecher.map((buch) => (
              <BuchKachel key={buch.id} buch={buch} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Zwei verschiedene Leerzustände, weil sie zwei verschiedene Dinge bedeuten: "hier war noch
 * nie etwas" braucht einen Weg nach vorn, "diese Filter treffen nichts" braucht einen Weg
 * zurück.
 */
function LeererKatalog({ gefiltert }: { gefiltert: boolean }) {
  if (gefiltert) {
    return (
      <div className="mt-10 text-center">
        <p className="text-sm text-stein">Kein Buch passt zu dieser Auswahl.</p>
        <Link href="/" className="utility mt-3 inline-block text-[10.5px] text-tinte underline">
          Filter zurücksetzen
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 text-center">
      <p className="titel-klein text-[18px]">Das Regal ist noch leer.</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stein">
        Scanne den Barcode auf der Rückseite eines Buchs — Titel, Autor und Cover kommen dann
        von allein.
      </p>
      <Link
        href="/hinzufuegen"
        className="mt-5 inline-flex h-12 items-center rounded-lg bg-tinte px-5 text-base font-semibold text-papier"
      >
        Erstes Buch aufnehmen
      </Link>
    </div>
  );
}
