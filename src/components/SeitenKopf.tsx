import Link from "next/link";
import { BackIcon } from "@/components/IconButton";

/**
 * Kopfzeile für Unterseiten mit Rückweg.
 *
 * Die Tab-Leiste bleibt zwar stehen, führt aber nur auf die fünf Hauptbereiche. Ohne diesen
 * Pfeil käme man von einer Buchseite nur über "Katalog" zurück, und das ist ein Tipp auf eine
 * andere Stelle des Bildschirms als die, an der man gerade liest.
 */
export function SeitenKopf({
  titel,
  zurueck,
  zurueckLabel,
  untertitel,
  titelZeile,
}: {
  titel: string;
  zurueck: string;
  zurueckLabel: string;
  untertitel?: string;
  /** Ersetzt die Überschrift, wenn sie mehr sein muss als Text -- etwa mit Bleistift daneben. */
  titelZeile?: React.ReactNode;
}) {
  return (
    <div className="px-5 pt-6">
      <Link
        href={zurueck}
        className="-ml-2 inline-flex h-11 items-center gap-1 pl-2 pr-3 text-sm text-stein"
      >
        <BackIcon />
        {zurueckLabel}
      </Link>

      {titelZeile ?? <h1 className="titel-gross mt-1 text-[27px]">{titel}</h1>}
      {untertitel && <p className="mt-2 text-sm leading-relaxed text-stein">{untertitel}</p>}
    </div>
  );
}
