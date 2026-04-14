import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listBookings } from "../../../lib/db/bookings";
import { listClients } from "../../../lib/db/clients";
import { listServices } from "../../../lib/db/services";

// Return the summary data shown on the main admin dashboard page.
export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const [appointments, clients, services] = await Promise.all([
      listBookings(),
      listClients(),
      listServices(),
    ]);
    return NextResponse.json({ appointments, clients, services });
  } catch (error) {
    console.error("ADMIN OVERVIEW ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
