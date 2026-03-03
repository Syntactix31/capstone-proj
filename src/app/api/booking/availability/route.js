import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";

export async function POST(req) {
  try {
    const { date } = await req.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const calendar = await getCalendarClient();

    const timeMin = `${date}T00:00:00-07:00`;
    const timeMax = `${date}T23:59:59-07:00`;

    const events = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = events.data.items || [];

    const busyIntervals = items
      .map((e) => {
        const start = e.start?.dateTime;
        const end = e.end?.dateTime;
        if (!start || !end) return null;
        const s = new Date(start);
        const en = new Date(end);
        if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) return null;
        return { start: s.toISOString(), end: en.toISOString(), eventId: e.id };
      })
      .filter(Boolean);

    return NextResponse.json({ busyIntervals });
  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";