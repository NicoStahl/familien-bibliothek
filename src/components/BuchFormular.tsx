import { KATEGORIEN, KATEGORIE_FALLBACK } from "@/lib/kategorien";
import { besitzerListe } from "@/lib/besitzer";
import { SpeichernKnopf } from "@/components/SpeichernKnopf";
import { CoverPlatzhalter } from "@/components/CoverPlatzhalter";
import { AuswahlFeld } from "@/components/AuswahlFeld";
import { SerieAuswahlFeld } from "@/components/SerieAuswahlFeld";
import { SerienVorschlagProvider, TitelFeld } from "@/components/SerienVorschlag";
import { formatiereIsbn } from "@/lib/isbn";
import { kategorieName } from "@/lib/i18n";
import { texte } from "@/lib/i18n/server";

// EIN Formular für drei Zwecke — neu von Hand, neu nach einem Scan, und Bearbeiten. Es nimmt
// dafür eine `vorgabe` ohne Datenbank-Identität entgegen; die `id` entscheidet, welche Action
// es absendet. Dieselbe Bauweise wie Kochkistes RezeptFormular, und aus demselben Grund: Drei
// getrennte Formulare liefen unweigerlich auseinander.
//
// Bewusst KEINE Client-Komponente. Das Formular hat keinen Zustand, den React verwalten müsste
// — Formularfelder kann der Browser selbst. Ausgelagert sind nur die zwei Stellen, die ohne
// Zustand nicht gehen: der Absendeknopf (kennt den Verarbeitungsstand) und die Serienauswahl
// (schaltet zwischen Liste und Neuanlage um).

export type Vorgabe = {
  titel?: string | null;
  autor?: string | null;
  isbn?: string | null;
  kategorie?: string | null;
  besitzer?: string | null;
  serie?: string | null;
  band?: number | null;
  verlag?: string | null;
  jahr?: number | null;
  /** Bereits gespeichertes Cover (Dateiname im cover-Ordner). Nur beim Bearbeiten gesetzt. */
  coverDatei?: string | null;
  /** Cover-Adresse aus der Buch-API, noch nicht heruntergeladen. Nur nach einem Scan gesetzt. */
  coverUrl?: string | null;
};

const LABEL = "utility block text-[10px] text-stein";
const EINGABE =
  "mt-1.5 h-12 w-full rounded-lg border border-linie bg-karte px-3 outline-none focus:border-tinte";

export async function BuchFormular({
  action,
  vorgabe,
  serien,
  verlage,
  id,
  knopf,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vorgabe: Vorgabe;
  /** Die schon vergebenen Serien, für die Auswahl statt Freitext. */
  serien: string[];
  /** Dito für den Verlag -- der kommt meist aus dem Import, die Auswahl fängt den Rest. */
  verlage: string[];
  /** Gesetzt heißt bearbeiten, nicht gesetzt heißt neu anlegen. */
  id?: number;
  knopf: string;
}) {
  const t = await texte();
  const vorschau = vorgabe.coverDatei ? `/api/cover/${vorgabe.coverDatei}` : vorgabe.coverUrl;

  return (
    <form action={action} className="px-5 pb-10 pt-5">
      {id !== undefined && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="cover_bisher" value={vorgabe.coverDatei ?? ""} />
      <input type="hidden" name="cover_url" value={vorgabe.coverUrl ?? ""} />

      <div className="flex gap-4">
        <div className="w-[92px] shrink-0 overflow-hidden rounded-lg shadow-[0_1px_3px_rgba(43,58,74,.18)]">
          <div className="aspect-[2/3]">
            {vorschau ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vorschau} alt="" className="h-full w-full object-cover" />
            ) : (
              <CoverPlatzhalter
                titel={vorgabe.titel || t.formular.ohneCover}
                autor={vorgabe.autor}
                className="h-full w-full"
              />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="cover_upload" className={LABEL}>
            {t.formular.eigenesFoto}
          </label>
          {/* capture="environment" öffnet am Handy direkt die Rückkamera statt der
              Fotomediathek — genau der Fall, um den es hier geht: Buch in der Hand, kein Cover
              gefunden. Am Rechner ignorieren die Browser das Attribut. */}
          <input
            id="cover_upload"
            name="cover_upload"
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1.5 w-full text-[13px] text-stein file:mr-3 file:rounded-md file:border-0 file:bg-tinte file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-papier"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-stein">
            {vorschau
              ? t.formular.fotoErsetzt
              : t.formular.ohneFoto}
          </p>
        </div>
      </div>

      <SerienVorschlagProvider>
        <div className="mt-6">
          <label htmlFor="titel" className={LABEL}>{t.formular.titel}</label>
          <TitelFeld
            id="titel"
            name="titel"
            type="text"
            required
            defaultValue={vorgabe.titel ?? ""}
            className={EINGABE}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="autor" className={LABEL}>{t.formular.autor}</label>
          <input
            id="autor"
            name="autor"
            type="text"
            defaultValue={vorgabe.autor ?? ""}
            className={EINGABE}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="kategorie" className={LABEL}>{t.formular.kategorie}</label>
            {/* Fällt auf "Sonstiges" zurück und NICHT auf den ersten Listeneintrag.
                Ohne diese Zeile wählt der Browser bei einem unbekannten defaultValue von sich
                aus die erste Option — ein frisch gescanntes Sachbuch stünde dann als
                "Bilderbuch" im Regal, ohne dass jemand etwas Falsches getan hätte. Eine
                erzwungene Auswahl wäre die Alternative gewesen; sie kostet bei jedem Scan einen
                zusätzlichen Handgriff, und "Sonstiges" ist die ehrlichere Vorgabe: sichtbar
                unbestimmt statt unsichtbar falsch. */}
            <select
              id="kategorie"
              name="kategorie"
              defaultValue={vorgabe.kategorie ?? KATEGORIE_FALLBACK}
              className={EINGABE}
            >
              {KATEGORIEN.map((k) => (
                <option key={k} value={k}>{kategorieName(t, k)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="besitzer" className={LABEL}>{t.formular.besitzer}</label>
            <select
              id="besitzer"
              name="besitzer"
              defaultValue={vorgabe.besitzer ?? ""}
              required
              className={EINGABE}
            >
              <option value="" disabled>{t.formular.bitteWaehlen}</option>
              {besitzerListe().map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_88px] gap-3">
          <SerieAuswahlFeld
            serien={serien}
            vorgabe={vorgabe.serie ?? null}
            labelClass={LABEL}
            eingabeClass={EINGABE}
          />
          <div>
            <label htmlFor="band" className={LABEL}>{t.formular.band}</label>
            <input
              id="band"
              name="band"
              type="number"
              inputMode="numeric"
              min="1"
              defaultValue={vorgabe.band ?? ""}
              className={EINGABE}
            />
          </div>
        </div>
      </SerienVorschlagProvider>

      <details className="mt-5 rounded-lg border border-linie-zart bg-karte/60">
        {/* Verlag, Jahr und ISBN sind laut Plan reine Detail-Info und ausdrücklich keine
            Filterkriterien. Eingeklappt, damit die Maske beim Scannen kurz bleibt — die drei
            Werte stehen nach einem API-Treffer ohnehin schon richtig drin. */}
        <summary className="utility flex h-11 cursor-pointer list-none items-center px-3 text-[10px] text-stein">
          {t.formular.weitereAngaben}
        </summary>
        <div className="border-t border-linie-zart px-3 pb-4 pt-3">
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <AuswahlFeld
              name="verlag"
              label={t.formular.verlag}
              werte={verlage}
              vorgabe={vorgabe.verlag ?? null}
              leerText={t.formular.keinVerlag}
              neuText={t.formular.neuerVerlag}
              platzhalter={t.formular.verlagPlatzhalter}
              labelClass={LABEL}
              eingabeClass={EINGABE}
            />
            <div>
              <label htmlFor="jahr" className={LABEL}>{t.formular.jahr}</label>
              <input
                id="jahr"
                name="jahr"
                type="number"
                inputMode="numeric"
                min="1400"
                max="2100"
                defaultValue={vorgabe.jahr ?? ""}
                className={EINGABE}
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="isbn" className={LABEL}>{t.formular.isbn}</label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              inputMode="numeric"
              defaultValue={vorgabe.isbn ? formatiereIsbn(vorgabe.isbn) : ""}
              placeholder="978-…"
              className={`${EINGABE} utility text-[13px]`}
            />
            <p className="mt-1.5 text-[12px] text-stein">
              {t.formular.isbnHinweis}
            </p>
          </div>
        </div>
      </details>

      <div className="mt-7">
        <SpeichernKnopf>{knopf}</SpeichernKnopf>
      </div>
    </form>
  );
}
