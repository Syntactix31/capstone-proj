
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AUTH_COOKIE_NAME } from '../../../../../lib/auth/session.js';
import { findBookingById } from '../../../../../lib/db/bookings.js';
import { ensureDatabaseSchema } from '../../../../../lib/db/schema.js';
import { getSql } from '../../../../../lib/db/client.js';
import { normalizeEmail } from '../../../../../lib/db/users.js';
import { cancelBookingWorkflow } from '../../../../../lib/bookings/cancelBooking.js';

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    await ensureDatabaseSchema();
    const booking = await findBookingById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const sql = getSql();
    const clientEmail = await sql`SELECT email FROM clients WHERE id = ${booking.clientId}`;

    if (normalizeEmail(clientEmail[0]?.email) !== normalizeEmail(session.email)) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.googleEventId) {
      return NextResponse.json({ error: "Booking is missing its calendar event." }, { status: 409 });
    }

    await cancelBookingWorkflow(booking.googleEventId, booking);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CLIENT APPOINTMENT CANCEL ERROR:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
