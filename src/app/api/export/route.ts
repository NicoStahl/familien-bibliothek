import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { csvDateiname, katalogAlsCsv } from "@/lib/csv";
import { texte } from "@/lib/i18n/server";

// CSV-Export des gesamten Katalogs (Plan: "Einfacher Export-Button ... u. a. nutzbar als
// Versicherungsnachweis bei Verlust/Schaden").

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) {
    return new NextResponse("Nicht angemeldet.", { status: 401 });
  }

  const t = await texte();
  return new NextResponse(katalogAlsCsv(t), {
    headers: {
      // text/csv mit charset: Ohne die Angabe raten manche Programme die Kodierung, und der
      // UTF-8-BOM in der Datei ist dann die einzige Absicherung.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvDateiname(t)}"`,
      "Cache-Control": "no-store",
    },
  });
}
