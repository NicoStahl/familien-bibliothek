import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { texte } from "@/lib/i18n/server";

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
  const t = await texte();
  const gruende: Record<string, string> = {
    config: t.loginFehler.config,
    state: t.loginFehler.state,
    exchange: t.loginFehler.exchange,
  };
  const text = (reason && gruende[reason]) ?? t.loginFehler.allgemein;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="titel-gross text-[26px]">{t.loginFehler.titel}</h1>
      <p className="mt-3 text-sm leading-relaxed text-stein">{text}</p>
      {reason && <p className="utility mt-4 text-[10px] text-stein">{t.loginFehler.grund(reason)}</p>}
      <a
        href="/api/auth/login"
        className="mt-6 flex h-12 items-center justify-center rounded-lg bg-tinte text-base font-semibold text-papier"
      >
        {t.loginFehler.nochmal}
      </a>
    </main>
  );
}
