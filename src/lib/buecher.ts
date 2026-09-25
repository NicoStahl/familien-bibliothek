import "server-only";
import { getDb } from "./db";
import { loescheCover } from "./cover";
import { normalisiereIsbn } from "./isbn";
import { KATEGORIE_FALLBACK, KATEGORIEN } from "./kategorien";
import { besitzerNamen } from "./besitzer";

// Lesen und Schreiben von Büchern. Die Server Actions (buchActions.ts) rufen hierher; die
// Trennung hält Formularverarbeitung und Datenzugriff auseinander.

export type Buch = {
  id: number;
  titel: string;
  autor: string | null;
  isbn: string | null;
  kategorie: string;
  besitzer: string;
  serie: string | null;
  band: number | null;
  verlag: string | null;
  jahr: number | null;
  cover_datei: string | null;
  ausgeliehen_an: string | null;
  ausgeliehen_am: string | null;
  erstellt_am: string;
  geaendert_am: string;
};

/** Die Felder, die ein Formular oder eine API-Antwort liefert: alles ohne Datenbank-Identität. */
export type BuchEingabe = {
  titel: string;
  autor: string | null;
  isbn: string | null;
  kategorie: string;
  besitzer: string;
  serie: string | null;
  band: number | null;
  verlag: string | null;
  jahr: number | null;
  cover_datei: string | null;
};

/** Leerer String und "nur Leerzeichen" bedeuten dasselbe wie nichts: NULL. */
function leerZuNull(wert: string | null | undefined): string | null {
  const s = (wert ?? "").trim();
  return s === "" ? null : s;
}

/**
 * Stutzt eine Eingabe auf gültige Werte zurecht, bevor sie in die Datenbank geht.
 *
 * Kategorie und Besitzer werden gegen die festen Listen geprüft: Beide kommen zwar aus einem
 * Auswahlfeld, aber ein Formular-POST ist keine vertrauenswürdige Quelle, und ein falscher
 * Wert würde ein Buch für alle Filter unsichtbar machen. Eine unbekannte Kategorie fällt auf
 * "Sonstiges" zurück; ein unbekannter Besitzer ist dagegen ein echter Fehler, weil es keinen
 * sinnvollen Ersatz für "wem gehört das" gibt.
 */
function pruefe(eingabe: BuchEingabe): BuchEingabe {
  const titel = leerZuNull(eingabe.titel);
  if (!titel) throw new Error("Ein Buch braucht einen Titel.");

  if (!besitzerNamen().includes(eingabe.besitzer)) {
    throw new Error(`Unbekannter Besitzer: ${eingabe.besitzer}`);
  }

  const kategorie = (KATEGORIEN as readonly string[]).includes(eingabe.kategorie)
    ? eingabe.kategorie
    : KATEGORIE_FALLBACK;

  // Die ISBN wird auch hier noch einmal normalisiert, nicht nur im Scanner: Über die manuelle
  // Eingabe käme sie sonst mit Bindestrichen oder als ISBN-10 in die Tabelle, und dann findet
  // die Duplikat-Warnung dasselbe Buch nicht wieder.
  const isbn = eingabe.isbn ? normalisiereIsbn(eingabe.isbn) : null;

  return {
    titel,
    autor: leerZuNull(eingabe.autor),
    isbn,
    kategorie,
    besitzer: eingabe.besitzer,
    serie: leerZuNull(eingabe.serie),
    band: eingabe.band ?? null,
    verlag: leerZuNull(eingabe.verlag),
    jahr: eingabe.jahr ?? null,
    cover_datei: eingabe.cover_datei,
  };
}

export function holeBuch(id: number): Buch | null {
  return (getDb().prepare("SELECT * FROM buch WHERE id = ?").get(id) as Buch | undefined) ?? null;
}

/**
 * Alle Bücher mit derselben ISBN. Grundlage der Duplikat-Warnung beim Anlegen.
 *
 * Bewusst eine Liste und kein "gibt es das schon, ja/nein": Die Warnung nennt den Besitzer des
 * vorhandenen Exemplars ("Anna hat das schon"), und genau diese Auskunft entscheidet, ob man
 * ein zweites Exemplar anlegen will oder gerade versehentlich denselben Barcode zweimal
 * gescannt hat.
 */
export function findeNachIsbn(isbn: string): Buch[] {
  const normalisiert = normalisiereIsbn(isbn);
  if (!normalisiert) return [];
  return getDb()
    .prepare("SELECT * FROM buch WHERE isbn = ? ORDER BY erstellt_am")
    .all(normalisiert) as Buch[];
}

export function legeBuchAn(eingabe: BuchEingabe): number {
  const w = pruefe(eingabe);
  const info = getDb()
    .prepare(
      `INSERT INTO buch (titel, autor, isbn, kategorie, besitzer, serie, band, verlag, jahr, cover_datei)
       VALUES (@titel, @autor, @isbn, @kategorie, @besitzer, @serie, @band, @verlag, @jahr, @cover_datei)`
    )
    .run(w);
  return Number(info.lastInsertRowid);
}

/**
 * Schreibt ein Buch fort. Wird ein neues Cover mitgegeben, verschwindet das alte von der
 * Platte — sonst sammelt der cover-Ordner mit jeder Korrektur eine Waise mehr an, die niemand
 * je wiederfindet, weil der Verweis darauf überschrieben wurde.
 */
export async function aktualisiereBuch(id: number, eingabe: BuchEingabe): Promise<void> {
  const vorher = holeBuch(id);
  if (!vorher) throw new Error(`Buch ${id} gibt es nicht.`);
  const w = pruefe(eingabe);

  getDb()
    .prepare(
      `UPDATE buch SET titel = @titel, autor = @autor, isbn = @isbn, kategorie = @kategorie,
              besitzer = @besitzer, serie = @serie, band = @band, verlag = @verlag, jahr = @jahr,
              cover_datei = @cover_datei, geaendert_am = datetime('now')
        WHERE id = @id`
    )
    .run({ ...w, id });

  if (vorher.cover_datei && vorher.cover_datei !== w.cover_datei) {
    await loescheCover(vorher.cover_datei);
  }
}

export async function loescheBuch(id: number): Promise<void> {
  const buch = holeBuch(id);
  if (!buch) return;
  getDb().prepare("DELETE FROM buch WHERE id = ?").run(id);
  await loescheCover(buch.cover_datei);
}

/** ISO-Datum von heute (YYYY-MM-DD) in Ortszeit. Nicht toISOString: das rechnet nach UTC und
 *  liefert abends den Vortag. */
export function heute(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Setzt oder löscht den Ausleihvermerk. Ein leerer Name bedeutet "wieder da" und räumt beide
 * Felder ab — ein Datum ohne Ausleiher wäre eine Angabe ohne Aussage.
 *
 * Ein Datum wird nur neu gesetzt, wenn keines übergeben wird und vorher auch keines dastand:
 * Wer nur den Namen korrigiert, soll nicht den Ausleihbeginn verlieren.
 */
export function setzeAusleihe(id: number, an: string | null, am: string | null): void {
  const name = leerZuNull(an);
  const vorher = holeBuch(id);
  const datum = name ? (leerZuNull(am) ?? vorher?.ausgeliehen_am ?? heute()) : null;

  getDb()
    .prepare(
      `UPDATE buch SET ausgeliehen_an = ?, ausgeliehen_am = ?, geaendert_am = datetime('now')
        WHERE id = ?`
    )
    .run(name, datum, id);
}

/** Alle verliehenen Bücher, das am längsten fort zuerst. */
export function listeAusgeliehen(): Buch[] {
  return getDb()
    .prepare(
      `SELECT * FROM buch
        WHERE ausgeliehen_an IS NOT NULL AND TRIM(ausgeliehen_an) <> ''
        ORDER BY ausgeliehen_am IS NULL, ausgeliehen_am ASC, titel ASC`
    )
    .all() as Buch[];
}

export type SerienZeile = { serie: string; anzahl: number; baende: string | null };

/**
 * Alle vorhandenen Serien mit Anzahl und den vorhandenen Bandnummern.
 *
 * group_concat liefert die Bände als "1,2,5" — daraus macht die Serienseite die Lücken
 * sichtbar. Bewusst kein "X von Y": Wie viele Bände eine Serie insgesamt hat, weiß hier
 * niemand verlässlich, und der Plan schließt einen solchen Zähler ausdrücklich aus.
 */
export function listeSerien(): SerienZeile[] {
  return getDb()
    .prepare(
      `SELECT serie,
              COUNT(*) AS anzahl,
              group_concat(band) AS baende
         FROM buch
        WHERE serie IS NOT NULL AND TRIM(serie) <> ''
        GROUP BY serie
        ORDER BY klein(serie) ASC`
    )
    .all() as SerienZeile[];
}

/** Die Bücher einer Serie, nach Bandnummer sortiert. Bände ohne Nummer hängen hinten an. */
export function buecherDerSerie(serie: string): Buch[] {
  return getDb()
    .prepare(
      `SELECT * FROM buch
        WHERE klein(serie) = klein(?)
        ORDER BY band IS NULL, band ASC, titel ASC`
    )
    .all(serie) as Buch[];
}

/** Alle Bücher als Rohdaten — für den CSV-Export. */
export function alleBuecher(): Buch[] {
  return getDb()
    .prepare("SELECT * FROM buch ORDER BY klein(besitzer), klein(COALESCE(autor, '')), klein(titel)")
    .all() as Buch[];
}

/**
 * Benennt eine Serie um — an allen Bänden zugleich.
 *
 * Verglichen wird ohne Groß-/Kleinschreibung, wie überall bei Serien: So räumt ein Umbenennen
 * auch die Schreibvarianten mit ab, die vor der Serienauswahl vom 07.09.2026 entstanden sind
 * ("Die drei ???" neben "Die Drei ???"). Trägt eine andere Serie den neuen Namen schon,
 * fließen beide zusammen — das ist gewollt, denn genau dafür benennt man um.
 *
 * Liefert die Zahl der geänderten Bände; 0 heißt, unter dem alten Namen stand nichts.
 */
export function benenneSerieUm(alt: string, neu: string): number {
  const name = neu.trim();
  if (name === "") throw new Error("Der neue Serienname darf nicht leer sein.");
  return getDb()
    .prepare("UPDATE buch SET serie = ? WHERE klein(serie) = klein(?)")
    .run(name, alt.trim()).changes;
}
