/**
 * Das App-Icon: der lesende Fuchs, den Nico am 04.09.2026 geliefert hat.
 *
 * Hier wird die **freigestellte** Fassung gezeigt — der Fuchs ohne jeden Grund, direkt auf dem
 * Papier der App. Das ist der Grund, aus dem die zweite Lieferung mit Alphakanal die bessere
 * ist: Ein Icon mit eingebranntem blauen Kasten säße in der Kopfzeile als Fremdkörper neben der
 * Wortmarke; freigestellt gehört der Fuchs zur Seite statt darauf zu liegen.
 *
 * Für Browser-Tab und Startbildschirm gibt es daneben eine deckende Fassung auf tintenblauem
 * Quadrat (app/icon.png, app/apple-icon.png, public/icon-*.png). Die braucht einen Grund, weil
 * iOS ein transparentes Symbol auf Schwarz setzt. Details in design/README.md.
 */
export function Fuchs({ className }: { className?: string }) {
  return (
    /* Ein gewöhnliches <img>: Das Bild wird immer in derselben kleinen Größe gezeigt —
       next/image brächte hier nichts. Die Unterdrückung muss unmittelbar über dem Element
       stehen, sonst gilt sie für die Kommentarzeile. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/fuchs.png"
      alt="Bücherfuchs"
      width={384}
      height={384}
      className={className ?? "h-10 w-10"}
    />
  );
}
