import nextEnv from "@next/env";
import { ensureDatabaseSchema } from "../src/app/lib/db/schema.js";
import { getSql } from "../src/app/lib/db/client.js";
import { getCalendarClient } from "../src/app/lib/googleCalendar.js";

const { loadEnvConfig } = nextEnv;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printUsage() {
  console.log(`
Usage:
  node scripts/reset-appointments.mjs [--commit] [--include-orphans] [--google] [--all-google-events]

Flags:
  --commit             Apply the deletion. Without this flag, the script runs in dry-run mode.
  --include-orphans    After deleting bookings, also delete:
                       - properties not referenced by any booking
                       - clients with no bookings and no estimates
  --google             Also delete matching appointment events from the configured Google Calendar
  --all-google-events  Delete every event from the configured Google Calendar
                       Use this only if the calendar is dedicated to bookings
`);
}

function isAppBookingEvent(event) {
  const privateProps = event?.extendedProperties?.private || {};
  return Boolean(
    privateProps.service &&
      (privateProps.email || privateProps.firstName || privateProps.date || privateProps.time)
  );
}

async function listAllGoogleEvents(calendar, calendarId) {
  const events = [];
  let pageToken;

  do {
    const response = await calendar.events.list({
      calendarId,
      singleEvents: false,
      showDeleted: false,
      maxResults: 2500,
      pageToken,
    });

    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return events;
}

async function main() {
  loadEnvConfig(process.cwd());

  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  await ensureDatabaseSchema();
  const sql = getSql();

  const commit = hasFlag("--commit");
  const includeOrphans = hasFlag("--include-orphans");
  const includeGoogle = hasFlag("--google") || hasFlag("--all-google-events");
  const deleteAllGoogleEvents = hasFlag("--all-google-events");

  const [bookingCountRow] = await sql`
    SELECT COUNT(*)::int AS count
    FROM bookings
  `;

  const [bookedClientCountRow] = await sql`
    SELECT COUNT(DISTINCT client_id)::int AS count
    FROM bookings
  `;

  const [orphanPropertyCountRow] = await sql`
    SELECT COUNT(*)::int AS count
    FROM client_properties p
    WHERE NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.property_id = p.id
    )
  `;

  const [orphanClientCountRow] = await sql`
    SELECT COUNT(*)::int AS count
    FROM clients c
    WHERE NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.client_id = c.id
    )
      AND NOT EXISTS (
        SELECT 1
        FROM estimates e
        WHERE e.client_id = c.id
      )
  `;

  const bookingRows = await sql`
    SELECT google_event_id
    FROM bookings
    WHERE google_event_id IS NOT NULL
  `;
  const bookingEventIds = new Set(bookingRows.map((row) => row.google_event_id).filter(Boolean));

  let googleEventsToDelete = [];
  if (includeGoogle) {
    if (!process.env.GOOGLE_CALENDAR_ID) {
      throw new Error("Missing GOOGLE_CALENDAR_ID");
    }

    const calendar = await getCalendarClient();
    const allGoogleEvents = await listAllGoogleEvents(calendar, process.env.GOOGLE_CALENDAR_ID);

    googleEventsToDelete = deleteAllGoogleEvents
      ? allGoogleEvents
      : allGoogleEvents.filter(
          (event) => bookingEventIds.has(event.id) || isAppBookingEvent(event)
        );
  }

  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Bookings to delete: ${bookingCountRow.count}`);
  console.log(`Clients currently tied to bookings: ${bookedClientCountRow.count}`);

  if (includeOrphans) {
    console.log(`Orphan properties to delete after booking reset: ${orphanPropertyCountRow.count}`);
    console.log(`Clients to delete after booking reset: ${orphanClientCountRow.count}`);
  } else {
    console.log("Orphan cleanup: skipped");
  }

  if (includeGoogle) {
    console.log(
      `Google events to delete: ${googleEventsToDelete.length}${deleteAllGoogleEvents ? " (all events in configured calendar)" : " (DB-linked + app-created booking events)"}`
    );
  } else {
    console.log("Google cleanup: skipped");
  }

  if (!commit) {
    console.log("");
    console.log("No data was deleted.");
    console.log("Re-run with --commit to apply changes.");
    return;
  }

  if (includeGoogle && googleEventsToDelete.length > 0) {
    const calendar = await getCalendarClient();
    for (const event of googleEventsToDelete) {
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: event.id,
      });
    }
  }

  const deletedBookings = await sql`
    DELETE FROM bookings
    RETURNING 1
  `;

  let deletedProperties = [];
  let deletedClients = [];

  if (includeOrphans) {
    deletedProperties = await sql`
      DELETE FROM client_properties p
      WHERE NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.property_id = p.id
      )
      RETURNING 1
    `;

    deletedClients = await sql`
      DELETE FROM clients c
      WHERE NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.client_id = c.id
      )
        AND NOT EXISTS (
          SELECT 1
          FROM estimates e
          WHERE e.client_id = c.id
        )
      RETURNING 1
    `;
  }

  const [remainingBookingsRow] = await sql`
    SELECT COUNT(*)::int AS count
    FROM bookings
  `;

  console.log("");
  console.log("Cleanup complete.");
  console.log(`Remaining bookings: ${remainingBookingsRow.count}`);
  console.log(`Deleted bookings: ${deletedBookings.length}`);
  console.log(`Deleted Google events: ${googleEventsToDelete.length}`);
  console.log(`Deleted properties: ${deletedProperties.length}`);
  console.log(`Deleted clients: ${deletedClients.length}`);
}

main().catch((error) => {
  console.error("Failed to reset appointment data.");
  console.error(error);
  process.exit(1);
});
