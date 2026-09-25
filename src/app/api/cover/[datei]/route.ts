import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { leseCover } from "@/lib/cover";

// Liefert die gespeicherten Cover aus. Bewusst über eine Route und nicht aus public/: Die
// Bilder entstehen zur Laufzeit, und im Standalone-Build wird public/ zum Zeitpunkt des Builds
// kopiert — später dort abgelegte Dateien würden nie ausgeliefert. Außerdem liegen sie so
// hinter derselben Anmeldung wie der Katalog selbst.

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ datei: string }> }) {
  if (!(await getCurrentUser())) {
    return new NextResponse("Nicht angemeldet.", { status: 401 });
  }

  const { datei } = await params;
  const daten = await leseCover(datei);
  if (!daten) return new NextResponse("Nicht gefunden.", { status: 404 });

  return new NextResponse(new Uint8Array(daten), {
    headers: {
      "Content-Type": "image/jpeg",
      // Der Dateiname ist eine UUID: Ein geändertes Cover bekommt einen neuen Namen, dieses
      // hier ändert seinen Inhalt nie. Deshalb darf der Browser es dauerhaft behalten — im
      // Grid mit 60 Kacheln ist das der Unterschied zwischen sofort und ruckelig.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
