// Wird von Next einmal beim Hochfahren des Servers aufgerufen.
//
// Einzige Aufgabe: die Datenbankverbindung einmal aufbauen, damit Schema und spätere
// Migrationen beim Start laufen und nicht erst beim ersten Zugriff eines Nutzers. Bei
// Kochkiste zeigte sich beim Deploy von Schritt 5, warum das nötig ist — eine Schemaänderung
// wartete dort auf den ersten angemeldeten Aufruf, und ein Fehler dabei wäre in der Seite des
// Nutzers gelandet statt im Log.
//
// Der Import steht bewusst INNERHALB der Runtime-Abfrage und nicht hinter einem frühen
// `return`. Next übersetzt diese Datei auch für die Edge-Runtime und ersetzt dabei
// `process.env.NEXT_RUNTIME` durch eine Konstante — nur so fällt der ganze Zweig beim Bauen
// weg. Mit frühem `return` bliebe der Import im Edge-Bundle stehen und zöge better-sqlite3
// mit hinein, dessen native Bindung sich dort nicht auflösen lässt.
//
// Anders als Kochkiste braucht der Bücherfuchs KEINE Aufräumfrist: Cover werden erst beim
// Absenden des Formulars heruntergeladen, ein abgebrochener Scan hinterlässt also keine Datei.

declare global {
  var __dbGeoeffnet: boolean | undefined;
}

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Im Dev-Server läuft register() bei jedem Neuaufbau erneut.
    if (global.__dbGeoeffnet) return;
    global.__dbGeoeffnet = true;

    try {
      const { getDb } = await import("./lib/db");
      getDb();
    } catch (fehler) {
      console.error("Datenbank ließ sich beim Start nicht öffnen:", fehler);
    }
  }
}
