import Link from "next/link";
import { Scanner } from "@/components/Scanner";
import { IsbnEingabe } from "@/components/IsbnEingabe";
import { texte } from "@/lib/i18n/server";

// Der primäre Weg ins Regal: Barcode scannen. So steht es im Plan, und so ist die App
// gedacht — man steht vor dem Regal, nicht vor der Tastatur.
//
// Seit dem 05.09.2026 steht darunter die ISBN-Eingabe von Hand. Sie ist kein zweiter, eigener
// Weg, sondern derselbe: Beide führen auf `/hinzufuegen/erfassen` und damit durch dieselbe
// Metadaten- und Duplikatprüfung. Gebraucht wird sie, wenn die Nummer zwar dasteht, aber nicht
// lesbar ist — abgerissener oder überklebter Barcode, zu wenig Licht, schlechte Rechnerkamera,
// oder die ISBN steht nur im Impressum.
//
// Die Reihenfolge auf der Seite ist die Rangfolge: Kamera zuerst, Tastatur darunter, das leere
// Formular ganz unten. Wer vor dem Regal steht, soll nicht erst an einem Eingabefeld
// vorbeiscrollen.

export async function generateMetadata() {
  const t = await texte();
  return { title: t.seitentitel(t.hinzufuegen.reiter) };
}

export default async function HinzufuegenSeite() {
  const t = await texte();
  return (
    <div className="px-5 pt-6">
      <h1 className="titel-gross text-[27px]">{t.hinzufuegen.titel}</h1>
      <p className="mt-2 text-sm leading-relaxed text-stein">
        {t.hinzufuegen.einleitung}
      </p>

      <div className="mt-5">
        <Scanner />
      </div>

      <div className="mt-6 border-t border-linie-zart pt-4">
        <p className="text-[13px] leading-relaxed text-stein">
          {t.hinzufuegen.handHinweis}
        </p>
        <div className="mt-3">
          <IsbnEingabe />
        </div>
      </div>

      <div className="mt-6 border-t border-linie-zart pt-4">
        <p className="text-[13px] leading-relaxed text-stein">
          {t.hinzufuegen.ohneIsbnHinweis}
        </p>
        <Link
          href="/hinzufuegen/manuell"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-lg border border-linie text-base font-semibold text-tinte"
        >
          {t.hinzufuegen.ohneBarcode}
        </Link>
      </div>
    </div>
  );
}
