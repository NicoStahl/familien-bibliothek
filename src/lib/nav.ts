// Eine gemeinsame Quelle für die Tab-Leiste. Mit zwei Darstellungen (Leiste am Handy,
// Kopfzeile am Rechner) laufen zwei Kopien sonst auseinander — dieselbe Festlegung wie bei
// Kochkiste.
//
// Fünf feste Plätze, dauerhaft. Anders als bei Kochkiste gibt es KEINEN eigenen Reiter für
// die Suche: Der Katalog ist das Grid und trägt Suchfeld und Filter gleich mit sich. Ein
// zweiter Reiter, der dieselbe Liste nur anders gefiltert zeigt, wäre eine Dublette.
//
// "Ausgeliehen" bekommt dafür einen eigenen Platz. Es ist die einzige Frage, die man an eine
// Bibliothek stellt, ohne ein bestimmtes Buch zu suchen: Was ist gerade nicht da?

export type NavIconName = "katalog" | "serien" | "hinzufuegen" | "ausgeliehen" | "mehr";

export type NavItem = {
  href: string;
  /** Schlüssel im Wörterbuch unter `nav`. */
  label: "katalog" | "serien" | "hinzufuegen" | "verliehen" | "mehr";
  icon: NavIconName;
};

export const TABS: NavItem[] = [
  { href: "/", label: "katalog", icon: "katalog" },
  { href: "/serien", label: "serien", icon: "serien" },
  { href: "/hinzufuegen", label: "hinzufuegen", icon: "hinzufuegen" },
  { href: "/ausgeliehen", label: "verliehen", icon: "ausgeliehen" },
  { href: "/mehr", label: "mehr", icon: "mehr" },
];

/**
 * Ein Reiter gilt als aktiv, wenn der Pfad auf ihn zeigt oder darunter liegt. "/" ist der
 * Sonderfall: Es ist Präfix jedes Pfades und darf deshalb nur exakt treffen.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
