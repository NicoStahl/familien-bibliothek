// Datumsdarstellung. Läuft auch im Browser (Ausleih-Formular), deshalb ohne "server-only".
// Die Wörter kommen aus dem Wörterbuch der aktuellen Sprache.

import type { Woerterbuch } from "@/lib/i18n";

/** Aus "2026-09-04" wird "4. September 2026". Unlesbares bleibt, wie es ist. */
export function langesDatum(t: Woerterbuch, iso: string | null): string | null {
  if (!iso) return null;
  const teile = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!teile) return iso;
  return t.datum.lang(Number(teile[3]), Number(teile[2]), teile[1]);
}

/**
 * "seit 3 Tagen", "seit gestern", "seit 2 Monaten" — der Zusatz auf der Verliehen-Liste.
 *
 * Bewusst grob: Ob ein Buch seit 63 oder 67 Tagen weg ist, ändert nichts an dem Gedanken, den
 * die Angabe auslösen soll ("das ist lange her, mal nachfragen").
 */
export function seitWann(t: Woerterbuch, iso: string | null): string | null {
  if (!iso) return null;
  const teile = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!teile) return null;

  const dann = new Date(Number(teile[1]), Number(teile[2]) - 1, Number(teile[3]));
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const tage = Math.round((heute.getTime() - dann.getTime()) / 86_400_000);
  if (tage < 0) return null;
  if (tage === 0) return t.datum.seitHeute;
  if (tage === 1) return t.datum.seitGestern;
  if (tage < 31) return t.datum.seitTagen(tage);

  const monate = Math.round(tage / 30.4);
  if (monate < 12) return t.datum.seitMonaten(monate);

  const jahre = Math.floor(tage / 365);
  return t.datum.seitJahren(jahre);
}
