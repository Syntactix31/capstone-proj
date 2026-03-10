import { NextResponse } from "next/server";
import { listBusyIntervalsForDate } from "../../../lib/db/bookings";

export async function POST(req) {
  try {
    const { date } = await req.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const busyIntervals = await listBusyIntervalsForDate(date);

    return NextResponse.json({ busyIntervals });
  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
