import "server-only";
import { getDb } from "./db";
import type { Buch } from "./buecher";

// Suche und Filter (Abschnitt "Suche & Filter" des Umsetzungsplans).
//
// Gesucht wird über Titel und Autor in EINEM Feld, so steht es im Plan. Verlag und
// Erscheinungsjahr bleiben bewusst außen vor: Sie sind Detail-Info auf der Buchseite, und wer
// nach "dtv" sucht, meint fast nie den Verlag.
//
// Bewusst kein FTS5: Bei ein paar hundert Büchern liest SQLite die Tabelle in Millisekunden
// durch. Eine Volltext-Tabelle müsste bei jeder Änderung mitgepflegt werden und wäre nur eine
// zweite Stelle, an der etwas veralten kann. Dieselbe Abwägung wie bei Kochkiste.

export type Ausleihstatus = "verfuegbar" | "verliehen";

export type Filter = {
  suche: string;
  kategorie: string | null;
  besitzer: string | null;
  serie: string | null;
  status: Ausleihstatus | null;
};

export const LEERER_FILTER: Filter = {
  suche: "",
  kategorie: null,
  besitzer: null,
  serie: null,
  status: null,
};

export function istLeer(filter: Filter): boolean {
  return (
    filter.suche.trim() === "" &&
    filter.kategorie === null &&
    filter.besitzer === null &&
    filter.serie === null &&
    filter.status === null
  );
}

/** Liest die Filter aus den Adressparametern. Der Zustand steckt in der URL, nicht in React. */
export function filterAusParams(params: {
  q?: string;
  kategorie?: string;
  besitzer?: string;
  serie?: string;
  status?: string;
}): Filter {
  const status = params.status === "verfuegbar" || params.status === "verliehen" ? params.status : null;
  return {
    suche: params.q ?? "",
    kategorie: params.kategorie || null,
    besitzer: params.besitzer || null,
    serie: params.serie || null,
    status,
  };
}

/**
 * Zerlegt die Eingabe in Wörter. Mehrere Wörter werden UND-verknüpft, dürfen aber auf
 * verschiedene Felder treffen: "cornelia tintenherz" findet das Buch, obwohl kein einzelnes
 * Feld beide Wörter enthält. Genau so tippt man einen halb erinnerten Titel ein.
 */
function begriffe(suche: string): string[] {
  return suche
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 6);
}

/**
 * Sucht Bücher.
 *
 * Zur Umlaut-Frage: SQLites eingebautes LIKE ist nur für ASCII case-insensitive, "Grüffelo"
 * würde also nicht auf "grüffelo" passen. Deshalb wird beidseitig kleingeschrieben — auf der
 * einen Seite mit der SQL-Funktion `klein`, die db.ts registriert, auf der anderen in
 * `begriffe`.
 *
 * Sortiert wird nach Aufnahmedatum, das Neueste zuerst. Nicht alphabetisch: Der Katalog wächst
 * stapelweise beim Scannen, und die häufigste Frage direkt danach ist "ist das alles
 * drin?" — dafür müssen die letzten Funde oben stehen. Alphabetisch geordnet sucht man in
 * einem Cover-Grid ohnehin nicht, dafür gibt es das Suchfeld.
 */
export function sucheBuecher(filter: Filter): Buch[] {
  const bedingungen: string[] = [];
  const werte: Record<string, unknown> = {};

  begriffe(filter.suche).forEach((wort, i) => {
    const p = `w${i}`;
    werte[p] = `%${wort}%`;
    bedingungen.push(`(
      klein(b.titel) LIKE @${p}
      OR klein(COALESCE(b.autor, '')) LIKE @${p}
      OR klein(COALESCE(b.serie, '')) LIKE @${p}
    )`);
  });

  if (filter.kategorie) {
    werte.kategorie = filter.kategorie;
    bedingungen.push("b.kategorie = @kategorie");
  }

  if (filter.besitzer) {
    werte.besitzer = filter.besitzer;
    bedingungen.push("b.besitzer = @besitzer");
  }

  if (filter.serie) {
    werte.serie = filter.serie;
    bedingungen.push("klein(b.serie) = klein(@serie)");
  }

  if (filter.status === "verliehen") {
    bedingungen.push("b.ausgeliehen_an IS NOT NULL AND TRIM(b.ausgeliehen_an) <> ''");
  } else if (filter.status === "verfuegbar") {
    bedingungen.push("(b.ausgeliehen_an IS NULL OR TRIM(b.ausgeliehen_an) = '')");
  }

  const wo = bedingungen.length > 0 ? `WHERE ${bedingungen.join(" AND ")}` : "";

  return getDb()
    .prepare(`SELECT b.* FROM buch b ${wo} ORDER BY b.erstellt_am DESC, b.id DESC`)
    .all(werte) as Buch[];
}

/** Die im Katalog tatsächlich vergebenen Serien — Grundlage für das Serien-Dropdown. */
export function vergebeneSerien(): string[] {
  return (
    getDb()
      .prepare(
        `SELECT serie FROM buch
          WHERE serie IS NOT NULL AND TRIM(serie) <> ''
          GROUP BY klein(serie)
          ORDER BY klein(serie)`
      )
      .all() as { serie: string }[]
  ).map((z) => z.serie);
}

/** Wie viele Bücher stehen insgesamt im Regal. Für die Kopfzeile des Katalogs. */
export function anzahlBuecher(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM buch").get() as { n: number }).n;
}

/** Die schon vergebenen Verlage — für die Auswahl im Buchformular, wie bei den Serien. */
export function vergebeneVerlage(): string[] {
  return (
    getDb()
      .prepare(
        `SELECT verlag FROM buch
          WHERE verlag IS NOT NULL AND TRIM(verlag) <> ''
          GROUP BY klein(verlag)
          ORDER BY klein(verlag)`
      )
      .all() as { verlag: string }[]
  ).map((z) => z.verlag);
}
