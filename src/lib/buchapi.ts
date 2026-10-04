import "server-only";
import { z } from "zod";
import { normalisiereIsbn } from "./isbn";
import { MVB_COVER } from "./coverVorschau";
import type { Dienst, Dienststoerung, Stoerungsart } from "./stoerung";

// Metadaten-Abruf bei den beiden kostenlosen Buch-APIs aus dem Plan. Keiner der beiden
// VERLANGT einen Schlüssel — was lange wie "nichts zu konfigurieren" aussah. Am 05.09.2026
// hat sich das als Irrtum erwiesen: Ohne eigenen Schlüssel zählt Google jede Anfrage gegen ein
// Kontingent, das sich alle anonymen Aufrufer der Welt teilen, und das war erschöpft. Ohne
// Google fällt für deutsche Titel praktisch alles aus, weil Open Library dort dünn ist.
// `GOOGLE_BOOKS_API_KEY` ist deshalb formal optional und praktisch nötig.
//
// Reihenfolge: Google Books, dann die Deutsche Nationalbibliothek, dann Open Library. Der Aufruf
// läuft NUR auf dem Server, nie im Browser: So bleibt der Zugriff hinter der Anmeldung, und die
// Cover lassen sich in derselben Anfrage gleich lokal ablegen.
//
// Die DNB kam am 04.10.2026 dazu, weil Googles `isbn:`-Suche seit Kurzem für JEDE Nummer
// `totalItems: 0` liefert — mit gültigem Schlüssel, Status 200 und ohne Fehlermeldung, während
// die Titelsuche mit demselben Schlüssel normal antwortet. Open Library allein fing das nicht
// auf: Bei deutschen Titeln fehlt dort zu viel. Die DNB führt dagegen praktisch jedes in
// Deutschland erschienene Buch, braucht keinen Schlüssel und hat mit dem MVB-Dienst auch Cover.
// Google bleibt vorn, falls es die Suche wieder repariert — die Anfrage kostet eine Drittelsekunde.
//
// Die Antworten sind fremde, unversionierte JSON-Strukturen. Deshalb geht alles durch Zod:
// Was nicht ins Schema passt, fehlt eben — ein fehlender Verlag darf keine Erfassung
// abbrechen, und eine geänderte Feldform soll keinen Serverfehler auslösen.

export type BuchTreffer = {
  titel: string;
  autor: string | null;
  verlag: string | null;
  jahr: number | null;
  /** Fremde Adresse. Wird von cover.ts heruntergeladen, nicht gespeichert. */
  coverUrl: string | null;
  isbn: string | null;
  quelle: "google" | "dnb" | "openlibrary";
};

const ZEITGRENZE_MS = 8000;

/** Antwort eines Verzeichnisses: entweder Daten, oder ein benannter Grund für ihr Ausbleiben. */
type Abruf<T = unknown> = { art: "daten"; daten: T } | { art: "stoerung"; stoerung: Stoerungsart };

/** Open Library bittet ausdrücklich um eine identifizierbare Kennung samt Kontaktweg. */
const KENNUNG = "Buecherfuchs/0.9 (privater Familienkatalog)";

/**
 * Holt JSON und übersetzt jedes Problem in einen benennbaren Grund. Keine API-Störung darf die
 * App aufhalten — aber sie darf auch nicht als "Buch unbekannt" durchgehen.
 *
 * Der Fehlschlag wird weiterhin protokolliert und zusätzlich nach oben gereicht. Das Log
 * allein hat am 05.09.2026 nicht gereicht: Google Books beantwortet Anfragen ohne Schlüssel
 * aus einem Kontingent, das sich alle anonymen Aufrufer teilen, das Kontingent war erschöpft,
 * und vor dem Regal sah das aus wie fünf unbekannte Bücher. Wer scannt, liest keine
 * Containerlogs — also muss der Grund bis in die Oberfläche.
 *
 * 429 ist dabei der einzige Status, der sicher aufs Kontingent zeigt. Alles andere bleibt
 * bewusst "ausfall": Ein falsch eingetragener Schlüssel etwa liefert 400 oder 403, und den
 * Nutzer dann aufs Kontingent zu verweisen, würde die Suche in die falsche Richtung schicken.
 */
async function hole(url: string, format: "json"): Promise<Abruf>;
async function hole(url: string, format: "xml"): Promise<Abruf<string>>;
async function hole(url: string, format: "json" | "xml"): Promise<Abruf> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(ZEITGRENZE_MS),
      headers: {
        accept: format === "json" ? "application/json" : "application/xml",
        "user-agent": KENNUNG,
      },
    });
    if (!res.ok) {
      // Der Schlüssel steht als Parameter in der Adresse — hier nur der Ursprung ins Log.
      console.warn(`Buch-API antwortete mit ${res.status}: ${new URL(url).host}`);
      return { art: "stoerung", stoerung: res.status === 429 ? "kontingent" : "ausfall" };
    }
    return { art: "daten", daten: format === "json" ? await res.json() : await res.text() };
  } catch (fehler) {
    console.warn(`Buch-API nicht erreichbar (${new URL(url).host}):`, fehler);
    return { art: "stoerung", stoerung: "ausfall" };
  }
}

const holeJson = (url: string) => hole(url, "json");

/**
 * Eine Antwort, die nicht ins Schema passt, ist ein Ausfall des Dienstes — kein fehlender
 * Treffer. Beides sah vorher gleich aus, und eine geänderte Feldform hätte sich als "das
 * ganze Regal ist unbekannt" getarnt, bis jemand die Schemata gegen die echte Antwort hält.
 */
function formfehler(dienst: Dienst): Dienststoerung {
  console.warn(`Buch-API antwortete in unerwarteter Form: ${dienst}`);
  return { dienst, art: "ausfall" };
}

/** Ergebnis einer einzelnen ISBN-Abfrage bei genau einem Dienst. */
type Abfrage = { treffer: BuchTreffer | null; stoerung: Dienststoerung | null };

/**
 * Hängt einen Google-Books-Schlüssel an, falls einer hinterlegt ist.
 *
 * Der Plan sagt zu Recht, dass für öffentliche Volumendaten kein Schlüssel NÖTIG ist — die
 * Abfrage funktioniert ohne. Sie funktioniert nur nicht immer: Ohne Schlüssel zählt Google die
 * Anfrage gegen ein gemeinsames anonymes Kontingent, das an manchen Tagen schon erschöpft ist,
 * bevor man die erste Anfrage stellt. Mit einem (kostenlosen) Schlüssel gilt das eigene
 * Kontingent von 1000 Abfragen am Tag, was für ein Familienregal um Größenordnungen reicht.
 *
 * Deshalb: optional, nicht Pflicht. Fehlt GOOGLE_BOOKS_API_KEY, läuft alles wie gehabt — und
 * Open Library fängt auf, was Google nicht beantwortet.
 */
function mitSchluessel(url: string): string {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? `${url}&key=${encodeURIComponent(key)}` : url;
}

/** Aus "2004-09" oder "2004" die Jahreszahl. Alles andere ist kein Jahr. */
function jahrAus(text: string | undefined): number | null {
  const treffer = /^(\d{4})/.exec(text ?? "");
  if (!treffer) return null;
  const jahr = Number(treffer[1]);
  return jahr >= 1400 && jahr <= new Date().getFullYear() + 1 ? jahr : null;
}

/**
 * Räumt eine Google-Books-Cover-Adresse auf.
 *
 * Drei Eingriffe, jeder mit eigenem Grund:
 *
 *  • http auf https. Google liefert seine Cover-Adressen bis heute unverschlüsselt aus. Der
 *    Browser blockiert ein solches Bild auf einer HTTPS-Seite als Mixed Content — die Vorschau
 *    im Formular bliebe leer —, und auf der NAS ist ausgehender Port 80 obendrein oft dicht.
 *  • `edge=curl` weg. Das malt dem Bild eine gezeichnete Eselsohr-Ecke auf; im Grid sieht das
 *    aus wie ein Darstellungsfehler.
 *  • `zoom=1` auf `zoom=0`. Sonst kommt nur die Briefmarke statt der größten Auflösung.
 */
function googleCover(url: string | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/^http:\/\//i, "https://")
    .replace(/&edge=curl/gi, "")
    .replace(/([?&])zoom=\d/i, "$1zoom=0");
}

const GoogleBand = z.object({
  volumeInfo: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      authors: z.array(z.string()).optional(),
      publisher: z.string().optional(),
      publishedDate: z.string().optional(),
      industryIdentifiers: z
        .array(z.object({ type: z.string().optional(), identifier: z.string().optional() }))
        .optional(),
      imageLinks: z.object({ thumbnail: z.string().optional() }).partial().optional(),
    })
    .optional(),
});

const GoogleAntwort = z.object({ items: z.array(GoogleBand).optional() });

type GoogleBandTyp = z.infer<typeof GoogleBand>;

/** Formt einen Google-Books-Band in unsere Struktur um. Ohne Titel ist der Treffer wertlos. */
function ausGoogleBand(band: GoogleBandTyp): BuchTreffer | null {
  const v = band.volumeInfo;
  if (!v?.title) return null;

  // Untertitel angehängt: Bei Sachbüchern steckt die eigentliche Auskunft oft dort
  // ("Sapiens" / "Eine kurze Geschichte der Menschheit").
  const titel = v.subtitle ? `${v.title}. ${v.subtitle}` : v.title;

  const isbn13 = v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier;

  return {
    titel,
    autor: v.authors?.join(", ") ?? null,
    verlag: v.publisher ?? null,
    jahr: jahrAus(v.publishedDate),
    coverUrl: googleCover(v.imageLinks?.thumbnail),
    isbn: normalisiereIsbn(isbn13 ?? isbn10 ?? ""),
    quelle: "google",
  };
}

const OpenLibraryBand = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  authors: z.array(z.object({ name: z.string().optional() })).optional(),
  publishers: z.array(z.object({ name: z.string().optional() })).optional(),
  publish_date: z.string().optional(),
  cover: z.object({ large: z.string().optional(), medium: z.string().optional() }).partial().optional(),
});

/** Fragt Google Books nach einer ISBN. */
async function googleNachIsbn(isbn13: string): Promise<Abfrage> {
  const abruf = await holeJson(
    mitSchluessel(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}&maxResults=1&country=DE`)
  );
  if (abruf.art === "stoerung") {
    return { treffer: null, stoerung: { dienst: "Google Books", art: abruf.stoerung } };
  }

  const geparst = GoogleAntwort.safeParse(abruf.daten);
  if (!geparst.success) return { treffer: null, stoerung: formfehler("Google Books") };

  const erster = geparst.data.items?.[0];
  return { treffer: erster ? ausGoogleBand(erster) : null, stoerung: null };
}

/**
 * Fragt Open Library nach einer ISBN.
 *
 * Die Cover-Adresse kommt aus dem `cover`-Feld der Antwort und wird NICHT selbst aus der ISBN
 * zusammengebaut. Der direkte Weg (covers.openlibrary.org/b/isbn/…-L.jpg) antwortet auf einen
 * Fehlschlag nämlich mit Status 200 und einem 1×1-Pixel — man merkt erst im Regal, dass das
 * halbe Grid leer ist. Steht kein cover-Feld da, gibt es eben kein Cover.
 */
async function openLibraryNachIsbn(isbn13: string): Promise<Abfrage> {
  const schluessel = `ISBN:${isbn13}`;
  const abruf = await holeJson(
    `https://openlibrary.org/api/books?bibkeys=${schluessel}&format=json&jscmd=data`
  );
  if (abruf.art === "stoerung") {
    return { treffer: null, stoerung: { dienst: "Open Library", art: abruf.stoerung } };
  }

  const geparst = z.record(z.string(), OpenLibraryBand).safeParse(abruf.daten);
  if (!geparst.success) return { treffer: null, stoerung: formfehler("Open Library") };

  // Kein Eintrag zu dieser ISBN: Die Antwort ist dann ein leeres Objekt. Das ist eine echte
  // Auskunft ("kennen wir nicht") und keine Störung — genau diese Unterscheidung ist der Sinn
  // der Übung.
  const band = geparst.data[schluessel];
  if (!band?.title) return { treffer: null, stoerung: null };

  return {
    treffer: {
      titel: band.subtitle ? `${band.title}. ${band.subtitle}` : band.title,
      autor: band.authors?.map((a) => a.name).filter(Boolean).join(", ") || null,
      verlag: band.publishers?.map((p) => p.name).filter(Boolean).join(", ") || null,
      jahr: jahrAus(band.publish_date),
      coverUrl: band.cover?.large ?? band.cover?.medium ?? null,
      isbn: isbn13,
      quelle: "openlibrary",
    },
    stoerung: null,
  };
}

/** Die fünf vordefinierten XML-Entitäten und numerische Zeichenreferenzen. */
function xmlText(roh: string): string {
  return roh
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dez: string) => String.fromCodePoint(Number(dez)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Alle Werte eines Dublin-Core-Felds aus einem DNB-Datensatz, z. B. `creator`. */
function dcFelder(datensatz: string, feld: string): string[] {
  const muster = new RegExp(`<dc:${feld}(?:\\s[^>]*)?>([^<]*)</dc:${feld}>`, "g");
  return [...datensatz.matchAll(muster)].map((m) => xmlText(m[1])).filter(Boolean);
}

/**
 * „Unser Schiff : eine Bilderbuch-Reise mit Suchspiel / Antje von Stemm" → „Unser Schiff. Eine
 * Bilderbuch-Reise mit Suchspiel".
 *
 * Die DNB liefert den Titel nach Katalogregeln: Hinter „ / " folgt die Verantwortlichkeit
 * (Autor, Übersetzer, Herausgeber — die stehen sauberer in `creator`), hinter „ : " der
 * Untertitel. Daraus wird dieselbe Form, die Google liefert. Das „¬" klammert in Katalogdaten
 * Artikel ein, die beim Sortieren übersprungen werden („¬Der¬ kleine Prinz").
 */
function dnbTitel(roh: string): string {
  const ohneVerantwortung = roh.split(" / ")[0].replace(/¬/g, "");
  const [haupt, ...unter] = ohneVerantwortung.split(" : ").map((s) => s.trim());
  const untertitel = unter.join(": ");
  if (!untertitel) return haupt;
  return `${haupt}. ${untertitel.charAt(0).toUpperCase()}${untertitel.slice(1)}`;
}

/**
 * Die Autoren aus den `creator`-Feldern, als „Vorname Nachname".
 *
 * Jeder Eintrag trägt seine Rolle in eckigen Klammern: „Rowling, J. K. [Verfasser]",
 * „Fritz, Klaus [Übersetzer]". Genommen werden die Verfasser; fehlen sie (Anthologien), die
 * Herausgeber; erst dann Einträge ohne Rolle. Übersetzer und Illustratoren nie — die gehören
 * nicht in die Autorzeile.
 *
 * Die Namen sind die normierte Form der Normdatei. Bei Übersetzungen aus dem Kyrillischen weicht
 * die Umschrift deshalb vom Buchdeckel ab (Ulickaja statt Ulitzkaja) — korrigierbar im Formular.
 */
function dnbAutoren(creators: string[]): string | null {
  const zerlegt = creators.map((c) => {
    const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(c);
    return m ? { name: m[1], rolle: m[2] } : { name: c, rolle: null };
  });
  const auswahl = [
    zerlegt.filter((c) => c.rolle === "Verfasser"),
    zerlegt.filter((c) => c.rolle === "Herausgeber"),
    zerlegt.filter((c) => c.rolle === null),
  ].find((liste) => liste.length > 0);
  if (!auswahl) return null;

  return auswahl
    .map(({ name }) => {
      const [nach, vor] = name.split(/,\s*/, 2);
      return vor ? `${vor} ${nach}` : nach;
    })
    .join(", ");
}

/** „Hamburg : Carlsen" → „Carlsen". Bei mehreren Verlagen („A : X ; B : Y") nur der erste. */
function dnbVerlag(roh: string | undefined): string | null {
  if (!roh) return null;
  const erster = roh.split(" ; ")[0];
  const name = erster.includes(" : ") ? erster.split(" : ").slice(1).join(" : ") : erster;
  return name.trim() || null;
}

/**
 * Cover-Adresse beim MVB-Dienst der DNB, oder null, wenn es dort keines gibt.
 *
 * Anders als Open Library und Amazon antwortet der Dienst auf eine unbekannte ISBN ehrlich mit
 * 404 statt mit einem 1×1-Pixel — eine HEAD-Anfrage genügt also, um vorab zu wissen, ob es ein
 * Bild gibt. Das ist nötig, weil Scan-Karte und Formular die Vorschau als `<img>` zeigen; ohne
 * die Prüfung stünde dort bei jedem Buch ohne Cover ein kaputtes Bildsymbol.
 *
 * Die eigene Kennung im User-Agent ist hier keine Höflichkeit: Der Dienst steht hinter einem
 * Bot-Schutz, der allen „Mozilla"-Kennungen eine Prüfseite statt des Bildes schickt.
 */
export async function mvbCoverUrl(isbn13: string): Promise<string | null> {
  const url = `${MVB_COVER}${isbn13}`;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { "user-agent": KENNUNG },
    });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/") ? url : null;
  } catch {
    return null;
  }
}

/** Das MVB-Cover als Bytes, für die Vorschau-Route. Null bei 404, Störung oder Nicht-Bild. */
export async function ladeMvbCover(isbn13: string): Promise<{ daten: Buffer; typ: string } | null> {
  try {
    const res = await fetch(`${MVB_COVER}${isbn13}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(ZEITGRENZE_MS),
      headers: { "user-agent": KENNUNG },
    });
    const typ = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!res.ok || !typ.startsWith("image/")) return null;
    return { daten: Buffer.from(await res.arrayBuffer()), typ };
  } catch {
    return null;
  }
}

/**
 * Fragt die Deutsche Nationalbibliothek nach einer ISBN (SRU-Schnittstelle, Dublin Core).
 *
 * Kein Schlüssel, kein Kontingent. Die Antwort ist XML; ein XML-Parser als Abhängigkeit lohnt
 * für die vier flachen Felder nicht. Fehlt `numberOfRecords`, ist die Antwort keine SRU-Antwort
 * und wird als Ausfall gemeldet, nicht als „unbekannt".
 */
async function dnbNachIsbn(isbn13: string): Promise<Abfrage> {
  const abruf = await hole(
    `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve` +
      `&query=num%3D${isbn13}&recordSchema=oai_dc&maximumRecords=1`,
    "xml"
  );
  if (abruf.art === "stoerung") {
    return { treffer: null, stoerung: { dienst: "DNB", art: abruf.stoerung } };
  }

  const anzahl = /<numberOfRecords>(\d+)<\/numberOfRecords>/.exec(abruf.daten);
  if (!anzahl) return { treffer: null, stoerung: formfehler("DNB") };
  if (anzahl[1] === "0") return { treffer: null, stoerung: null };

  const datensatz = /<record>([\s\S]*?)<\/record>/.exec(abruf.daten)?.[1] ?? "";
  const rohTitel = dcFelder(datensatz, "title")[0];
  if (!rohTitel) return { treffer: null, stoerung: null };

  const jahr = /\d{4}/.exec(dcFelder(datensatz, "date")[0] ?? "")?.[0];

  return {
    treffer: {
      titel: dnbTitel(rohTitel),
      autor: dnbAutoren(dcFelder(datensatz, "creator")),
      verlag: dnbVerlag(dcFelder(datensatz, "publisher")[0]),
      jahr: jahrAus(jahr),
      coverUrl: await mvbCoverUrl(isbn13),
      isbn: isbn13,
      quelle: "dnb",
    },
    stoerung: null,
  };
}

/**
 * Was die Verzeichnisse zu einer ISBN sagen.
 *
 * `treffer: null` bei leerem `stoerungen` heißt: Alle Dienste haben geantwortet und kennen
 * das Buch nicht — dann greift der im Plan vorgesehene Fallback, also das Formular von Hand.
 * Steht dagegen etwas in `stoerungen`, ist die Frage schlicht unbeantwortet geblieben, und
 * das ist etwas völlig anderes.
 */
export type IsbnAuskunft = { treffer: BuchTreffer | null; stoerungen: Dienststoerung[] };

/**
 * Sucht die Metadaten zu einer ISBN.
 *
 * Die Abfragen laufen NACHEINANDER, nicht parallel: Wer trifft, erspart den übrigen die
 * Wartezeit. Bei einem Stapel gescannter Bücher summiert sich das.
 *
 * DNB vor Open Library, weil sie deutschsprachige Titel nahezu vollständig führt und Open Library
 * dort dünn ist. Englische Ausgaben (978-0, 978-1) kennt die DNB meist nicht; für die bleibt
 * Open Library als dritte Stufe.
 *
 * Gibt es am Ende einen Treffer, bleibt `stoerungen` leer — dass Google unterwegs gestreikt
 * hat, interessiert niemanden mehr, wenn die DNB das Buch gefunden hat. Gemeldet wird nur, was
 * das Ergebnis tatsächlich beeinträchtigt hat.
 */
export async function metadatenZuIsbn(eingabe: string): Promise<IsbnAuskunft> {
  const isbn13 = normalisiereIsbn(eingabe);
  if (!isbn13) return { treffer: null, stoerungen: [] };

  const abfragen: Abfrage[] = [];
  for (const frage of [googleNachIsbn, dnbNachIsbn, openLibraryNachIsbn]) {
    const antwort = await frage(isbn13);
    if (antwort.treffer) return { treffer: antwort.treffer, stoerungen: [] };
    abfragen.push(antwort);
  }

  return {
    treffer: null,
    stoerungen: abfragen.map((a) => a.stoerung).filter((s): s is Dienststoerung => s !== null),
  };
}

/**
 * Nur die Cover-Adresse von Open Library, ohne die übrigen Metadaten.
 *
 * Gedacht als zweite Chance, wenn Google zwar den Titel kennt, aber kein Bild dazu hat: Die
 * beiden Dienste sind bei Metadaten und bei Covern unterschiedlich gut bestückt, und die
 * Entscheidung "wer liefert den Datensatz" muss nicht dieselbe sein wie "wer liefert das
 * Bild". Bei „Die Olchis fliegen zum Mond" ist genau das der Fall — Google hat den Titel und
 * nur einen Platzhalter, Open Library hat ein echtes Cover.
 *
 * Wird bewusst NICHT bei jedem Scan aufgerufen, sondern erst, wenn der erste Versuch nichts
 * Brauchbares ergeben hat. Sonst zahlte jeder Scan eine zusätzliche Wartezeit für einen Fall,
 * der meistens nicht eintritt.
 */
export async function coverUrlAusOpenLibrary(eingabe: string): Promise<string | null> {
  const isbn13 = normalisiereIsbn(eingabe);
  if (!isbn13) return null;

  const { treffer } = await openLibraryNachIsbn(isbn13);
  return treffer?.coverUrl ?? null;
}

export type SerienVorschlag = {
  titel: string;
  autor: string | null;
  jahr: number | null;
  coverUrl: string | null;
  isbn: string | null;
};

/** Ergebnis einer Serien-Suche bei genau einem Dienst. */
type Serienabfrage = { vorschlaege: SerienVorschlag[]; stoerung: Dienststoerung | null };

/**
 * Sucht bei Google Books nach weiteren Bänden einer Serie.
 *
 * `intitle:` statt freier Suche, weil eine freie Suche nach "Eragon" auch Filmbücher,
 * Hörbuch-Begleithefte und Sekundärliteratur einsammelt. Vollständig verhindert das nichts —
 * es hebt nur den Anteil brauchbarer Zeilen.
 */
async function googleSerien(begriff: string): Promise<Serienabfrage> {
  const abruf = await holeJson(
    mitSchluessel(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(begriff)}` +
        `&orderBy=relevance&maxResults=20&printType=books&country=DE`
    )
  );
  if (abruf.art === "stoerung") {
    return { vorschlaege: [], stoerung: { dienst: "Google Books", art: abruf.stoerung } };
  }

  const geparst = GoogleAntwort.safeParse(abruf.daten);
  if (!geparst.success) return { vorschlaege: [], stoerung: formfehler("Google Books") };

  const gesehen = new Set<string>();
  const vorschlaege: SerienVorschlag[] = [];

  for (const band of geparst.data.items ?? []) {
    const treffer = ausGoogleBand(band);
    if (!treffer) continue;

    // Google liefert denselben Titel gern mehrfach (Taschenbuch, gebunden, E-Book). Der Titel
    // in Kleinschreibung ist der beste Schlüssel, den es hier gibt: Die ISBN unterscheidet
    // genau die Ausgaben, die wir zusammenfassen wollen.
    const schluessel = treffer.titel.toLowerCase();
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);

    vorschlaege.push({
      titel: treffer.titel,
      autor: treffer.autor,
      jahr: treffer.jahr,
      coverUrl: treffer.coverUrl,
      isbn: treffer.isbn,
    });
  }

  return { vorschlaege, stoerung: null };
}

const OpenLibrarySuche = z.object({
  docs: z
    .array(
      z.object({
        title: z.string().optional(),
        author_name: z.array(z.string()).optional(),
        first_publish_year: z.number().optional(),
        // Die numerische Cover-Kennung. Nur wenn sie dasteht, gibt es auch ein Bild — anders
        // als beim Weg über die ISBN, der auf einen Fehlschlag mit einem 1x1-Pixel antwortet.
        cover_i: z.number().optional(),
        isbn: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

/** Dieselbe Suche bei Open Library. */
async function openLibrarySerien(begriff: string): Promise<Serienabfrage> {
  const abruf = await holeJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(begriff)}` +
      `&limit=20&fields=title,author_name,first_publish_year,cover_i,isbn`
  );
  if (abruf.art === "stoerung") {
    return { vorschlaege: [], stoerung: { dienst: "Open Library", art: abruf.stoerung } };
  }

  const geparst = OpenLibrarySuche.safeParse(abruf.daten);
  if (!geparst.success) return { vorschlaege: [], stoerung: formfehler("Open Library") };

  const gesehen = new Set<string>();
  const vorschlaege: SerienVorschlag[] = [];

  for (const doc of geparst.data.docs ?? []) {
    if (!doc.title) continue;
    const schluessel = doc.title.toLowerCase();
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);

    // Open Library listet alle Ausgaben eines Werks; die erste ISBN, die sich normalisieren
    // lässt, genügt als Aufhänger für den "Haben wir doch"-Link.
    const isbn =
      doc.isbn?.map((i) => normalisiereIsbn(i)).find((i): i is string => i !== null) ?? null;

    vorschlaege.push({
      titel: doc.title,
      autor: doc.author_name?.join(", ") ?? null,
      jahr: doc.first_publish_year ?? null,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
      isbn,
    });
  }

  return { vorschlaege, stoerung: null };
}

/** Woher die Vorschläge tatsächlich stammen. Wird auf der Serienseite genannt. */
export type Vorschlagsquelle = Dienst;

/**
 * Unverbindliche Vorschläge, welche Bände es in einer Serie sonst noch geben könnte.
 *
 * Ausdrücklich UNVERBINDLICH, so steht es im Plan: Die Trefferqualität reicht nicht für einen
 * "X von Y vorhanden"-Zähler. Die Liste ist eine Anregung für den nächsten Buchladenbesuch —
 * was davon wirklich zur Serie gehört, entscheidet der Mensch davor. Dass Malbücher und
 * Sekundärliteratur mit hereinrutschen, ist genau der Grund für diese Zurückhaltung.
 *
 * Wie beim ISBN-Abruf zuerst Google, dann Open Library. Der Fallback ist hier keine Kür: Beim
 * ersten Test am 04.09.2026 antwortete Google Books mit 429 (anonymes Tageskontingent
 * erschöpft) — ohne die zweite Quelle wäre das Serien-Feature an diesem Tag stumm geblieben,
 * und zwar ohne erkennbaren Grund.
 *
 * Zurückgegeben wird deshalb auch die tatsächlich benutzte Quelle. Die Seite nennt sie im
 * Kleingedruckten, und das ist keine Spielerei: Eine Liste, die "gefunden bei Google Books"
 * behauptet, während sie in Wahrheit von Open Library stammt, führt bei der Fehlersuche in die
 * Irre — und die Trefferqualität der beiden Dienste unterscheidet sich deutlich.
 */
export async function serienVorschlaege(serie: string): Promise<{
  quelle: Vorschlagsquelle | null;
  vorschlaege: SerienVorschlag[];
  stoerungen: Dienststoerung[];
}> {
  const begriff = serie.trim();
  if (begriff.length < 3) return { quelle: null, vorschlaege: [], stoerungen: [] };

  const ausGoogle = await googleSerien(begriff);
  if (ausGoogle.vorschlaege.length > 0) {
    return { quelle: "Google Books", vorschlaege: ausGoogle.vorschlaege, stoerungen: [] };
  }

  const ausOpenLibrary = await openLibrarySerien(begriff);
  if (ausOpenLibrary.vorschlaege.length > 0) {
    return { quelle: "Open Library", vorschlaege: ausOpenLibrary.vorschlaege, stoerungen: [] };
  }

  // Dieselbe Unterscheidung wie beim Scan: "zu dieser Serie gibt es nichts" ist eine Auskunft,
  // "beide Dienste schweigen" ist keine. Am 05.09.2026 hätte die leere Liste hier genauso
  // ratlos dagestanden wie die leere Erfassungsmaske.
  return {
    quelle: null,
    vorschlaege: [],
    stoerungen: [ausGoogle.stoerung, ausOpenLibrary.stoerung].filter(
      (s): s is Dienststoerung => s !== null
    ),
  };
}
