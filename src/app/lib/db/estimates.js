import { randomUUID } from "node:crypto";
import { ensureDatabaseSchema } from "./schema.js";
import { getSql } from "./client.js";
import { buildQuoteData } from "../quotes.js";
import { normalizeServiceName } from "../services/catalog.js";

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
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
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
      return {
        id: String(item?.id || `service-${index + 1}`),
        name: normalizeServiceName(item?.name || fallbackService || "").trim(),
        description: String(item?.description || "").trim(),
        price: price.toFixed(2),
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
      name: normalizeServiceName(fallbackService),
      description: "",
      price: "0.00",
      quantity: "1",
      total: "0.00",
    },
  ];
}

function mapEstimateRow(row) {
  const servicesIncluded = normalizeServiceLineItems(
    parseJsonArray(row.services_included),
    row.service
  );
  const primaryServiceLine = servicesIncluded[0] || null;
  const rawQuoteData = parseJsonObject(row.quote_data);
  const quoteData = buildQuoteData(rawQuoteData, {
    unitPrice: primaryServiceLine?.price || normalizeMoney(row.price).toFixed(2),
    quantity: primaryServiceLine?.quantity || "1",
    description: primaryServiceLine?.description || "",
  });

  return {
    id: row.id,
    clientId: row.client_id || null,
    title: String(row.title || `${row.service || "Estimate"} Estimate`).trim(),
    service: normalizeServiceName(row.service || primaryServiceLine?.name || "Service"),
    status: String(row.status || "Pending").trim() || "Pending",
    notes: String(row.notes || "").trim(),
    recipientName: String(row.recipient_name || row.client_name || "").trim(),
    recipientAddress: String(row.recipient_address || row.client_address || "").trim(),
    recipientEmail: String(row.recipient_email || row.client_email || "").trim(),
    recipientPhone: String(row.recipient_phone || row.client_phone || "").trim(),
    servicesIncluded,
    quoteData,
    total: quoteData.total,
    subtotal: quoteData.subtotal,
    gstAmount: quoteData.gstAmount,
    depositAmount: quoteData.depositAmount,
    pdfUrl: row.pdf_url || "",
    pdfName: row.pdf_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminEstimates() {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      e.*,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone
    FROM estimates e
    LEFT JOIN clients c ON c.id = e.client_id
    ORDER BY e.updated_at DESC, e.created_at DESC
  `;

  return rows.map(mapEstimateRow);
}

export async function findEstimateById(id) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      e.*,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone
    FROM estimates e
    LEFT JOIN clients c ON c.id = e.client_id
    WHERE e.id = ${id}
    LIMIT 1
  `;

  return rows[0] ? mapEstimateRow(rows[0]) : null;
}

export async function createEstimate({
  clientId = null,
  title,
  service,
  recipientName,
  recipientAddress,
  recipientEmail,
  recipientPhone,
  notes = "",
  servicesIncluded = [],
  quoteData = {},
  status = "Pending",
}) {
  await ensureDatabaseSchema();
  const sql = getSql();
  const timestamp = nowIso();
  const normalizedServicesIncluded = normalizeServiceLineItems(servicesIncluded, service);
  const primaryServiceLine = normalizedServicesIncluded[0] || null;
  const normalizedQuoteData = buildQuoteData(quoteData, {
    unitPrice: primaryServiceLine?.price || "0.00",
    quantity: primaryServiceLine?.quantity || "1",
    description: primaryServiceLine?.description || "",
  });
  const normalizedService = normalizeServiceName(service || primaryServiceLine?.name || "Service");

  const [row] = await sql`
    INSERT INTO estimates (
      id,
      client_id,
      title,
      service,
      price,
      status,
      notes,
      recipient_name,
      recipient_address,
      recipient_email,
      recipient_phone,
      services_included,
      quote_data,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${clientId ? String(clientId).trim() : null},
      ${String(title || `${normalizedService} Estimate`).trim()},
      ${normalizedService},
      ${normalizeMoney(normalizedQuoteData.total)},
      ${String(status || "Pending").trim() || "Pending"},
      ${String(notes || "").trim()},
      ${String(recipientName || "").trim()},
      ${String(recipientAddress || "").trim()},
      ${String(recipientEmail || "").trim()},
      ${String(recipientPhone || "").trim()},
      ${JSON.stringify(normalizedServicesIncluded)},
      ${JSON.stringify(normalizedQuoteData)},
      ${timestamp},
      ${timestamp}
    )
    RETURNING id
  `;

  return row?.id ? findEstimateById(row.id) : null;
}
