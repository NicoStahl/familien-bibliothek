"use client";

import { useFormStatus } from "react-dom";
import { useTexte } from "@/components/SpracheProvider";

/**
 * Absendeknopf, der sich während der Verarbeitung selbst sperrt.
 *
 * Beim Bücherfuchs ist das kein Feinschliff, sondern nötig: Das Speichern lädt unter Umständen
 * erst noch das Cover von Google oder Open Library herunter. Das dauert spürbar, und ohne
 * Rückmeldung tippt man ein zweites Mal — und legt das Buch doppelt an.
 */
export function SpeichernKnopf({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const t = useTexte();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-lg bg-tinte text-base font-semibold text-papier disabled:opacity-60"
    >
      {pending ? t.formular.wirdGespeichert : children}
    </button>
  );
}
