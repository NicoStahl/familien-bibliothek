"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SPRACH_COOKIE, istSprache } from "./i18n";

const EIN_JAHR = 60 * 60 * 24 * 365;

/**
 * Merkt sich die Sprachwahl unter „Mehr" im Cookie. Ohne Anmeldung am Konto, sondern pro
 * Browser: Die Anmeldung teilen sich in einer Familie oft mehrere, die Geräte nicht.
 */
export async function setzeSprache(formData: FormData): Promise<void> {
  const sprache = formData.get("sprache");
  if (!istSprache(sprache)) return;

  (await cookies()).set(SPRACH_COOKIE, sprache, {
    path: "/",
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "1",
    maxAge: EIN_JAHR,
  });
  revalidatePath("/", "layout");
}
