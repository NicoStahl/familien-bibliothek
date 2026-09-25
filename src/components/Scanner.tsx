"use client";

// Barcode-Scanner für ISBN-Aufkleber, mit ZXing-js clientseitig — so steht es im Plan. Der
// Scan selbst braucht damit keinen Server-Roundtrip; erst die erkannte Nummer geht hinaus.
//
// Gelesen wird ausschließlich EAN-13. Das ist das Format jedes ISBN-Aufklebers, und die
// Einschränkung ist kein Detail: Ohne sie versucht ZXing bei jedem Videobild ein Dutzend
// Formate durch, was auf einem älteren Handy sichtbar ruckelt und die Fehlerkennungen erhöht.
//
// Was hier NICHT passiert: Die App entscheidet nichts allein. Ein erkannter Code führt zu
// einer Karte mit Titel, Cover und — wenn das Buch schon im Regal steht — einer Warnung, wer
// es besitzt. Erst ein Tipp darauf führt weiter. Beim Scannen eines Stapels kann man so
// zügig durchgehen und trotzdem jedes Duplikat sehen, bevor es entsteht.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalisiereIsbn } from "@/lib/isbn";
import { stoerungsText, type Dienststoerung } from "@/lib/stoerung";

type Duplikat = { id: number; titel: string; besitzer: string };

type Treffer = {
  titel: string;
  autor: string | null;
  coverUrl: string | null;
};

type Fund = {
  isbn: string;
  treffer: Treffer | null;
  duplikate: Duplikat[];
  /** Welche Verzeichnisse nicht antworten konnten. Leer heißt: gefragt und nicht gekannt. */
  stoerungen: Dienststoerung[];
  /** Die eigene Anfrage kam nicht durch — dann wurde gar nicht erst nach draußen gefragt. */
  abfrageGescheitert?: boolean;
};

type Zustand =
  | { art: "startet" }
  | { art: "laeuft" }
  | { art: "sucht"; isbn: string }
  | { art: "fund"; fund: Fund }
  | { art: "fehler"; text: string };

/** Übersetzt die Ausnahmen von getUserMedia in Sätze, mit denen jemand etwas anfangen kann. */
function kameraFehler(fehler: unknown): string {
  const name = fehler instanceof Error ? fehler.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Der Zugriff auf die Kamera wurde abgelehnt. In den Einstellungen des Browsers für diese Seite die Kamera erlauben und die Seite neu laden.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Es wurde keine Kamera gefunden.";
  }
  if (name === "NotReadableError") {
    return "Die Kamera wird gerade von einem anderen Programm benutzt.";
  }
  return "Die Kamera ließ sich nicht starten.";
}

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  /** IScannerControls von ZXing. Nur zum Anhalten, deshalb bewusst lose typisiert. */
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  /** Zuletzt verarbeiteter Code — verhindert, dass derselbe Barcode 30-mal pro Sekunde feuert. */
  const zuletztRef = useRef<string | null>(null);

  const [zustand, setZustand] = useState<Zustand>({ art: "startet" });

  const verarbeite = useCallback(async (isbn13: string) => {
    setZustand({ art: "sucht", isbn: isbn13 });
    try {
      const res = await fetch(`/api/isbn/${isbn13}`);
      if (!res.ok) throw new Error(String(res.status));
      const daten = (await res.json()) as Fund;
      setZustand({ art: "fund", fund: daten });
    } catch {
      // Auch ohne Netz soll es weitergehen: Die ISBN ist gelesen, das Formular kann sie
      // aufnehmen, und die Metadaten trägt man dann eben von Hand nach.
      //
      // `abfrageGescheitert` statt einer erfundenen Dienststörung: Hier ist die eigene Anfrage
      // steckengeblieben, die Verzeichnisse wurden nie gefragt. Sie deshalb als ausgefallen zu
      // melden, wäre bequem und falsch — und beim nächsten Fehlersuchen genau die Spur, die in
      // die Irre führt.
      setZustand({
        art: "fund",
        fund: { isbn: isbn13, treffer: null, duplikate: [], stoerungen: [], abfrageGescheitert: true },
      });
    }
  }, []);

  useEffect(() => {
    let abgebrochen = false;

    async function starte() {
      // mediaDevices fehlt komplett, wenn die Seite nicht in einem sicheren Kontext läuft —
      // also über http auf einer anderen Adresse als localhost. Auf der NAS ist das nie der
      // Fall (der Reverse Proxy liefert HTTPS aus); beim Testen im WLAN dagegen schon, und
      // dann ist eine klare Ansage besser als eine tote schwarze Fläche.
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setZustand({
          art: "fehler",
          text: "Die Kamera steht nur über HTTPS zur Verfügung. Am Rechner geht es über localhost, am Handy erst über die HTTPS-Adresse der App.",
        });
        return;
      }

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
        const reader = new BrowserMultiFormatReader(hints);

        if (abgebrochen || !videoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          // "ideal" statt "exact": Auf einem Rechner ohne Rückkamera würde exact den Start
          // scheitern lassen, statt einfach die vorhandene Kamera zu nehmen.
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (ergebnis) => {
            if (!ergebnis) return;
            const roh = ergebnis.getText();
            if (roh === zuletztRef.current) return;

            const isbn13 = normalisiereIsbn(roh);
            // Kein Buch-Barcode (Zeitschrift, Handelsware) oder kaputte Prüfziffer: still
            // ignorieren und weiterlesen. Eine Fehlermeldung pro Videobild wäre unbrauchbar.
            if (!isbn13) return;

            zuletztRef.current = roh;
            controls.stop();
            void verarbeite(isbn13);
          }
        );

        controlsRef.current = controls;
        if (abgebrochen) controls.stop();
        else setZustand({ art: "laeuft" });
      } catch (fehler) {
        if (!abgebrochen) setZustand({ art: "fehler", text: kameraFehler(fehler) });
      }
    }

    void starte();

    return () => {
      abgebrochen = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
    // Läuft genau einmal. Die Kamera bei jeder Zustandsänderung neu zu starten wäre nicht nur
    // verschwenderisch, es würde auch das Bild bei jedem Fund kurz schwarz werden lassen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function weiterScannen() {
    zuletztRef.current = null;
    // Ein vollständiger Neuaufbau ist hier der ehrlichste Weg zurück in den laufenden Scan:
    // Die ZXing-Kontrolle ist nach stop() verbraucht, und router.refresh() setzt zugleich den
    // Katalog im Hintergrund auf den neuen Stand.
    router.refresh();
    window.location.reload();
  }

  return (
    <div>
      {/* Bei einem Kamerafehler verschwindet das Bild ganz.

          Das Element bleibt im Baum (nur versteckt), weil videoRef sonst beim nächsten Versuch
          ins Leere zeigt — aber es nimmt keinen Platz mehr ein. Eine 450 px hohe schwarze
          Fläche über einer Fehlermeldung ist kein Kamerabild, sondern eine Sackgasse: Sie
          schiebt die Meldung und den Weg zur Handeingabe unter den Bildschirmrand, und genau
          die beiden braucht man in dem Moment. */}
      <div className={zustand.art === "fehler" ? "hidden" : "overflow-hidden rounded-xl bg-tinte"}>
        <video ref={videoRef} className="scanner-video" muted playsInline />
      </div>

      <div className={zustand.art === "fehler" ? "" : "mt-4"}>
        {zustand.art === "startet" && <Hinweis>Kamera wird gestartet …</Hinweis>}
        {zustand.art === "laeuft" && (
          <Hinweis>Den Barcode auf der Buchrückseite ins Bild halten.</Hinweis>
        )}
        {zustand.art === "sucht" && <Hinweis>ISBN {zustand.isbn} — Titel wird gesucht …</Hinweis>}
        {zustand.art === "fehler" && (
          <div className="rounded-lg border border-rost/40 bg-rost/5 p-4">
            <p className="text-sm leading-relaxed text-tinte">{zustand.text}</p>
            <Link href="/hinzufuegen/manuell" className="utility mt-3 inline-block text-[10.5px] text-tinte underline">
              Buch von Hand eintragen
            </Link>
          </div>
        )}
        {zustand.art === "fund" && <FundKarte fund={zustand.fund} weiter={weiterScannen} />}
      </div>
    </div>
  );
}

function Hinweis({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-stein">{children}</p>;
}

/**
 * Was nach einem erkannten Barcode zu sehen ist.
 *
 * Die Duplikat-Warnung steht ÜBER dem Titel, nicht darunter: Sie ist die Auskunft, die eine
 * Entscheidung ändert, und sie muss gelesen sein, bevor der Daumen auf "Aufnehmen" geht.
 * Blockiert wird trotzdem nichts — zwei Geschwister dürfen dasselbe Buch je einmal besitzen.
 */
function FundKarte({ fund, weiter }: { fund: Fund; weiter: () => void }) {
  const { treffer, duplikate, isbn, stoerungen, abfrageGescheitert } = fund;

  // Warum nichts dasteht — oder null, wenn "kennt keiner" die ganze Wahrheit ist.
  const hinweis = abfrageGescheitert
    ? "Die Anfrage kam nicht bis zum Bücherfuchs durch; die Buch-Verzeichnisse wurden gar nicht erst gefragt. Später noch einmal versuchen — oder die Angaben jetzt von Hand eintragen."
    : stoerungsText(stoerungen);

  return (
    <div className="rounded-xl border border-linie bg-karte p-4">
      {duplikate.length > 0 && (
        <div className="mb-4 rounded-lg border border-messing/50 bg-messing/10 p-3">
          <p className="text-sm leading-relaxed text-tinte">
            {duplikate.length === 1
              ? `Dieses Buch steht schon im Regal — es gehört ${duplikate[0].besitzer}.`
              : `Dieses Buch steht schon ${duplikate.length}-mal im Regal: ${duplikate
                  .map((d) => d.besitzer)
                  .join(", ")}.`}
          </p>
          {/* Der Besitzername im Link, nicht "Vorhandenes ansehen": Bei zwei Exemplaren
              stünden sonst zwei gleich beschriftete Links untereinander, und man müsste raten,
              welcher wohin führt. */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {duplikate.map((d) => (
              <Link
                key={d.id}
                href={`/buch/${d.id}`}
                className="utility text-[10.5px] text-tinte underline"
              >
                Exemplar von {d.besitzer}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {treffer?.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={treffer.coverUrl}
            alt=""
            className="h-[96px] w-16 shrink-0 rounded object-cover shadow-[0_1px_3px_rgba(43,58,74,.2)]"
          />
        )}
        <div className="min-w-0 flex-1">
          {/* "Nicht abrufbar" statt "nicht gefunden", wenn niemand geantwortet hat: Die Zeile
              ist das Erste, was gelesen wird, und sie darf keine Auskunft behaupten, die es
              nicht gibt. */}
          <p className="titel-klein text-[16px]">
            {treffer?.titel ?? (hinweis ? "Titel nicht abrufbar" : "Kein Titel gefunden")}
          </p>
          {treffer?.autor && <p className="mt-1 text-[13px] text-stein">{treffer.autor}</p>}
          <p className="utility mt-2 text-[10px] text-stein">{isbn}</p>
          {!treffer && !hinweis && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-stein">
              Weder Google Books noch Open Library kennen diese ISBN. Titel und Autor lassen
              sich im nächsten Schritt von Hand eintragen — die ISBN bleibt erhalten.
            </p>
          )}
          {!treffer && hinweis && (
            <p className="mt-2 rounded-lg border border-rost/40 bg-rost/5 p-2.5 text-[12.5px] leading-relaxed text-tinte">
              {hinweis}
            </p>
          )}
        </div>
      </div>

      <Link
        href={`/hinzufuegen/erfassen?isbn=${isbn}`}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier"
      >
        Ins Regal aufnehmen
      </Link>
      <button
        type="button"
        onClick={weiter}
        className="mt-2 h-11 w-full rounded-lg border border-linie text-sm font-semibold text-tinte"
      >
        Nächstes Buch scannen
      </button>
    </div>
  );
}
