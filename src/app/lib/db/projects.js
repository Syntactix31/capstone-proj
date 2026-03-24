import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";

function nowIso() {
  return new Date().toISOString();
}

function mapProjectRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    client: row.client_name,
    service: row.service,
    address: row.address || "",
    paymentStatus: row.payment_status || "Unpaid",
    nextVisitDate: row.next_visit_date || null,
    nextVisitTime: row.next_visit_time || null,
    nextVisitTs: row.next_visit_ts ? new Date(row.next_visit_ts).getTime() : Number.POSITIVE_INFINITY,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function syncProjectsFromBookings() {
  await ensureDatabaseSchema();
  const sql = getSql();

  const bookings = await sql`
    SELECT
      b.id,
      b.client_id,
      b.service,
      COALESCE(p.address, '') AS address
    FROM bookings b
    LEFT JOIN client_properties p ON p.id = b.property_id
    WHERE b.project_id IS NULL
    ORDER BY b.created_at ASC
  `;

  for (const booking of bookings) {
    const timestamp = nowIso();
    const [project] = await sql`
      INSERT INTO projects (
        id,
        client_id,
        service,
        address,
        payment_status,
        created_at,
        updated_at
      )
      VALUES (
        ${randomUUID()},
        ${booking.client_id},
        ${String(booking.service || "")},
        ${String(booking.address || "")},
        ${"Unpaid"},
        ${timestamp},
        ${timestamp}
      )
      ON CONFLICT (client_id, service, address) DO UPDATE
      SET updated_at = EXCLUDED.updated_at
      RETURNING id
    `;

    await sql`
      UPDATE bookings
      SET project_id = ${project.id}
      WHERE id = ${booking.id}
    `;
  }
}

export async function listProjects({ clientId = null } = {}) {
  await syncProjectsFromBookings();
  const sql = getSql();

  const rows = clientId
    ? await sql`
        SELECT
          pr.*,
          c.name AS client_name,
          upcoming.booking_date AS next_visit_date,
          upcoming.booking_time AS next_visit_time,
          upcoming.start_at AS next_visit_ts
        FROM projects pr
        JOIN clients c ON c.id = pr.client_id
        LEFT JOIN LATERAL (
          SELECT booking_date, booking_time, start_at
          FROM bookings
          WHERE project_id = pr.id
            AND status <> 'cancelled'
            AND start_at >= NOW()
          ORDER BY start_at ASC
          LIMIT 1
        ) upcoming ON TRUE
        WHERE pr.client_id = ${clientId}
        ORDER BY pr.updated_at DESC, pr.created_at DESC
      `
    : await sql`
        SELECT
          pr.*,
          c.name AS client_name,
          upcoming.booking_date AS next_visit_date,
          upcoming.booking_time AS next_visit_time,
          upcoming.start_at AS next_visit_ts
        FROM projects pr
        JOIN clients c ON c.id = pr.client_id
        LEFT JOIN LATERAL (
          SELECT booking_date, booking_time, start_at
          FROM bookings
          WHERE project_id = pr.id
            AND status <> 'cancelled'
            AND start_at >= NOW()
          ORDER BY start_at ASC
          LIMIT 1
        ) upcoming ON TRUE
        ORDER BY pr.updated_at DESC, pr.created_at DESC
      `;

  return rows.map(mapProjectRow);
}

export async function findProjectById(id) {
  await syncProjectsFromBookings();
  const sql = getSql();
  const rows = await sql`
    SELECT
      pr.*,
      c.name AS client_name,
      upcoming.booking_date AS next_visit_date,
      upcoming.booking_time AS next_visit_time,
      upcoming.start_at AS next_visit_ts
    FROM projects pr
    JOIN clients c ON c.id = pr.client_id
    LEFT JOIN LATERAL (
      SELECT booking_date, booking_time, start_at
      FROM bookings
      WHERE project_id = pr.id
        AND status <> 'cancelled'
        AND start_at >= NOW()
      ORDER BY start_at ASC
      LIMIT 1
    ) upcoming ON TRUE
    WHERE pr.id = ${id}
    LIMIT 1
  `;

  return rows[0] ? mapProjectRow(rows[0]) : null;
}

export async function createProject({
  clientId,
  service,
  address = "",
  paymentStatus = "Unpaid",
}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const [row] = await sql`
    INSERT INTO projects (
      id,
      client_id,
      service,
      address,
      payment_status,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${clientId},
      ${String(service || "")},
      ${String(address || "")},
      ${String(paymentStatus || "Unpaid")},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (client_id, service, address) DO UPDATE
    SET updated_at = EXCLUDED.updated_at
    RETURNING id
  `;

  return findProjectById(row.id);
}
