"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "./auth";
import { coverUrlAusOpenLibrary } from "./buchapi";
import { amazonCoverUrl, ladeCoverHerunter, speichereCoverAusUpload } from "./cover";
import { normalisiereIsbn } from "./isbn";
import {
  aktualisiereBuch,
  benenneSerieUm,
  legeBuchAn,
  loescheBuch,
  setzeAusleihe,
  type BuchEingabe,
} from "./buecher";

// Server Actions der Formulare. Jede prüft zuerst die Anmeldung: Das Layout tut das zwar
// ebenfalls, aber eine Action ist ein eigener Endpunkt und wäre sonst auch ohne Sitzung
// aufrufbar — das Layout schützt nur die Seite, nicht den POST dahinter.

function text(formData: FormData, name: string): string | null {
  const wert = String(formData.get(name) ?? "").trim();
  return wert === "" ? null : wert;
}

function zahl(formData: FormData, name: string): number | null {
  const wert = text(formData, name);
  if (wert === null) return null;
  const n = Number(wert);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Bestimmt, welches Cover das Buch nach dem Speichern trägt.
 *
 * Drei Quellen in fester Rangfolge, weil sie unterschiedlich viel über die Absicht aussagen:
 * Ein selbst hochgeladenes Foto ist die stärkste Aussage (jemand hat das Buch in die Hand
 * genommen), danach kommt das Cover aus der API, und wenn beides fehlt, bleibt es beim
 * bisherigen. Ein fehlgeschlagener Download fällt ebenfalls auf das bisherige zurück und nicht
 * auf "kein Cover" — sonst löscht eine Netzstörung beim Bearbeiten das vorhandene Bild.
 */
async function bestimmeCover(formData: FormData): Promise<string | null> {
  const bisher = text(formData, "cover_bisher");

  const datei = formData.get("cover_upload");
  if (datei instanceof File && datei.size > 0) {
    return speichereCoverAusUpload(Buffer.from(await datei.arrayBuffer()));
  }

  const url = text(formData, "cover_url");
  if (url) {
    const geladen = await ladeCoverHerunter(url);
    if (geladen) return geladen;
  }

  // Ist schon ein Cover da, bleibt es. Die Suche unten läuft NUR für Bücher ohne Bild.
  //
  // Ohne diese Zeile würde jedes Speichern beim Bearbeiten losziehen und ein fremdes Cover
  // holen — auch über ein selbst fotografiertes hinweg, obwohl das laut der Rangfolge oben die
  // stärkste Aussage ist. Die Bearbeiten-Maske schickt kein `cover_url` mit, der Fall träfe
  // also jedes bearbeitete Buch.
  if (bisher) return bisher;

  // Zwei weitere Stufen, wenn der erste Weg nichts Brauchbares ergeben hat — sei es Googles
  // Platzhalter, ein toter Link oder gar keine Adresse. Wer den Titel liefert, muss nicht
  // derselbe sein, der das Bild hat. Beide laufen NUR in diesem Fall, damit kein Scan mit
  // funktionierendem Cover zusätzlich wartet.
  const isbn = normalisiereIsbn(text(formData, "isbn") ?? "");
  if (!isbn) return bisher;

  const ausOpenLibrary = await coverUrlAusOpenLibrary(isbn);
  if (ausOpenLibrary) {
    const geladen = await ladeCoverHerunter(ausOpenLibrary);
    if (geladen) return geladen;
  }

  // Letzte Stufe: Amazon. Für deutschsprachige Titel oft die einzige Quelle, die überhaupt ein
  // Cover hat — mit den Vorbehalten, die bei `amazonCoverUrl` stehen. Eine unbekannte Nummer
  // beantwortet Amazon mit einem 1x1-Pixel, das die Mindestgröße abfängt.
  const vonAmazon = amazonCoverUrl(isbn);
  if (vonAmazon) {
    const geladen = await ladeCoverHerunter(vonAmazon);
    if (geladen) return geladen;
  }

  return bisher;
}

async function eingabeAusFormular(formData: FormData): Promise<BuchEingabe> {
  return {
    titel: String(formData.get("titel") ?? ""),
    autor: text(formData, "autor"),
    isbn: text(formData, "isbn"),
    kategorie: String(formData.get("kategorie") ?? ""),
    besitzer: String(formData.get("besitzer") ?? ""),
    serie: text(formData, "serie"),
    band: zahl(formData, "band"),
    verlag: text(formData, "verlag"),
    jahr: zahl(formData, "jahr"),
    cover_datei: await bestimmeCover(formData),
  };
}

export async function speichereNeuesBuch(formData: FormData): Promise<void> {
  await requireUser();
  const id = legeBuchAn(await eingabeAusFormular(formData));
  revalidatePath("/");
  redirect(`/buch/${id}`);
}

export async function speichereBuch(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Ungültige Buchkennung.");

  await aktualisiereBuch(id, await eingabeAusFormular(formData));
  revalidatePath("/");
  revalidatePath(`/buch/${id}`);
  redirect(`/buch/${id}`);
}

export async function entferneBuch(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Ungültige Buchkennung.");

  await loescheBuch(id);
  revalidatePath("/");
  redirect("/");
}

/**
 * Trägt eine Ausleihe ein oder streicht sie.
 *
 * Bewusst kein redirect: Der Vermerk wird auf der Buchseite selbst gesetzt, und dort soll man
 * nach dem Speichern auch bleiben. revalidatePath genügt, damit die Seite und die
 * Verliehen-Liste den neuen Stand zeigen.
 */
export async function speichereAusleihe(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("Ungültige Buchkennung.");

  setzeAusleihe(id, text(formData, "ausgeliehen_an"), text(formData, "ausgeliehen_am"));
  revalidatePath("/");
  revalidatePath("/ausgeliehen");
  revalidatePath(`/buch/${id}`);
}

/**
 * Serie umbenennen, von der Serienseite aus. Danach weiter zur Seite unter dem neuen Namen —
 * die alte Adresse gäbe nach dem Umbenennen einen 404.
 */
export async function benenneSerieUmAction(formData: FormData): Promise<void> {
  await requireUser();
  const alt = text(formData, "alt");
  const neu = text(formData, "neu");
  if (!alt || !neu) redirect("/serien");
  // Auch eine reine Änderung der Schreibweise ("eragon" → "Eragon") ist ein Umbenennen.
  if (alt !== neu) benenneSerieUm(alt, neu);
  revalidatePath("/");
  revalidatePath("/serien");
  redirect(`/serien/${encodeURIComponent(neu)}`);
}
