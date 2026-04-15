import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/server";
import { convertEstimateToProject } from "../../../../../lib/db/estimates.js";
import { buildQuoteData } from "../../../../../lib/quotes.js";
import {
  FIELD_LIMITS,
  sanitizeAlphaSpace,
  sanitizeEmail,
  sanitizePhone,
  sanitizeTextArea,
} from "../../../../../lib/validation/fields.js";

function normalizeServiceItems(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({
      id: String(item?.id || `service-${index + 1}`),
      name: String(item?.name || "").trim(),
      description: String(item?.description || "").trim(),
      price: String(item?.price || "").trim(),
      quantity: String(item?.quantity || "1").trim(),
      total: String(item?.total || "").trim(),
    }))
    .filter((item) => item.name);
}

function normalizeQuoteData(value) {
  return buildQuoteData(value, {
    unitPrice: value?.unitPrice ?? value?.price,
    quantity: value?.quantity,
    description: value?.description,
  });
}

export async function POST(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const service = sanitizeTextArea(body?.service, FIELD_LIMITS.serviceName).trim();
    const recipientName = sanitizeAlphaSpace(body?.recipientName, FIELD_LIMITS.name).trim();
    const recipientAddress = sanitizeTextArea(body?.recipientAddress, FIELD_LIMITS.address).trim();
    const recipientEmail = sanitizeEmail(body?.recipientEmail).trim();
    const recipientPhone = sanitizePhone(body?.recipientPhone).trim();
    const notes = sanitizeTextArea(body?.notes, FIELD_LIMITS.notes).trim();
    const servicesIncluded = normalizeServiceItems(body?.servicesIncluded);
    const quoteData = normalizeQuoteData(body?.quoteData || {});

    if (!service || !recipientName || !recipientAddress || !recipientEmail || !recipientPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(recipientPhone)) {
      return NextResponse.json({ error: "Phone number must be 10 digits." }, { status: 400 });
    }

    const result = await convertEstimateToProject(id, {
      recipientName,
      recipientAddress,
      recipientEmail,
      recipientPhone,
      service,
      notes,
      servicesIncluded,
      quoteData,
    });

    if (result?.reason === "not_found") {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (result?.reason === "already_converted") {
      return NextResponse.json({ error: "This estimate has already been converted." }, { status: 409 });
    }

    if (!result?.project || !result?.estimate) {
      return NextResponse.json({ error: "Failed to convert estimate to quote." }, { status: 500 });
    }

    return NextResponse.json({ estimate: result.estimate, project: result.project });
  } catch (error) {
    console.error("ADMIN ESTIMATE CONVERT ERROR:", error);
    return NextResponse.json({ error: "Failed to convert estimate" }, { status: 500 });
  }
}

