/**
 * Steht anstelle eines Covers, wenn keines gefunden und keines fotografiert wurde.
 *
 * In der großen Fassung zeigt er den Titel — und das ist der Punkt. Der Katalog ist bewusst
 * eine reine Bildansicht ohne Text unter den Kacheln (so steht es im Plan); eine leere
 * Platzhalterfläche wäre darin eine anonyme Kachel, die man nur durch Antippen identifizieren
 * kann. Der Titel muss also IN den Platzhalter, nicht darunter.
 *
 * `klein` kehrt das um: In der Verliehen-Liste ist die Vorschau 48 px breit, und dort zerfiele
 * ein Titel in unlesbare Silbenreste ("Jam / ie / Oliv"). Titel und Autor stehen in dieser
 * Ansicht ohnehin direkt daneben, also tritt an ihre Stelle ein Buchsymbol.
 *
 * Die Gestaltung zitiert in beiden Fällen einen Buchrücken: schmaler Messingstreifen oben,
 * heller Grund, feine Linie unten.
 */
export function CoverPlatzhalter({
  titel,
  autor,
  klein,
  className,
}: {
  titel: string;
  autor?: string | null;
  klein?: boolean;
  className?: string;
}) {
  if (klein) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-karte ${className ?? ""}`}
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-messing" />
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-stein">
          <path d="M3 5.5a1 1 0 0 1 1 -1h5a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0 -2.5 -2.5h-5.5z" />
          <path d="M21 5.5a1 1 0 0 0 -1 -1h-5a3 3 0 0 0 -3 3v12a2.5 2.5 0 0 1 2.5 -2.5h5.5z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col justify-between overflow-hidden bg-karte ${className ?? ""}`}
      aria-hidden="true"
    >
      <div className="h-1.5 w-full shrink-0 bg-messing" />
      <div className="flex min-h-0 flex-1 flex-col justify-center px-2.5 py-2">
        {/* line-clamp statt Kürzen im Code: Wo genau der Titel abbricht, hängt von der
            Kachelbreite ab, und die kennt nur der Browser.

            hyphens-auto braucht das lang="de" am <html>, das im Root-Layout steht — ohne
            Silbentrennung schiebt ein Wort wie "Drachenreiter" die Zeile in einer 105 px
            breiten Kachel über den Rand. break-words steht als Rückfall daneben, weil die
            Trennmuster nicht in jedem Browser vorhanden sind. */}
        <p className="titel-klein line-clamp-4 hyphens-auto break-words text-[13px] text-tinte">
          {titel}
        </p>
        {autor && (
          <p className="mt-1 line-clamp-2 break-words text-[10.5px] leading-tight text-stein">
            {autor}
          </p>
        )}
      </div>
      <div className="mx-2.5 mb-2 h-px shrink-0 bg-linie-zart" />
    </div>
  );
}
