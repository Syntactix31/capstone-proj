import { NextResponse } from "next/server";
import { listBusyIntervalsForDate } from "../../../lib/db/bookings";

// Return booked time ranges for a selected day so the UI can disable those slots.
export async function POST(req) {
  try {
    const { date, dates } = await req.json();

    if (Array.isArray(dates)) {
      const validDates = dates.filter((value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      );

      if (!validDates.length) {
        return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
      }

      const results = await Promise.all(
        validDates.map(async (value) => [value, await listBusyIntervalsForDate(value)])
      );

      return NextResponse.json({
        busyIntervalsByDate: Object.fromEntries(results),
      });
    }

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
