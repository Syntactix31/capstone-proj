import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/server";
import { recordAdminActivity } from "../../../../lib/admin/audit.js";
import { createEstimate } from "../../../../lib/db/estimates.js";
import { fetchClientById } from "../../../../lib/db/clients.js";
import { getSql } from "../../../../lib/db/client.js";
import { buildQuoteData } from "../../../../lib/quotes.js";
import { generateEstimatePdfBuffer, getEstimatePdfFilename } from "../../../../lib/estimates/server-pdf.js";
import { put } from "@vercel/blob";
import {
  FIELD_LIMITS,
  sanitizeAlphaSpace,
  sanitizeEmail,
  sanitizePhone,
  sanitizeTextArea,
} from "../../../../lib/validation/fields.js";

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

export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const clientId = String(body?.clientId || "").trim();
    const selectedClient = clientId ? await fetchClientById(clientId) : null;

    if (clientId && !selectedClient) {
      return NextResponse.json({ error: "Selected client not found" }, { status: 404 });
    }

    const service = sanitizeTextArea(body?.service, FIELD_LIMITS.serviceName).trim();
    const recipientName = sanitizeAlphaSpace(
      body?.recipientName || selectedClient?.name,
      FIELD_LIMITS.name
    ).trim();
    const recipientAddress = sanitizeTextArea(
      body?.recipientAddress || selectedClient?.address,
      FIELD_LIMITS.address
    ).trim();
    const recipientEmail = sanitizeEmail(body?.recipientEmail || selectedClient?.email).trim();
    const recipientPhone = sanitizePhone(body?.recipientPhone || selectedClient?.phone).trim();
    const notes = sanitizeTextArea(body?.notes, FIELD_LIMITS.notes).trim();
    const servicesIncluded = normalizeServiceItems(body?.servicesIncluded);
    const quoteData = normalizeQuoteData(body?.quoteData || {});

    if (!service || !recipientName || !recipientAddress || !recipientEmail || !recipientPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(recipientPhone)) {
      return NextResponse.json({ error: "Phone number must be 10 digits." }, { status: 400 });
    }

    const estimate = await createEstimate({
      clientId: selectedClient?.id || null,
      title: `${service} Estimate`,
      service,
      recipientName,
      recipientAddress,
      recipientEmail,
      recipientPhone,
      notes,
      servicesIncluded,
      quoteData,
      status: "Pending",
    });

    // Generate PDF
    let pdfUrl = null;
    let pdfName = getEstimatePdfFilename(estimate);

    if (process.env.PDF_READ_WRITE_TOKEN) {
      try {
        const pdfBuffer = await generateEstimatePdfBuffer(estimate);
        const blob = await put(`estimates/${Date.now()}-${pdfName}`, pdfBuffer, {
          access: "public",
          contentType: "application/pdf",
          token: process.env.PDF_READ_WRITE_TOKEN,
        });
        pdfUrl = blob.url;

        // Update estimate with PDF URL
        const sql = getSql();
        await sql`
          UPDATE estimates
          SET pdf_url = ${pdfUrl}, pdf_name = ${pdfName}
          WHERE id = ${estimate.id}
        `;
      } catch (uploadErr) {
        console.error("PDF upload failed; continuing without pdf_url:", uploadErr);
      }
    } else {
      console.warn("PDF_READ_WRITE_TOKEN not set; skipping PDF storage for estimate");
    }

    await recordAdminActivity(req, {
      action: "Created estimate",
      details: `Created estimate "${estimate.title}" for ${estimate.recipientName}.`,
      metadata: { estimateId: estimate.id, service: estimate.service, recipientName: estimate.recipientName },
    });

    return NextResponse.json({ estimate: { ...estimate, pdfUrl, pdfName } }, { status: 201 });
  } catch (error) {
    console.error("ADMIN ESTIMATE CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to create estimate" }, { status: 500 });
  }
}
