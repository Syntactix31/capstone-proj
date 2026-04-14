import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, AUTH_COOKIE_NAME } from "../../../lib/auth/session.js";
import { createBooking } from "../../../lib/db/bookings.js";
import { ensureDatabaseSchema } from "../../../lib/db/schema.js";
import { getSql } from "../../../lib/db/client.js";
import { normalizeEmail } from "../../../lib/db/users.js";
import { fetchClientJoinedByEmail } from "../../../lib/db/clients.js";
import { getCalendarClient } from "../../../lib/googleCalendar.js";

const EDMONTON_TIME_ZONE = "America/Edmonton";
const EDMONTON_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const dynamic = "force-dynamic";

function formatEdmontonParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const date = d.toLocaleDateString("en-CA", { timeZone: EDMONTON_TIME_ZONE });
  const time = d
    .toLocaleTimeString("en-CA", {
      timeZone: EDMONTON_TIME_ZONE,
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

function parseTime12h(timeStr) {
  const match = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toLowerCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (meridiem === "pm" && hours !== 12) hours += 12;
  return { hours, minutes };
}

function buildEdmontonDate(dateStr, timeStr) {
  const time = parseTime12h(timeStr);
  const date = String(dateStr || "").trim();
  if (!time || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const [year, month, day] = date.split("-").map((value) => Number(value));
  let utcMillis = Date.UTC(year, month - 1, day, time.hours, time.minutes, 0);

  for (let i = 0; i < 3; i += 1) {
    const parts = EDMONTON_PARTS_FORMATTER.formatToParts(new Date(utcMillis));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const zonedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      0,
    );
    const desiredAsUtc = Date.UTC(year, month - 1, day, time.hours, time.minutes, 0);
    const diffMs = desiredAsUtc - zonedAsUtc;
    if (diffMs === 0) break;
    utcMillis += diffMs;
  }

  return new Date(utcMillis);
}

function mapAppointmentRow(row) {
  const pretty = formatEdmontonParts(row.start_at);
  return {
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id,
    propertyId: row.property_id,
    eventId: row.google_event_id,
    googleEventId: row.google_event_id,
    client: row.client_name,
    firstName: row.client_name?.split(" ")?.[0] || "",
    email: row.client_email,
    service: row.service,
    visitType: row.visit_type || "Estimate",
    date: pretty.date,
    time: pretty.time,
    address: row.address || "",
    notes: row.notes || "",
    startIso: row.start_at,
    endIso: row.end_at,
    status: row.status === "cancelled" ? "Canceled" : "Confirmed",
  };
}

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureDatabaseSchema();
    const sql = getSql();
    const clientBookingsRaw = await sql`
      SELECT
        b.*,
        c.name AS client_name,
        c.email AS client_email,
        p.address
      FROM bookings b
      JOIN clients c ON c.id = b.client_id
      LEFT JOIN client_properties p ON p.id = b.property_id
      WHERE c.email = ${normalizeEmail(session.email)}
      ORDER BY b.start_at ASC
    `;

    return NextResponse.json({ appointments: clientBookingsRaw.map(mapAppointmentRow) });
  } catch (err) {
    console.error("CLIENT APPOINTMENTS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const service = String(payload?.service || "").trim();
    const visitType = String(payload?.visitType || "Estimate").trim() || "Estimate";
    const date = String(payload?.date || "").trim();
    const time = String(payload?.time || "").trim();
    const notes = String(payload?.notes || "").trim().slice(0, 1000);
    const allowedVisitTypes = new Set(["Estimate", "Design Consultation"]);

    if (!service || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!allowedVisitTypes.has(visitType)) {
      return NextResponse.json(
        { error: "Clients can only book estimate or design consultation appointments." },
        { status: 400 }
      );
    }

    const start = buildEdmontonDate(date, time);
    if (!start || Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }

    if (start.getTime() < Date.now()) {
      return NextResponse.json({ error: "Cannot book in the past." }, { status: 400 });
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await ensureDatabaseSchema();
    const sql = getSql();

    const [client] = await sql`
      INSERT INTO clients (id, email, name, created_at, updated_at)
      VALUES (
        ${session.sub},
        ${normalizeEmail(session.email)},
        ${String(session.name || "Client").trim()},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
      ON CONFLICT (email) DO UPDATE
      SET name = COALESCE(NULLIF(clients.name, ''), EXCLUDED.name),
          updated_at = EXCLUDED.updated_at
      RETURNING id, name, email
    `;

    const clientProfile = await fetchClientJoinedByEmail(client.email);
    if (!clientProfile?.propertyId || !clientProfile?.address) {
      return NextResponse.json(
        { error: "Please add your property address to your client profile before booking an appointment." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM bookings
      WHERE status <> 'cancelled'
        AND start_at < ${end.toISOString()}
        AND end_at > ${start.toISOString()}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "That time is already booked." }, { status: 409 });
    }

    const calendar = await getCalendarClient();
    const calendarConflicts = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start.getTime() - 1).toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
    });

    if ((calendarConflicts.data.items || []).length > 0) {
      return NextResponse.json({ error: "That time is already booked." }, { status: 409 });
    }

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${service} - ${client.name}`.trim(),
        location: clientProfile.address,
        description: [
          `Visit Type: ${visitType}`,
          `Name: ${client.name}`,
          `Email: ${client.email}`,
          `Address: ${clientProfile.address}`,
          `Notes: ${notes || "None"}`,
          `Booked from client portal`,
        ].join("\n"),
        extendedProperties: {
          private: {
            service,
            visitType,
            firstName: String(client.name || "").split(" ")[0] || "",
            lastName: String(client.name || "").split(" ").slice(1).join(" "),
            email: client.email,
            address: clientProfile.address,
            notes,
            date,
            time,
          },
        },
        start: { dateTime: start.toISOString(), timeZone: EDMONTON_TIME_ZONE },
        end: { dateTime: end.toISOString(), timeZone: EDMONTON_TIME_ZONE },
      },
    });

    const booking = await createBooking({
      clientId: client.id,
      propertyId: clientProfile.propertyId,
      service,
      visitType,
      status: "confirmed",
      bookingDate: date,
      bookingTime: time,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      notes,
      googleEventId: event.data.id,
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error("CREATE CLIENT BOOKING ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
