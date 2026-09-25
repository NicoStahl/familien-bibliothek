import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { csvDateiname, katalogAlsCsv } from "@/lib/csv";

// CSV-Export des gesamten Katalogs (Plan: "Einfacher Export-Button ... u. a. nutzbar als
// Versicherungsnachweis bei Verlust/Schaden").

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) {
    return new NextResponse("Nicht angemeldet.", { status: 401 });
  }

  return new NextResponse(katalogAlsCsv(), {
    headers: {
      // text/csv mit charset: Ohne die Angabe raten manche Programme die Kodierung, und der
      // UTF-8-BOM in der Datei ist dann die einzige Absicherung.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvDateiname()}"`,
      "Cache-Control": "no-store",
    },
  });
}
