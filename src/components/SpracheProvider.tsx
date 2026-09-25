"use client";

// Reicht die Sprache an die Client-Komponenten weiter. Übergeben wird nur das Kürzel, nicht
// das Wörterbuch: Dessen Funktionen ließen sich nicht vom Server in den Browser serialisieren.
// Beide Wörterbücher liegen deshalb im Browser-Bundle — zusammen ein paar Kilobyte.

import { createContext, useContext } from "react";
import { woerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";

const SpracheContext = createContext<Sprache>("de");

export function SpracheProvider({ sprache, children }: { sprache: Sprache; children: React.ReactNode }) {
  return <SpracheContext.Provider value={sprache}>{children}</SpracheContext.Provider>;
}

export function useTexte(): Woerterbuch {
  return woerterbuch(useContext(SpracheContext));
}
