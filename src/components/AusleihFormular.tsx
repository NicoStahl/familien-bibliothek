import { speichereAusleihe } from "@/lib/buchActions";
import { heute } from "@/lib/buecher";
import { langesDatum, seitWann } from "@/lib/datum";

/**
 * Der Ausleihvermerk — bewusst minimal, so verlangt es der Plan: ein Freitextfeld und ein
 * Datum. Kein Rückgabedatum, keine Erinnerung, kein Kontaktverzeichnis.
 *
 * Zwei Zustände, zwei Formulare. Das ist mehr Markup als ein einziges Formular mit
 * Umschalter, aber es entspricht dem, was man tun will: Ein Buch weggeben oder es
 * zurückbekommen sind zwei verschiedene Handgriffe, keine zwei Werte desselben Feldes.
 */
export function AusleihFormular({
  id,
  ausgeliehenAn,
  ausgeliehenAm,
}: {
  id: number;
  ausgeliehenAn: string | null;
  ausgeliehenAm: string | null;
}) {
  const verliehen = Boolean(ausgeliehenAn && ausgeliehenAn.trim() !== "");

  if (verliehen) {
    return (
      <div className="rounded-xl border border-rost/40 bg-rost/5 p-4">
        <p className="utility text-[10px] text-rost">Verliehen</p>
        <p className="hand mt-1.5 text-tinte">an {ausgeliehenAn}</p>
        <p className="mt-1 text-[13px] text-stein">
          {langesDatum(ausgeliehenAm) ?? "ohne Datum"}
          {seitWann(ausgeliehenAm) ? ` — ${seitWann(ausgeliehenAm)}` : ""}
        </p>

        <form action={speichereAusleihe} className="mt-4">
          <input type="hidden" name="id" value={id} />
          {/* Leeres Namensfeld heißt "wieder da" — setzeAusleihe räumt dann beide Felder ab. */}
          <input type="hidden" name="ausgeliehen_an" value="" />
          <button
            type="submit"
            className="h-11 w-full rounded-lg border border-linie bg-karte text-sm font-semibold text-tinte"
          >
            Zurückbekommen
          </button>
        </form>
      </div>
    );
  }

  return (
    <details className="rounded-xl border border-linie-zart bg-karte/60">
      <summary className="utility flex h-12 cursor-pointer list-none items-center px-4 text-[10px] text-stein">
        Verleihen
      </summary>
      <form action={speichereAusleihe} className="border-t border-linie-zart p-4">
        <input type="hidden" name="id" value={id} />
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div>
            <label htmlFor="ausgeliehen_an" className="utility block text-[10px] text-stein">
              An wen
            </label>
            <input
              id="ausgeliehen_an"
              name="ausgeliehen_an"
              type="text"
              required
              placeholder="z. B. Oma"
              className="mt-1.5 h-12 w-full rounded-lg border border-linie bg-karte px-3 outline-none focus:border-tinte"
            />
          </div>
          <div>
            <label htmlFor="ausgeliehen_am" className="utility block text-[10px] text-stein">
              Seit
            </label>
            <input
              id="ausgeliehen_am"
              name="ausgeliehen_am"
              type="date"
              defaultValue={heute()}
              className="mt-1.5 h-12 w-full rounded-lg border border-linie bg-karte px-3 outline-none focus:border-tinte"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 h-11 w-full rounded-lg bg-tinte text-sm font-semibold text-papier"
        >
          Vermerken
        </button>
      </form>
    </details>
  );
}
