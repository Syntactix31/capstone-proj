import { NextResponse } from "next/server";
import { cancelBookingWorkflow } from "../../../lib/bookings/cancelBooking.js";

// Cancel the booking in Google Calendar, update Postgres, and send emails.
export async function POST(req) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    await cancelBookingWorkflow(eventId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
