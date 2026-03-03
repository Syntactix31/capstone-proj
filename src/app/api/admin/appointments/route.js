import { NextResponse } from "next/server";
import { getCalendarClient } from "../../../lib/googleCalendar";

function toEdmontonPretty(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const date = d.toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
  const time = d
    .toLocaleTimeString("en-CA", {
      timeZone: "America/Edmonton",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("a.m.", "AM")
    .replace("p.m.", "PM")
    .replace("am", "AM")
    .replace("pm", "PM");

  return { date, time };
}

function safe(s) {
  return String(s ?? "");
}

export async function GET(req) {
  try {
    const url = new URL(req.url);


    const now = new Date();
    const timeMin = url.searchParams.get("timeMin")
      ? new Date(url.searchParams.get("timeMin"))
      : now;

    const timeMax = url.searchParams.get("timeMax")
      ? new Date(url.searchParams.get("timeMax"))
      : new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
      return NextResponse.json({ error: "Invalid timeMin/timeMax" }, { status: 400 });
    }

    const calendar = await getCalendarClient();

    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items = res.data.items || [];

    const appointments = items
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => {
        const p = e.extendedProperties?.private || {};
        const startIso = e.start.dateTime;
        const { date, time } = toEdmontonPretty(startIso);

        const firstName = safe(p.firstName);
        const lastName = safe(p.lastName);
        const client = `${firstName} ${lastName}`.trim() || "Unknown";

        const service = safe(p.service) || safe(e.summary) || "Appointment";
        const email = safe(p.email);
        const address = safe(p.address) || safe(e.location);
        const notes = safe(p.notes);

        return {
          eventId: e.id,
          client,
          service,
          date,
          time,
          email,
          address,
          notes,
          startIso,
          endIso: e.end.dateTime,
          status: "Confirmed",
        };
      });

    return NextResponse.json({ appointments });
  } catch (err) {
    console.error("ADMIN APPOINTMENTS LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";