// Datenmodell nach dem Abschnitt "Datenmodell (Kernfelder pro Buch)" des Umsetzungsplans.
//
// Wird bei jedem Verbindungsaufbau ausgeführt (CREATE TABLE IF NOT EXISTS), ist also
// idempotent. Nachträglich eingeführte Spalten gehören nicht hierher, sondern in die
// ensureColumn-Aufrufe in db.ts — eine bestehende Tabelle ändert CREATE TABLE nicht mehr.

export const SCHEMA = `
-- Wer sich anmelden darf, entscheidet DSM (Synology SSO Server, OIDC). Diese Tabelle hält
-- nur fest, wer sich schon einmal angemeldet hat; eigene Passwörter gibt es nicht.
--
-- Nicht zu verwechseln mit dem BESITZER eines Buchs (lib/besitzer.ts): Kinder besitzen
-- Bücher, haben aber kein DSM-Konto und tauchen hier nie auf.
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_admin     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS buch (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  titel         TEXT NOT NULL,
  autor         TEXT,
  -- Immer 13-stellig (lib/isbn.ts normalisiert vor dem Speichern). NULL ist ausdrücklich
  -- erlaubt und kein Sonderfall: Bilderbücher und ältere Ausgaben tragen oft gar keine ISBN,
  -- und die App muss sie trotzdem aufnehmen können.
  isbn          TEXT,
  kategorie     TEXT NOT NULL,
  besitzer      TEXT NOT NULL,
  -- Freitext, keine eigene Tabelle: Eine Serie ist hier ein Name auf einem Buchrücken, kein
  -- Objekt mit Eigenschaften. Der Plan schließt einen "X von Y"-Zähler ausdrücklich aus, damit
  -- entfällt der einzige Grund, Serien getrennt zu führen.
  serie         TEXT,
  band          INTEGER,
  verlag        TEXT,
  jahr          INTEGER,
  -- Dateiname im COVER_DIR, nicht der volle Pfad und keine fremde URL: Der Plan verlangt,
  -- dass Cover lokal auf der NAS liegen. NULL bedeutet: gezeichneten Platzhalter anzeigen.
  cover_datei   TEXT,
  -- Ausleihe, bewusst minimal (zwei Felder, kein Rückgabedatum, keine Erinnerung).
  -- Leer/NULL heißt: das Buch ist zuhause.
  ausgeliehen_an TEXT,
  ausgeliehen_am TEXT,
  erstellt_am   TEXT NOT NULL DEFAULT (datetime('now')),
  geaendert_am  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kein UNIQUE auf die ISBN, und das ist eine Entscheidung: zwei Geschwister dürfen dasselbe
-- Buch je einmal besitzen (zwei Zeilen, zwei Besitzer, zwei Ausleihstatus). Die Doppelerfassung aus
-- Versehen fängt stattdessen eine Warnung beim Anlegen ab — siehe lib/buecher.ts.
CREATE INDEX IF NOT EXISTS idx_buch_isbn      ON buch (isbn);
CREATE INDEX IF NOT EXISTS idx_buch_kategorie ON buch (kategorie);
CREATE INDEX IF NOT EXISTS idx_buch_besitzer  ON buch (besitzer);
CREATE INDEX IF NOT EXISTS idx_buch_serie     ON buch (serie, band);
`;

// Die festen Auswahllisten stehen in lib/kategorien.ts und lib/besitzer.ts — sie werden auch
// im Browser gebraucht, dieses SQL-Schema dort aber nicht.
