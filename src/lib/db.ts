import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

declare global {
  var __db: Database.Database | undefined;
}

/**
 * Fügt eine Spalte hinzu, falls sie fehlt. Der Migrationsweg für alles, was nach dem ersten
 * Deploy dazukommt: CREATE TABLE in schema.ts ändert eine bestehende Tabelle nicht mehr.
 */
export function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function createConnection(): Database.Database {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Greift parallel ein zweiter Prozess auf die Datei zu, kurz warten statt sofort mit
  // SQLITE_BUSY abzubrechen.
  db.pragma("busy_timeout = 5000");

  // SQLites eingebautes LOWER() und das case-insensitive LIKE arbeiten nur auf ASCII: Die
  // Suche nach "grüffelo" träfe damit nicht auf "Grüffelo", und in einem deutschen
  // Kinderbuchregal stehen Umlaute in fast jedem zweiten Titel. Deshalb eine eigene Funktion,
  // die JavaScripts toLowerCase() benutzt — sie läuft pro Zeile, was bei einigen hundert
  // Büchern nicht ins Gewicht fällt. Übernommen aus Kochkiste, dort aus demselben Grund.
  db.function("klein", { deterministic: true }, (wert: unknown) =>
    wert === null || wert === undefined ? null : String(wert).toLowerCase()
  );

  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createConnection();
  }
  return global.__db;
}
