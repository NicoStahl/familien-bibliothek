// Symbol-Schaltflächen. Aus Kochkiste übersetzt, nicht kopiert: Der Bücherfuchs hat sein
// eigenes Farbsystem (Tinte/Messing/Rost statt Basilikum/Paprika).
//
// Ohne sichtbaren Text braucht jede Schaltfläche ein `label`. Es wird als `title` (Tooltip)
// UND als `aria-label` (Screenreader) gesetzt — sonst wäre der Wechsel von Text auf Symbol
// eine Verschlechterung der Bedienbarkeit, keine Verbesserung.
//
// Trefferfläche 44 × 44 px bei 20 px Symbol (WCAG-Empfehlung für Berührungsziele). Bewusst
// nicht kleiner am Rechner — eine zweite Größe wäre nur eine weitere Stelle zum Auseinanderlaufen.

type IconProps = { className?: string };

function icon(children: React.ReactNode) {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  };
}

export const PencilIcon = icon(
  <>
    <path d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16v4" />
    <path d="M13.5 6.5l4 4" />
  </>
);

export const TrashIcon = icon(
  <>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </>
);

export const BackIcon = icon(<path d="M15 6l-6 6l6 6" />);

export const KameraIcon = icon(
  <>
    <path d="M5 7h2l1.5 -2h7l1.5 2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2" />
    <circle cx="12" cy="12" r="3.5" />
  </>
);

export const StiftIcon = icon(
  <>
    <path d="M4 20h4L18.5 9.5a2.828 2.828 0 1 0-4-4L4 16v4" />
    <path d="M13.5 6.5l4 4" />
  </>
);

const TONE = {
  primary: "text-tinte hover:bg-tinte/10",
  negativ: "text-rost hover:bg-rost/10",
  neutral: "text-stein hover:bg-stein/10",
} as const;

export function IconButton({
  label,
  onClick,
  disabled,
  tone = "primary",
  children,
}: {
  /** Klartext der Aktion, z. B. "Grüffelo bearbeiten". Wird Tooltip und aria-label. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: keyof typeof TONE;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${TONE[tone]}`}
    >
      {children}
    </button>
  );
}
