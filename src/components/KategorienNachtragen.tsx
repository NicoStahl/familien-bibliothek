"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTexte } from "@/components/SpracheProvider";
import { kategorieName } from "@/lib/i18n";
import { trageKategorienNach, type NachtragSchritt } from "@/lib/kategorieActions";

type Stand = {
  /** Wie viele Bücher beim Start offen waren — die Zahl unter dem Knopf ändert sich unterwegs. */
  gesamt: number;
  geprueft: number;
  eingeordnet: NachtragSchritt["eingeordnet"];
  laeuft: boolean;
  stoerung: boolean;
};

/**
 * Knopf und Fortschritt der Nachkategorisierung auf der Mehr-Seite.
 *
 * Der Browser treibt die Schleife: Jeder Aufruf der Server Action ordnet einen kleinen Schwung
 * ein und sagt, wo es weitergeht (Begründung in kategorieActions.ts). Danach steht die Liste
 * der eingeordneten Bücher da, jedes mit Link — ein Vorschlag kann danebenliegen, und dann soll
 * die Korrektur einen Fingertipp entfernt sein.
 */
export function KategorienNachtragen({ offen }: { offen: number }) {
  const t = useTexte();
  const router = useRouter();
  const [stand, setStand] = useState<Stand | null>(null);

  async function starte() {
    let jetzt: Stand = { gesamt: offen, geprueft: 0, eingeordnet: [], laeuft: true, stoerung: false };
    setStand(jetzt);

    let ab = 0;
    try {
      for (;;) {
        const schritt = await trageKategorienNach(ab);
        jetzt = {
          ...jetzt,
          geprueft: jetzt.geprueft + schritt.geprueft,
          eingeordnet: [...jetzt.eingeordnet, ...schritt.eingeordnet],
          stoerung: schritt.stoerung,
        };
        setStand(jetzt);
        if (schritt.weiterAb === null) break;
        ab = schritt.weiterAb;
      }
    } catch {
      // Ein abgebrochener Aufruf (Netz weg, Server neu gestartet) sieht für die Familie genauso
      // aus wie eine schweigende DNB: Es ging nicht weiter, Bisheriges ist gespeichert.
      jetzt = { ...jetzt, stoerung: true };
    }
    setStand({ ...jetzt, laeuft: false });
    // Holt die Zahl der noch offenen Bücher neu vom Server.
    router.refresh();
  }

  const laeuft = stand?.laeuft ?? false;

  return (
    <div>
      <p className="utility mt-2 text-[9.5px] text-stein">
        {offen > 0 ? t.mehr.kategorienOffen(offen) : t.mehr.kategorienKeine}
      </p>

      {(offen > 0 || laeuft) && (
        <button
          type="button"
          onClick={starte}
          disabled={laeuft}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier disabled:opacity-60"
        >
          {laeuft && stand ? t.mehr.kategorienLaeuft(stand.geprueft, stand.gesamt) : t.mehr.kategorienStarten}
        </button>
      )}

      {stand && !laeuft && (
        <div className="mt-4" aria-live="polite">
          <p className="text-sm leading-relaxed text-tinte">
            {t.mehr.kategorienFertig(stand.eingeordnet.length, stand.geprueft - stand.eingeordnet.length)}
          </p>
          {stand.stoerung && (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-stein">{t.mehr.kategorienStoerung}</p>
          )}
          {stand.eingeordnet.length > 0 && (
            <>
              <p className="mt-3 text-[12.5px] leading-relaxed text-stein">{t.mehr.kategorienListe}</p>
              <ul className="mt-2 divide-y divide-linie-zart">
                {stand.eingeordnet.map((b) => (
                  <li key={b.id}>
                    <Link href={`/buch/${b.id}`} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="text-sm text-tinte">{b.titel}</span>
                      <span className="utility shrink-0 text-[9.5px] text-stein">{kategorieName(t, b.kategorie)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
