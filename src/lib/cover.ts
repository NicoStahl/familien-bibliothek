import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { zuIsbn10 } from "./isbn";

// Ablage der Buchcover.
//
// Der Plan ist hier eindeutig: "API-Cover-URL wird lokal auf dem NAS heruntergeladen und
// gespeichert (nicht nur verlinkt)". Der Grund ist Haltbarkeit — eine verlinkte
// Google-Books-Adresse ist in fünf Jahren womöglich tot, und dann hat der Katalog Löcher an
// genau der Stelle, die ihn benutzbar macht. Außerdem lädt eine Grid-Ansicht mit 60 Kacheln
// sonst 60 Fremdanfragen nach.

/** Lange Kante des gespeicherten Covers. Die größte Kachel im Grid ist rund 200 px breit;
 *  700 px reichen für die Detailseite und für Bildschirme mit dreifacher Pixeldichte. */
const COVER_KANTE = 700;

/** Mehr als das kann ein Cover nicht sein. Bremst einen fehlgeleiteten Download aus. */
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;

export function coverDir(): string {
  return process.env.COVER_DIR ?? path.join(process.cwd(), "cover");
}

/**
 * Prüft einen Dateinamen, bevor er zu einem Pfad wird.
 *
 * Die Namen erzeugt diese Datei selbst (UUID + .jpg), sie kommen also nie aus einer Eingabe.
 * Der Wert wandert aber durch die Datenbank und durch eine URL-Route, und ein "../../.env"
 * dort wäre ein Dateilesezugriff auf alles, was der Container sehen kann. Die Prüfung kostet
 * nichts und schließt die Frage ein für alle Mal.
 */
function istSichererName(datei: string): boolean {
  return /^[a-f0-9-]{36}\.jpg$/.test(datei);
}

async function schreibe(daten: Buffer): Promise<string> {
  const verzeichnis = coverDir();
  await fs.mkdir(verzeichnis, { recursive: true });
  const datei = `${crypto.randomUUID()}.jpg`;
  await fs.writeFile(path.join(verzeichnis, datei), daten);
  return datei;
}

/**
 * Bringt ein beliebiges Bild in die gespeicherte Form: EXIF-Drehung angewandt, auf COVER_KANTE
 * begrenzt, als JPEG.
 *
 * rotate() ohne Argument dreht nach EXIF und entfernt das Orientierungs-Flag — ohne diesen
 * Schritt liegt ein mit dem iPhone abfotografiertes Cover in der Datei quer.
 */
async function normalisiere(eingabe: Buffer): Promise<Buffer> {
  return sharp(eingabe)
    .rotate()
    .resize({ width: COVER_KANTE, height: COVER_KANTE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

/** Speichert ein selbst hochgeladenes Foto (manueller Eintrag ohne API-Treffer). */
export async function speichereCoverAusUpload(eingabe: Buffer): Promise<string> {
  return schreibe(await normalisiere(eingabe));
}

/**
 * Lädt ein Cover von einer Buch-API herunter und legt es lokal ab. Gibt null zurück, wenn das
 * nicht klappt — ein fehlendes Cover ist kein Grund, die Erfassung scheitern zu lassen.
 *
 * Zwei Fallstricke, beide auf der NAS schon aufgetreten:
 *
 *  1. Google Books liefert seine Cover-Adressen bis heute als http://. Ausgehender Port 80 ist
 *     in manchen Netzen (auch auf der DS723+) dicht, der Download bliebe hängen. Deshalb wird
 *     das Schema hart auf https umgeschrieben — die Server antworten darauf sauber.
 *  2. Ohne Treffer schickt Open Library keinen 404, sondern ein 1x1-Pixel-GIF mit Status 200.
 *     Wer nur auf res.ok prüft, legt sich eine Bibliothek voll unsichtbarer Cover an. Deshalb
 *     die Mindestgröße weiter unten. **Amazon macht es genauso** — 43 Byte GIF, 1x1, Status
 *     200 —, dieselbe Prüfung fängt also beide.
 *  3. Google Books macht dasselbe in groß: Zu Datensätzen ohne eingescanntes Buch liefert es
 *     unter derselben Adresse eine fast weiße Fläche mit dem Hinweis "Bild nicht verfügbar" —
 *     Status 200, 575x750, also groß genug, um jede Größenprüfung zu bestehen. Am 05.09.2026
 *     stand deshalb hinter jedem erfassten Buch ein leeres Rechteck statt eines Covers.
 */
/**
 * Erkennt die Platzhalter-Grafik von Google Books: eine nahezu weiße Fläche mit einem
 * grauen Schriftzug.
 *
 * Gemessen am 05.09.2026 an „Die Olchis fliegen zum Mond": ein einziger Graustufenkanal,
 * Mittelwert 250,6 von 255, Streuung 15,9. Ein echtes Cover liegt um ein Vielfaches darüber —
 * ein Buchumschlag ohne Kontrast ist keiner.
 *
 * Die Schwelle verlangt beides, kaum Streuung UND große Helligkeit. Nur auf die Streuung zu
 * sehen würde auch ein einfarbig dunkles Cover verwerfen; ein wirklich fast weißes Cover mit
 * dünner Schrift fällt hier trotzdem durch, und das ist der bewusst in Kauf genommene Preis.
 * Der Fehlerfall ist gutartig: Es gibt dann kein Cover statt eines falschen, und das eigene
 * Foto steht ohnehin daneben.
 */
async function istPlatzhalter(daten: Buffer): Promise<boolean> {
  const { channels } = await sharp(daten).stats();

  // Zweite, helligkeitsunabhängige Schwelle: Unter Streuung 10 ist ein Bild praktisch eine
  // einfarbige Fläche, egal wie hell. Nachgetragen am 05.09.2026, weil Googles Platzhalter
  // unter der Adresse `books.google.com/books?vid=ISBN…` als mittelgraues Feld kommt
  // (Streuung 7, Mittelwert 168) und an der Helligkeitsbedingung vorbeigerutscht wäre.
  if (channels.every((kanal) => kanal.stdev < 10)) return true;

  return channels.every((kanal) => kanal.stdev < 30 && kanal.mean > 230);
}

export async function ladeCoverHerunter(quelle: string): Promise<string | null> {
  try {
    const url = new URL(quelle.replace(/^http:\/\//i, "https://"));
    if (url.protocol !== "https:") return null;

    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: { accept: "image/*" },
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return null;

    const roh = Buffer.from(await res.arrayBuffer());
    if (roh.byteLength > MAX_DOWNLOAD_BYTES) return null;

    // Ein echtes Cover ist nie unter 100 px breit. Das schließt die Platzhalter-Pixel beider
    // APIs aus, ohne eine Prüfung auf konkrete Byte-Muster zu brauchen.
    const { width, height } = await sharp(roh).metadata();
    if (!width || !height || width < 100 || height < 100) return null;
    if (await istPlatzhalter(roh)) return null;

    return await schreibe(await normalisiere(roh));
  } catch {
    // Zeitüberschreitung, DNS, kaputtes Bild: alles derselbe Fall, nämlich "kein Cover".
    return null;
  }
}

/**
 * Cover-Adresse bei Amazon, oder null, wenn es zu dieser ISBN keine geben kann.
 *
 * Die dritte und letzte Stufe der Cover-Suche — und die einzige, die für deutschsprachige
 * Titel zuverlässig etwas liefert, wenn Google und Open Library beide nichts haben. Am
 * 05.09.2026 an drei Titeln geprüft, darunter einer (Knaur, 978-3-426-52996-6), zu dem Open
 * Library überhaupt keinen Eintrag führt und Google nur seinen Platzhalter.
 *
 * Drei Vorbehalte, die zur Sache gehören:
 *
 *  • Die Adresse ist UNDOKUMENTIERT. Amazons Bedingungen sehen für Produktbilder die Product
 *    Advertising API mit Partnerkonto vor. Für einen privaten Familienkatalog hinter DSM-SSO
 *    ist das folgenlos; sauber ist es nicht, und Nico hat es am 05.09.2026 in Kenntnis dieses
 *    Punktes so entschieden.
 *  • Sie kann ohne Ankündigung verschwinden. Fällt sie aus, bleibt alles andere heil — es
 *    fehlen dann eben wieder die Cover, die vorher auch fehlten.
 *  • Bei unbekannter Nummer kommt kein 404, sondern ein 1x1-Pixel-GIF mit Status 200 — genau
 *    wie bei Open Library. Die Mindestgröße in `ladeCoverHerunter` fängt das ab.
 *
 * Amazon führt seine Bilder unter der ISBN-10; 979er-Nummern haben keine und bekommen
 * deshalb null.
 *
 * **Eine Warnung für spätere Änderungen:** Die Adresse schlägt nach ASIN, nicht nach ISBN. Jede
 * gültige ASIN liefert ein Bild — `1111111111` etwa eine Packung türkischen Tee. Wer damit eine
 * Gegenprobe „unbekannte Nummer" bauen will, prüft in Wahrheit ein fremdes Produktfoto. Am
 * 06.09.2026 genau so passiert, und die falsche Schlussfolgerung daraus hat quadratische
 * Bilderbuchcover gekostet.
 */
export function amazonCoverUrl(isbn13: string): string | null {
  const isbn10 = zuIsbn10(isbn13);
  return isbn10
    ? `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`
    : null;
}

export async function leseCover(datei: string): Promise<Buffer | null> {
  if (!istSichererName(datei)) return null;
  try {
    return await fs.readFile(path.join(coverDir(), datei));
  } catch {
    return null;
  }
}

/** Löscht eine Coverdatei. Fehlt sie schon, ist das kein Fehler, sondern das gewünschte Ende. */
export async function loescheCover(datei: string | null): Promise<void> {
  if (!datei || !istSichererName(datei)) return;
  await fs.rm(path.join(coverDir(), datei), { force: true });
}
