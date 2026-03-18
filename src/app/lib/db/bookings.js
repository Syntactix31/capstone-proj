import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";

// Return timestamps in a consistent ISO format for inserts and updates.
function nowIso() {
  return new Date().toISOString();
}

// Keep booking status values limited to the ones the app supports.
function normalizeStatus(status) {
  return status === "cancelled" ? "cancelled" : "confirmed";
}

// Format stored timestamps into Edmonton-local date/time strings for the UI.
function formatEdmontonParts(iso) {
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

// Convert joined booking rows into the object shape used by pages and routes.
function mapBookingRow(row) {
  const pretty = formatEdmontonParts(row.start_at);
  return {
    id: row.id,
    clientId: row.client_id,
    propertyId: row.property_id,
    eventId: row.google_event_id,
    googleEventId: row.google_event_id,
    client: row.client_name,
    firstName: row.client_name?.split(" ")?.[0] || "",
    email: row.client_email,
    service: row.service,
    date: pretty.date,
    time: pretty.time,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    address: row.address || "",
    notes: row.notes || "",
    startIso: row.start_at,
    endIso: row.end_at,
    status: row.status === "cancelled" ? "Canceled" : "Confirmed",
  };
}

// Shared helper for "find one booking" queries.
async function fetchBookingByWhere(whereSql) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await whereSql(sql);
  return rows[0] ? mapBookingRow(rows[0]) : null;
}

// Save a new booking record after the calendar event has been created.
export async function createBooking({
  clientId,
  propertyId = null,
  service,
  status = "confirmed",
  bookingDate,
  bookingTime,
  startAt,
  endAt,
  notes = "",
  googleEventId = null,
}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const id = randomUUID();
  const timestamp = nowIso();

  const [row] = await sql`
    INSERT INTO bookings (
      id,
      client_id,
      property_id,
      service,
      status,
      booking_date,
      booking_time,
      start_at,
      end_at,
      notes,
      google_event_id,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${clientId},
      ${propertyId},
      ${String(service || "")},
      ${normalizeStatus(status)},
      ${bookingDate},
      ${bookingTime},
      ${startAt},
      ${endAt},
      ${String(notes || "")},
      ${googleEventId},
      ${timestamp},
      ${timestamp}
    )
    RETURNING id
  `;

  return findBookingById(row.id);
}

// Find a booking by its internal DB ID.
export async function findBookingById(id) {
  return fetchBookingByWhere((sql) => sql`
    SELECT
      b.*,
      c.name AS client_name,
      c.email AS client_email,
      p.address
    FROM bookings b
    JOIN clients c ON c.id = b.client_id
    LEFT JOIN client_properties p ON p.id = b.property_id
    WHERE b.id = ${id}
    LIMIT 1
  `);
}

// Find a booking by the Google Calendar event ID linked to it.
export async function findBookingByGoogleEventId(eventId) {
  return fetchBookingByWhere((sql) => sql`
    SELECT
      b.*,
      c.name AS client_name,
      c.email AS client_email,
      p.address
    FROM bookings b
    JOIN clients c ON c.id = b.client_id
    LEFT JOIN client_properties p ON p.id = b.property_id
    WHERE b.google_event_id = ${eventId}
    LIMIT 1
  `);
}

// Load bookings for admin views, with cancelled ones optional.
export async function listBookings({ includeCancelled = false } = {}) {
  await ensureDatabaseSchema();
  const sql = getSql();

  const rows = includeCancelled
    ? await sql`
        SELECT
          b.*,
          c.name AS client_name,
          c.email AS client_email,
          p.address
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        LEFT JOIN client_properties p ON p.id = b.property_id
        ORDER BY b.start_at ASC
      `
    : await sql`
        SELECT
          b.*,
          c.name AS client_name,
          c.email AS client_email,
          p.address
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        LEFT JOIN client_properties p ON p.id = b.property_id
        WHERE b.status <> 'cancelled'
        ORDER BY b.start_at ASC
      `;

  return rows.map(mapBookingRow);
}

// Return booked time ranges for one day so the frontend can disable slots.
export async function listBusyIntervalsForDate(date) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT start_at, end_at, google_event_id
    FROM bookings
    WHERE booking_date = ${date}
      AND status <> 'cancelled'
    ORDER BY start_at ASC
  `;

  return rows.map((row) => ({
    start: new Date(row.start_at).toISOString(),
    end: new Date(row.end_at).toISOString(),
    eventId: row.google_event_id,
  }));
}

// Update the stored booking that matches a Google Calendar event.
export async function updateBookingByGoogleEventId(eventId, patch) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const [current] = await sql`
    SELECT *
    FROM bookings
    WHERE google_event_id = ${eventId}
    LIMIT 1
  `;

  if (!current) return null;

  await sql`
    UPDATE bookings
    SET
      property_id = ${patch.propertyId ?? current.property_id},
      service = ${String(patch.service ?? current.service)},
      status = ${normalizeStatus(patch.status ?? current.status)},
      booking_date = ${patch.bookingDate ?? current.booking_date},
      booking_time = ${patch.bookingTime ?? current.booking_time},
      start_at = ${patch.startAt ?? current.start_at},
      end_at = ${patch.endAt ?? current.end_at},
      notes = ${String(patch.notes ?? current.notes ?? "")},
      google_event_id = ${patch.googleEventId ?? current.google_event_id},
      updated_at = ${timestamp}
    WHERE google_event_id = ${eventId}
  `;

  return findBookingByGoogleEventId(patch.googleEventId ?? eventId);
}
