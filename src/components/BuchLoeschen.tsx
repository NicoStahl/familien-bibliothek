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
 *
 * Die Rückfrage nennt den Titel (UI-Konventionen, Detailseiten-Variante): „Wirklich löschen?"
 * beantwortet man mit ja, ohne hinzusehen; „Eragon löschen?" liest man. Gleiche Form und gleicher
 * Wortlaut wie beim Spielefuchs (ItemLoeschen).
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
    <div className="ml-3 min-w-0 flex-1 rounded-lg border border-rost bg-rost/5 p-3">
      <p className="text-[13px] leading-snug text-tinte">{t.buch.loeschenFrage(titel)}</p>
      <div className="mt-3 flex gap-2">
        <form action={entferneBuch} className="flex-1">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-rost text-sm font-semibold text-papier"
          >
            {t.buch.jaLoeschen}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setFragt(false)}
          className="h-11 flex-1 rounded-lg border border-linie bg-karte text-sm font-semibold text-tinte"
        >
          {t.buch.abbrechen}
        </button>
      </div>
    </div>
  );
}
