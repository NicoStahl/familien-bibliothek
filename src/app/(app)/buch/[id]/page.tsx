import Link from "next/link";
import { notFound } from "next/navigation";
import { SeitenKopf } from "@/components/SeitenKopf";
import { CoverPlatzhalter } from "@/components/CoverPlatzhalter";
import { AusleihFormular } from "@/components/AusleihFormular";
import { BuchLoeschen } from "@/components/BuchLoeschen";
import { PencilIcon } from "@/components/IconButton";
import { holeBuch } from "@/lib/buecher";
import { besitzerBadge } from "@/lib/besitzer";
import { formatiereIsbn } from "@/lib/isbn";

// Die Buchseite. Hier steht alles, was im Grid bewusst NICHT steht — Titel, Autor, Serie,
// und die Detail-Angaben Verlag, Jahr und ISBN, die laut Plan reine Information sind und
// keine Filter.

export const dynamic = "force-dynamic";

export default async function BuchSeite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buch = holeBuch(Number(id));
  if (!buch) notFound();

  const badge = besitzerBadge(buch.besitzer);

  return (
    <div className="pb-6">
      <SeitenKopf titel={buch.titel} zurueck="/" zurueckLabel="Katalog" />

      <div className="px-5">
        {buch.autor && <p className="mt-2 text-[15px] text-stein">{buch.autor}</p>}

        <div className="mt-5 flex gap-5">
          <div className="w-[132px] shrink-0 overflow-hidden rounded-lg shadow-[0_2px_6px_rgba(43,58,74,.2)]">
            <div className="aspect-[2/3]">
              {buch.cover_datei ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/cover/${buch.cover_datei}`}
                  alt={`Cover von ${buch.titel}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CoverPlatzhalter titel={buch.titel} autor={buch.autor} className="h-full w-full" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="utility flex h-6 w-6 items-center justify-center rounded-md text-[11px] leading-none"
                style={{ backgroundColor: badge.farbe, color: badge.schrift }}
                aria-hidden="true"
              >
                {badge.kuerzel}
              </span>
              <span className="text-[14px] text-tinte">Gehört {buch.besitzer}</span>
            </div>

            <p className="utility mt-3 text-[10px] text-stein">{buch.kategorie}</p>

            {buch.serie && (
              <p className="mt-3 text-[14px] leading-snug">
                <Link href={`/serien/${encodeURIComponent(buch.serie)}`} className="text-tinte underline">
                  {buch.serie}
                </Link>
                {buch.band !== null && <span className="text-stein"> — Band {buch.band}</span>}
              </p>
            )}

            <dl className="mt-4 space-y-1.5 text-[12.5px]">
              {buch.verlag && <Zeile bezeichnung="Verlag" wert={buch.verlag} />}
              {buch.jahr !== null && <Zeile bezeichnung="Jahr" wert={String(buch.jahr)} />}
              {buch.isbn && <Zeile bezeichnung="ISBN" wert={formatiereIsbn(buch.isbn)} mono />}
            </dl>
          </div>
        </div>

        <div className="mt-6">
          <AusleihFormular
            id={buch.id}
            ausgeliehenAn={buch.ausgeliehen_an}
            ausgeliehenAm={buch.ausgeliehen_am}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-linie-zart pt-3">
          <Link
            href={`/buch/${buch.id}/bearbeiten`}
            title="Buch bearbeiten"
            className="inline-flex h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-tinte"
          >
            <PencilIcon />
            Bearbeiten
          </Link>
          <BuchLoeschen id={buch.id} titel={buch.titel} />
        </div>
      </div>
    </div>
  );
}

function Zeile({ bezeichnung, wert, mono }: { bezeichnung: string; wert: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="utility w-[52px] shrink-0 pt-[3px] text-[9.5px] text-stein">{bezeichnung}</dt>
      {/* Die ISBN darf nicht umbrechen. Mit der Sperrung der .utility-Klasse ist sie auf einem
          375-px-Bildschirm genau zwei Pixel zu breit für die schmale Spalte neben dem Cover und
          bricht nach der vorletzten Gruppe um — eine 13-stellige Nummer über zwei Zeilen liest
          niemand als eine Zahl. `tracking-normal` nimmt die Sperrung nur hier zurück. */}
      <dd
        className={
          mono
            ? "utility whitespace-nowrap text-[11px] tracking-normal text-tinte"
            : "text-tinte"
        }
      >
        {wert}
      </dd>
    </div>
  );
}
