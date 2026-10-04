import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ladeMvbCover } from "@/lib/buchapi";
import { normalisiereIsbn } from "@/lib/isbn";

// Reicht ein Cover des MVB-Dienstes an den Browser durch — warum, steht in lib/coverVorschau.ts.
//
// Angenommen wird nur eine ISBN, die Adresse baut der Server selbst. Ein Parameter mit einer
// beliebigen URL machte die Route zu einem offenen Proxy hinter der Anmeldung.

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ isbn: string }> }) {
  if (!(await getCurrentUser())) {
    return new NextResponse("Nicht angemeldet.", { status: 401 });
  }

  const isbn13 = normalisiereIsbn((await params).isbn);
  if (!isbn13) return new NextResponse("Keine gültige ISBN.", { status: 400 });

  const bild = await ladeMvbCover(isbn13);
  if (!bild) return new NextResponse("Nicht gefunden.", { status: 404 });

  return new NextResponse(new Uint8Array(bild.daten), {
    headers: {
      "Content-Type": bild.typ,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
