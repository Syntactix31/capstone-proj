import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listBookings } from "../../../lib/db/bookings";

export async function GET(req) {
  try {
    const auth = requireAdmin(req);
    if (auth.error) return auth.error;
    const appointments = await listBookings();

    return NextResponse.json({ appointments });
  } catch (err) {
    console.error("ADMIN APPOINTMENTS LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
