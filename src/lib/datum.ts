// Datumsdarstellung. Läuft auch im Browser (Ausleih-Formular), deshalb ohne "server-only".

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/** Aus "2026-09-04" wird "4. September 2026". Unlesbares bleibt, wie es ist. */
export function langesDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!t) return iso;
  return `${Number(t[3])}. ${MONATE[Number(t[2]) - 1]} ${t[1]}`;
}

/**
 * "seit 3 Tagen", "seit gestern", "seit 2 Monaten" — der Zusatz auf der Verliehen-Liste.
 *
 * Bewusst grob: Ob ein Buch seit 63 oder 67 Tagen weg ist, ändert nichts an dem Gedanken, den
 * die Angabe auslösen soll ("das ist lange her, mal nachfragen").
 */
export function seitWann(iso: string | null): string | null {
  if (!iso) return null;
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!t) return null;

  const dann = new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const tage = Math.round((heute.getTime() - dann.getTime()) / 86_400_000);
  if (tage < 0) return null;
  if (tage === 0) return "seit heute";
  if (tage === 1) return "seit gestern";
  if (tage < 31) return `seit ${tage} Tagen`;

  const monate = Math.round(tage / 30.4);
  if (monate < 12) return `seit ${monate} ${monate === 1 ? "Monat" : "Monaten"}`;

  const jahre = Math.floor(tage / 365);
  return `seit ${jahre} ${jahre === 1 ? "Jahr" : "Jahren"}`;
}
