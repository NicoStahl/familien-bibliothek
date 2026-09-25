"use client";

import { useState } from "react";
import { IconButton, StiftIcon } from "@/components/IconButton";
import { benenneSerieUmAction } from "@/lib/buchActions";
import { useTexte } from "@/components/SpracheProvider";

/**
 * Der Serienname auf der Serienseite — mit Bleistift zum Umbenennen.
 *
 * Nach den UI-Konventionen zeigt die Seite erst den Wert; das Eingabefeld erscheint nach dem
 * Bleistift. Umbenannt wird an allen Bänden zugleich (`benenneSerieUm`), und weil das auch
 * Schreibvarianten zusammenführt, steht der Hinweis darauf direkt am Feld: Wer "Die Drei ???"
 * in "Die drei ???" ändert, verschmilzt beide Reihen — meist genau die Absicht, aber nichts,
 * was still passieren sollte.
 *
 * Kein Zurück-Knopf für "verschmolzen" — das ließe sich nur mit einer Historie umkehren, und
 * die will der Plan nicht. Wer sich vertippt, benennt noch einmal um.
 */
export function SerieUmbenennen({ name }: { name: string }) {
  const [offen, setOffen] = useState(false);
  const t = useTexte();

  if (!offen) {
    return (
      <div className="mt-1 flex items-start justify-between gap-2">
        <h1 className="titel-gross text-[27px]">{name}</h1>
        <div className="-mr-2 shrink-0">
          <IconButton label={t.serien.umbenennen(name)} onClick={() => setOffen(true)} tone="neutral">
            <StiftIcon />
          </IconButton>
        </div>
      </div>
    );
  }

  return (
    <form action={benenneSerieUmAction} className="mt-1">
      <input type="hidden" name="alt" value={name} />
      <label htmlFor="neu" className="utility block text-[10px] text-stein">
        {t.serien.umbenennenLabel}
      </label>
      <input
        id="neu"
        name="neu"
        type="text"
        defaultValue={name}
        required
        autoFocus
        className="mt-1.5 h-12 w-full rounded-lg border border-linie bg-karte px-3 text-base outline-none focus:border-tinte"
      />
      <p className="mt-1.5 text-[12px] leading-relaxed text-stein">
        {t.serien.umbenennenHinweis}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-lg bg-tinte text-sm font-semibold text-papier"
        >
          {t.serien.umbenennenKnopf}
        </button>
        <button
          type="button"
          onClick={() => setOffen(false)}
          className="h-11 flex-1 rounded-lg border border-linie bg-karte text-sm font-semibold text-tinte"
        >
          {t.serien.abbrechen}
        </button>
      </div>
    </form>
  );
}
