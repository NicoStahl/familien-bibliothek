"use client";

// Suchfeld und die vier Filter-Auswahlfelder des Katalogs.
//
// Der Zustand steckt in der Adresse, nicht in der Komponente: Ein Serienlink von der
// Buchseite (`/?serie=Eragon`) landet damit auf demselben Weg wie eine Eingabe, der
// Zurück-Knopf des Browsers funktioniert, und ein gefilterter Katalog lässt sich
// weiterschicken. Dieselbe Festlegung wie in Kochkistes Suchfeld.
//
// Bewusst native <select> und keine eigenen Aufklappmenüs: Auf dem iPhone öffnet ein natives
// Auswahlfeld das Rad am unteren Bildschirmrand, das man mit dem Daumen bedient. Jede
// Eigenbau-Lösung ist an dieser Stelle eine Verschlechterung.

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KATEGORIEN } from "@/lib/kategorien";
import { kategorieName } from "@/lib/i18n";
import { useTexte } from "@/components/SpracheProvider";

const TIPP_PAUSE_MS = 250;

const FELD =
  "utility h-10 min-w-0 flex-1 rounded-lg border border-linie bg-karte px-2 text-[10.5px] text-tinte";

export function KatalogFilter({ serien, besitzer }: { serien: string[]; besitzer: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTexte();

  const [eingabe, setEingabe] = useState(params.get("q") ?? "");
  /** Was diese Komponente zuletzt selbst in die Adresse geschrieben hat — siehe unten. */
  const selbstGeschrieben = useRef<string | null>(null);

  function setze(aenderungen: Record<string, string | null>) {
    const neu = new URLSearchParams(params.toString());
    for (const [schluessel, wert] of Object.entries(aenderungen)) {
      if (wert === null || wert === "") neu.delete(schluessel);
      else neu.set(schluessel, wert);
    }
    const query = neu.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Getippt wird mit Verzögerung. Ohne sie liefe pro Buchstabe eine Serveranfrage; 250 ms sind
  // lang genug, dass beim normalen Tippen nur eine bleibt, und kurz genug, dass es sich sofort
  // anfühlt. `replace` statt `push`, damit nicht jeder Buchstabe im Verlauf landet.
  useEffect(() => {
    const id = setTimeout(() => {
      const getippt = eingabe.trim();
      if (getippt === (params.get("q") ?? "")) return;
      selbstGeschrieben.current = getippt;
      setze({ q: getippt || null });
    }, TIPP_PAUSE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- absichtlich nur an der Eingabe
  }, [eingabe]);

  /**
   * Kommt die Suche von außen (Serienlink, Zurück-Knopf), zieht das Feld nach.
   *
   * Die Prüfung auf `selbstGeschrieben` ist der Grund für den Ref: Ohne sie würde die
   * verzögert eingetragene eigene Adresse das Feld zurücksetzen — wer während der 250 ms
   * weitertippt, verlöre die letzten Buchstaben mitten im Wort.
   */
  useEffect(() => {
    const ausDerAdresse = params.get("q") ?? "";
    if (ausDerAdresse === selbstGeschrieben.current) return;
    selbstGeschrieben.current = null;
    setEingabe(ausDerAdresse);
  }, [params]);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stein">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
            <path d="M21 21l-6 -6" />
          </svg>
        </span>
        <input
          type="search"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder={t.filter.suchePlatzhalter}
          aria-label={t.filter.sucheLabel}
          autoComplete="off"
          className="h-12 w-full rounded-lg border border-linie bg-karte pl-10 pr-3 text-base outline-none focus:border-tinte"
        />
      </div>

      <div className="mt-2 flex gap-1.5">
        <select
          aria-label={t.filter.kategorieLabel}
          value={params.get("kategorie") ?? ""}
          onChange={(e) => setze({ kategorie: e.target.value || null })}
          className={FELD}
        >
          <option value="">{t.filter.kategorie}</option>
          {KATEGORIEN.map((k) => (
            <option key={k} value={k}>{kategorieName(t, k)}</option>
          ))}
        </select>

        <select
          aria-label={t.filter.besitzerLabel}
          value={params.get("besitzer") ?? ""}
          onChange={(e) => setze({ besitzer: e.target.value || null })}
          className={FELD}
        >
          <option value="">{t.filter.besitzer}</option>
          {besitzer.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="mt-1.5 flex gap-1.5">
        <select
          aria-label={t.filter.serieLabel}
          value={params.get("serie") ?? ""}
          onChange={(e) => setze({ serie: e.target.value || null })}
          className={FELD}
          // Ohne eine einzige Serie im Katalog wäre das Feld eine leere Versprechung.
          disabled={serien.length === 0}
        >
          <option value="">{t.filter.serie}</option>
          {serien.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          aria-label={t.filter.statusLabel}
          value={params.get("status") ?? ""}
          onChange={(e) => setze({ status: e.target.value || null })}
          className={FELD}
        >
          <option value="">{t.filter.status}</option>
          <option value="verfuegbar">{t.filter.zuhause}</option>
          <option value="verliehen">{t.filter.verliehen}</option>
        </select>
      </div>
    </div>
  );
}
