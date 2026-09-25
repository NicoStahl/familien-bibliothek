import { notFound } from "next/navigation";
import { devLogin } from "@/lib/authActions";
import { isDevBypassAllowed } from "@/lib/auth";
import { Fuchs } from "@/components/Fuchs";
import { texte } from "@/lib/i18n/server";

export default async function DevLoginSeite({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  if (!isDevBypassAllowed()) notFound();
  const { fehler } = await searchParams;
  const t = await texte();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Fuchs className="h-14 w-14" />
      <h1 className="titel-gross mt-4 text-[30px]">Bücherfuchs</h1>
      <p className="mt-2 text-sm leading-relaxed text-stein">
        {t.devLogin.text}
      </p>

      <form action={devLogin} className="mt-6">
        <label htmlFor="username" className="utility block text-[10px] text-stein">
          {t.devLogin.benutzername}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          // autoComplete="off" ist hier nicht kosmetisch: Ohne den Hinweis hält der
          // Passwortmanager das Formular für eine echte Anmeldung und füllt Felder selbst. In
          // Haushaltsrechnung und Umsatzbeteiligung landete dadurch ein echtes Passwort als
          // Anzeigename in der Datenbank, weil provisionUser den Wert zurückschreibt.
          autoComplete="off"
          defaultValue="admin"
          className="mt-2 h-12 w-full rounded-lg border border-linie bg-karte px-3"
        />

        {fehler === "leer" && (
          <p className="mt-2 text-sm text-rost">{t.devLogin.leer}</p>
        )}

        <button
          type="submit"
          className="mt-4 h-12 w-full rounded-lg bg-tinte text-base font-semibold text-papier"
        >
          {t.devLogin.anmelden}
        </button>
      </form>
    </main>
  );
}
