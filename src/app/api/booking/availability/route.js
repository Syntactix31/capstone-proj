import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";
import { formatISO } from "date-fns";

export async function POST(req) {
  const { date } = await req.json();

  const calendar = await getCalendarClient();

  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  const events = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    timeMin: formatISO(startOfDay),
    timeMax: formatISO(endOfDay),
    singleEvents: true,
  });

  const bookedTimes = events.data.items.map((e) =>
    e.start?.dateTime ? new Date(e.start.dateTime).toISOString() : null
  );

  return NextResponse.json({ bookedTimes });
}

export const runtime = "nodejs";
