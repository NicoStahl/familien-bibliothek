import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

// Abmelden per GET, damit ein einfacher Link genügt. Beendet nur die Sitzung dieser App —
// die DSM-Anmeldung bleibt bestehen (siehe lib/authActions.ts).
export async function GET() {
  await clearSession();
  return new NextResponse(null, { status: 307, headers: { Location: "/" } });
}
