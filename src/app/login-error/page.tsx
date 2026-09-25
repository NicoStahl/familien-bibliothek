import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const GRUENDE: Record<string, string> = {
  config:
    "Die SSO-Zugangsdaten fehlen auf dem Server (OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET oder OIDC_REDIRECT_URI).",
  state:
    "Die Anmeldung konnte nicht zugeordnet werden. Das passiert, wenn der Vorgang zu lange gedauert hat oder in einem anderen Fenster begonnen wurde. Bitte noch einmal versuchen.",
  exchange:
    "DSM hat die Anmeldung abgelehnt. Meist war der Anmeldelink schon verbraucht — dann genügt ein neuer Versuch. Bleibt es dabei, weichen die in DSM hinterlegten Angaben der Anwendung von denen der App ab (Client-ID, Client-Secret oder Redirect-URI).",
};

export default async function LoginFehlerSeite({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  // Wird der Callback durch Safaris Vorabladen doppelt angefragt, scheitert der zweite
  // Austausch, obwohl der erste die Sitzung bereits gesetzt hat. Diese Seite ist der spätere
  // Aufruf und sieht das Sitzungs-Cookie darum in aller Regel schon — dann gehört der Nutzer
  // in die App und nicht vor eine Fehlermeldung, die keine ist.
  if (await getCurrentUser()) redirect("/");

  const { reason } = await searchParams;
  const text = (reason && GRUENDE[reason]) ?? "Die Anmeldung ist fehlgeschlagen.";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="titel-gross text-[26px]">Anmeldung fehlgeschlagen</h1>
      <p className="mt-3 text-sm leading-relaxed text-stein">{text}</p>
      {reason && <p className="utility mt-4 text-[10px] text-stein">Grund: {reason}</p>}
      <a
        href="/api/auth/login"
        className="mt-6 flex h-12 items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier"
      >
        Noch einmal versuchen
      </a>
    </main>
  );
}
