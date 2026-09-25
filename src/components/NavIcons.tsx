import type { NavIconName } from "@/lib/nav";

// Inline-SVG im Tabler-Outline-Stil: 24er Raster, Strichstärke 2, runde Enden,
// stroke="currentColor". Keine Icon-Bibliothek — für eine Handvoll Symbole lohnt keine
// Abhängigkeit. Dieselbe Festlegung wie bei Kochkiste ("SVG-only" steht auch im Plan).

const PATHS: Record<NavIconName, React.ReactNode> = {
  // Zwei Bücher nebeneinander, eines leicht geneigt — das Regal.
  katalog: (
    <>
      <path d="M4 5a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1z" />
      <path d="M10 5a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1z" />
      <path d="M17.5 4.5l2.5 .7l-3.2 13.5l-2.5 -.7z" />
    </>
  ),
  // Gestapelte Ebenen: mehrere Bände, die zusammengehören.
  serien: (
    <>
      <path d="M12 3l8 4.5l-8 4.5l-8 -4.5z" />
      <path d="M4 12l8 4.5l8 -4.5" />
      <path d="M4 16.5l8 4.5l8 -4.5" />
    </>
  ),
  hinzufuegen: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  // Hand, die etwas weggibt.
  ausgeliehen: (
    <>
      <path d="M4 13h3l3 3h4a2 2 0 0 1 0 4h-5l-3 -2h-2" />
      <path d="M9 9a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
      <path d="M20 11v-5" />
      <path d="M17.5 8.5l2.5 2.5l2.5 -2.5" />
    </>
  ),
  mehr: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-6 w-6"}
    >
      {PATHS[name]}
    </svg>
  );
}
