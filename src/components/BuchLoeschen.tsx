"use client";

import { useState } from "react";
import { entferneBuch } from "@/lib/buchActions";
import { IconButton, TrashIcon } from "@/components/IconButton";
import { useTexte } from "@/components/SpracheProvider";

/**
 * Löschen mit Zwischenschritt.
 *
 * Bewusst kein window.confirm: Der native Dialog sieht auf dem iPhone aus wie eine
 * Systemmeldung und wird reflexhaft weggetippt. Ein Knopf, der sich in zwei Knöpfe verwandelt,
 * verlangt dagegen eine Bewegung an eine andere Stelle des Bildschirms — genau die Pause, um
 * die es geht. Ein gelöschtes Buch ist samt Cover weg, es gibt keinen Papierkorb.
 */
export function BuchLoeschen({ id, titel }: { id: number; titel: string }) {
  const [fragt, setFragt] = useState(false);
  const t = useTexte();

  if (!fragt) {
    return (
      <IconButton label={t.buch.loeschen(titel)} tone="negativ" onClick={() => setFragt(true)}>
        <TrashIcon />
      </IconButton>
    );
  }

  return (
    <form action={entferneBuch} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => setFragt(false)}
        className="h-11 rounded-md px-3 text-sm font-semibold text-stein"
      >
        {t.buch.abbrechen}
      </button>
      <button type="submit" className="h-11 rounded-md bg-rost px-3 text-sm font-semibold text-papier">
        {t.buch.wirklichLoeschen}
      </button>
    </form>
  );
}
