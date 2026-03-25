import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";
import { buildQuoteData } from "../quotes.js";

function nowIso() {
  return new Date().toISOString();
}

function parseJsonArray(value) {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value) {
  if (!value) return {};

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeMoney(value) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeQuantity(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeServiceLineItems(items, fallbackService = "") {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const price = normalizeMoney(item?.price ?? item?.amount);
      const quantity = normalizeQuantity(item?.quantity);
      const rawPrice = String(item?.price ?? item?.amount ?? "").trim();
      return {
        id: String(item?.id || `service-${index + 1}`),
        name: String(item?.name || fallbackService || "").trim(),
        description: String(item?.description || "").trim(),
        price: rawPrice || price.toFixed(2),
        quantity: String(quantity),
        total: (price * quantity).toFixed(2),
      };
    })
    .filter((item) => item.name);

  if (normalized.length) return normalized;
  if (!fallbackService) return [];

  return [
    {
      id: "service-1",
      name: fallbackService,
      description: "",
      price: "0.00",
      quantity: "1",
      total: "0.00",
    },
  ];
}

function normalizePayments(value) {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => ({
      id: String(item?.id || `payment-${index + 1}`),
      date: String(item?.date || "").trim(),
      amount: normalizeMoney(item?.amount).toFixed(2),
      status: String(item?.status || "Pending").trim() || "Pending",
      notes: String(item?.notes || "").trim(),
    }))
    .filter((item) => item.date || Number(item.amount) > 0 || item.notes);
}

function mapProjectRow(row) {
  const servicesIncluded = normalizeServiceLineItems(
    parseJsonArray(row.services_included),
    row.service
  );
  const primaryServiceLine = servicesIncluded[0] || null;
  const totalCost =
    normalizeMoney(row.total_cost) ||
    servicesIncluded.reduce((sum, item) => sum + normalizeMoney(item.total), 0);
  const rawQuoteData = parseJsonObject(row.quote_data);
  const quoteData = Object.keys(rawQuoteData).length
    ? buildQuoteData(rawQuoteData, {
        unitPrice: primaryServiceLine?.price || totalCost,
        quantity: primaryServiceLine?.quantity || "1",
        description: primaryServiceLine?.description || "",
      })
    : null;

  return {
    id: row.id,
    clientId: row.client_id,
    client: row.client_name,
    service: row.service,
    address: row.address || "",
    paymentStatus: row.payment_status || "Unpaid",
    startDate: row.start_date || null,
    estimatedCompletionDate: row.estimated_completion_date || null,
    completionDate: row.completion_date || null,
    totalCost,
    servicesIncluded,
    quoteData,
    payments: normalizePayments(parseJsonArray(row.payments)),
    ownerNotes: row.owner_notes || "",
    estimatePdfUrl: row.estimate_pdf_url || "",
    estimatePdfName: row.estimate_pdf_name || "",
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
      AND b.project_sync_disabled = false
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
  totalCost = 0,
  servicesIncluded = [],
  quoteData = {},
  generateQuote = true,
}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();
  const normalizedServicesIncluded = normalizeServiceLineItems(servicesIncluded, service);
  const primaryServiceLine = normalizedServicesIncluded[0] || null;
  const normalizedTotalCost =
    normalizeMoney(totalCost) ||
    normalizedServicesIncluded.reduce((sum, item) => sum + normalizeMoney(item.total), 0);
  let normalizedQuoteData = {};
  if (generateQuote) {
    const countRows = await sql`SELECT COUNT(*)::int AS count FROM projects`;
    const nextQuoteNumber = String((countRows[0]?.count || 0) + 1);
    normalizedQuoteData = buildQuoteData(quoteData, {
      quoteNumber: nextQuoteNumber,
      unitPrice: primaryServiceLine?.price || normalizedTotalCost,
      quantity: primaryServiceLine?.quantity || "1",
      description: primaryServiceLine?.description || "",
    });
  }

  const [row] = await sql`
    INSERT INTO projects (
      id,
      client_id,
      service,
      address,
      payment_status,
      total_cost,
      services_included,
      quote_data,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${clientId},
      ${String(service || "")},
      ${String(address || "")},
      ${String(paymentStatus || "Unpaid")},
      ${normalizedTotalCost},
      ${JSON.stringify(normalizedServicesIncluded)},
      ${JSON.stringify(normalizedQuoteData)},
      ${timestamp},
      ${timestamp}
    )
    ON CONFLICT (client_id, service, address) DO UPDATE
    SET
      total_cost = EXCLUDED.total_cost,
      services_included = EXCLUDED.services_included,
      quote_data = CASE
        WHEN EXCLUDED.quote_data = '{}' THEN projects.quote_data
        ELSE EXCLUDED.quote_data
      END,
      updated_at = EXCLUDED.updated_at
    RETURNING id
  `;

  return findProjectById(row.id);
}

export async function updateProject(
  id,
  {
    service,
    address,
    paymentStatus,
    startDate,
    estimatedCompletionDate,
    completionDate,
    totalCost,
    servicesIncluded,
    quoteData,
    payments,
    ownerNotes,
    estimatePdfUrl,
    estimatePdfName,
  }
) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();

  const normalizedServicesIncluded = normalizeServiceLineItems(servicesIncluded, service);
  const normalizedPayments = normalizePayments(payments);
  const primaryServiceLine = normalizedServicesIncluded[0] || null;
  const normalizedTotalCost =
    normalizeMoney(totalCost) ||
    normalizedServicesIncluded.reduce((sum, item) => sum + normalizeMoney(item.total), 0);
  const shouldUpdateQuoteData = quoteData !== undefined;
  const normalizedQuoteData = shouldUpdateQuoteData
    ? buildQuoteData(quoteData, {
        unitPrice: primaryServiceLine?.price || normalizedTotalCost,
        quantity: primaryServiceLine?.quantity || "1",
        description: primaryServiceLine?.description || "",
      })
    : null;

  const rows = await sql`
    UPDATE projects
    SET
      service = ${String(service || "")},
      address = ${String(address || "")},
      payment_status = ${String(paymentStatus || "Unpaid")},
      start_date = ${startDate ? String(startDate) : null},
      estimated_completion_date = ${estimatedCompletionDate ? String(estimatedCompletionDate) : null},
      completion_date = ${completionDate ? String(completionDate) : null},
      total_cost = ${normalizedTotalCost},
      services_included = ${JSON.stringify(normalizedServicesIncluded)},
      quote_data = CASE
        WHEN ${shouldUpdateQuoteData} THEN ${JSON.stringify(normalizedQuoteData)}
        ELSE quote_data
      END,
      payments = ${JSON.stringify(normalizedPayments)},
      owner_notes = ${String(ownerNotes || "")},
      estimate_pdf_url = ${estimatePdfUrl ? String(estimatePdfUrl) : null},
      estimate_pdf_name = ${estimatePdfName ? String(estimatePdfName) : null},
      updated_at = ${timestamp}
    WHERE id = ${id}
    RETURNING id
  `;

  return rows[0] ? findProjectById(rows[0].id) : null;
}

export async function deleteProject(id) {
  await ensureDatabaseSchema();
  const sql = getSql();

  await sql`
    UPDATE bookings
    SET project_sync_disabled = true
    WHERE project_id = ${id}
  `;

  const rows = await sql`
    DELETE FROM projects
    WHERE id = ${id}
    RETURNING id
  `;

  return Boolean(rows[0]?.id);
}
