import Link from "next/link";
import { listeSerien } from "@/lib/buecher";

// Übersicht aller Serien im Regal.
//
// Die Lücken-Angabe rechnet ausschließlich mit dem, was dasteht: Wer die Bände 1, 2 und 5
// besitzt, dem fehlen 3 und 4 — das ist eine Tatsache, keine Schätzung. Was NICHT hier steht,
// ist "5 von 12", denn wie viele Bände eine Serie hat, weiß hier niemand verlässlich. Genau
// diese Grenze zieht der Plan.

export const dynamic = "force-dynamic";

export const metadata = { title: "Serien — Bücherfuchs" };

/** Die fehlenden Nummern zwischen der kleinsten und der größten vorhandenen. */
function luecken(baende: string | null): number[] {
  if (!baende) return [];
  const zahlen = baende
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (zahlen.length < 2) return [];

  const vorhanden = new Set(zahlen);
  const fehlend: number[] = [];
  for (let n = Math.min(...zahlen); n < Math.max(...zahlen); n++) {
    if (!vorhanden.has(n)) fehlend.push(n);
  }
  return fehlend;
}

export default function SerienSeite() {
  const serien = listeSerien();

  return (
    <div className="px-5 pt-6">
      <h1 className="titel-gross text-[27px]">Serien</h1>
      <p className="mt-2 text-sm leading-relaxed text-stein">
        Alles, was zu einer Reihe gehört — und was dazwischen fehlt.
      </p>

      {serien.length === 0 ? (
        <p className="mt-10 text-center text-sm text-stein">
          Noch keine Serie im Regal. Sobald bei einem Buch eine Serie eingetragen ist, taucht
          sie hier auf.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-linie-zart border-y border-linie-zart">
          {serien.map((s) => {
            const fehlend = luecken(s.baende);
            return (
              <li key={s.serie}>
                <Link
                  href={`/serien/${encodeURIComponent(s.serie)}`}
                  className="flex items-center gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="titel-klein text-[16px]">{s.serie}</p>
                    <p className="utility mt-1 text-[9.5px] text-stein">
                      {s.anzahl === 1 ? "1 Band" : `${s.anzahl} Bände`}
                      {fehlend.length > 0 && (
                        <span className="text-rost"> · Lücke bei {fehlend.join(", ")}</span>
                      )}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stein" aria-hidden="true">
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
