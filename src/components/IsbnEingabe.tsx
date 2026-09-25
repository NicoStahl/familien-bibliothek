"use client";

// Die ISBN von Hand eintippen — der zweite Weg neben dem Scanner.
//
// Er führt bewusst auf dieselbe Seite wie ein erfolgreicher Scan (`/hinzufuegen/erfassen`) und
// damit durch dieselbe Metadaten- und Duplikatprüfung. Ein eigener Weg mit eigener Logik wäre
// die zweite Stelle gewesen, an der Titel geholt und Duplikate gemeldet werden — und die zweite
// Stelle, die man beim nächsten Umbau vergisst.
//
// Wofür man das braucht, obwohl es den Scanner gibt: Der Barcode ist abgerissen oder überklebt,
// das Licht reicht nicht, die Kamera ist am Rechner keine gute, oder die Nummer steht nur im
// Impressum. In all diesen Fällen ist die ISBN da — nur nicht lesbar für die Kamera.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pruefeIsbnEingabe } from "@/lib/isbn";
import { useTexte } from "@/components/SpracheProvider";

export function IsbnEingabe() {
  const router = useRouter();
  const [wert, setWert] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const t = useTexte();

  const meldung: Record<string, string> = {
    leer: t.isbnEingabe.leer,
    laenge: t.isbnEingabe.laenge,
    "kein-buch": t.isbnEingabe.keinBuch,
    pruefziffer: t.isbnEingabe.pruefziffer,
  };

  function absenden(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    const ergebnis = pruefeIsbnEingabe(wert);

    if (ergebnis.art !== "ok") {
      setFehler(meldung[ergebnis.art]);
      return;
    }

    setFehler(null);
    router.push(`/hinzufuegen/erfassen?isbn=${ergebnis.isbn13}`);
  }

  return (
    <form onSubmit={absenden} noValidate>
      <label className="utility block text-[10px] text-stein" htmlFor="isbn-eingabe">
        {t.isbnEingabe.label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="isbn-eingabe"
          name="isbn"
          type="text"
          // inputMode statt type="number": Die Tastatur zeigt Ziffern, aber Bindestriche und das
          // X der alten Prüfziffer bleiben eingebbar, und es gibt keine Spinner-Pfeile.
          inputMode="numeric"
          autoComplete="off"
          placeholder="978-3-426-52996-6"
          value={wert}
          onChange={(e) => {
            setWert(e.target.value);
            // Die Meldung verschwindet beim ersten Tastendruck: Sie beschreibt eine Eingabe,
            // die es nicht mehr gibt.
            if (fehler) setFehler(null);
          }}
          aria-invalid={fehler !== null}
          aria-describedby={fehler ? "isbn-fehler" : undefined}
          className="h-12 min-w-0 flex-1 rounded-lg border border-linie bg-karte px-3 outline-none focus:border-tinte"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-lg bg-tinte px-5 text-base font-semibold text-papier"
        >
          {t.isbnEingabe.suchen}
        </button>
      </div>

      {/* Rost nur als Rahmen und Grund, der Text bleibt tintenblau — dieselbe Bauweise wie die
          Kamera-Fehlerbox und die Störungsmeldung. Das Design-System führt Rost als Statusfarbe
          für „verliehen" und ausdrücklich nicht als Textfarbe. */}
      {fehler && (
        <p
          id="isbn-fehler"
          role="alert"
          className="mt-2 rounded-lg border border-rost/40 bg-rost/5 p-2.5 text-[12.5px] leading-relaxed text-tinte"
        >
          {fehler}
        </p>
      )}
    </form>
  );
}
