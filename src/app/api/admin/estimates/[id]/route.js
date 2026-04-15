import { NextResponse } from "next/server";
import { getSql } from "../../../../lib/db/client";
import { put, del } from "@vercel/blob";
import { requireAdmin } from "../../../../lib/auth/server";
import { ensureDatabaseSchema } from "../../../../lib/db/schema.js";
import { findEstimateById } from "../../../../lib/db/estimates.js";
import { findProjectById, updateProject } from "../../../../lib/db/projects.js";
import { updateClient } from "../../../../lib/db/clients.js";
import { buildQuoteData } from "../../../../lib/quotes.js";
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

// Delete a Blob URL safely
async function deleteBlobPdf(pdfUrl) {
  if (!pdfUrl) return;
  if (!process.env.PDF_READ_WRITE_TOKEN) {
    console.warn("PDF_READ_WRITE_TOKEN not set; skipping delete of blob PDF:", pdfUrl);
    return;
  }

  try {
    await del(pdfUrl, {
      token: process.env.PDF_READ_WRITE_TOKEN,
    });
  } catch (err) {
    console.error("Failed to delete blob PDF:", err);
    // Proceed anyway; DB is more important
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = requireAdmin(req);
    if (auth.error) return auth.error;

    const sql = await getSql();
    const { id } = await params;
    const formData = await req.formData();

    const clientInput = formData.get("client_id") || formData.get("client");
    const titleRaw = formData.get("title");
    const serviceRaw = formData.get("service");
    const priceRaw = formData.get("price");
    const statusRaw = formData.get("status");
    const notesRaw = formData.get("notes");

    const title = titleRaw?.toString().trim() || "Proposal";
    const service = serviceRaw?.toString().trim();
    const rawPrice = priceRaw?.toString().trim();
    const status = statusRaw?.toString().trim() || "Pending";
    const notes = notesRaw?.toString().trim() || "";

    if (!clientInput || !service || !rawPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sanitizedPrice = rawPrice.replace(/[^0-9.\-]/g, "");
    const numericPrice = parseFloat(sanitizedPrice);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // resolve client id
    const clientRes = await sql`
      SELECT id FROM clients
      WHERE id = ${clientInput} OR name = ${clientInput}
      LIMIT 1
    `;

    if (!clientRes.length) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const clientId = clientRes[0].id;

    // handle optional PDF update
    let pdfUrl = null;
    let pdfName = null;

    const pdfFile = formData.get("pdf");
    if (pdfFile && typeof pdfFile === "object" && typeof pdfFile.arrayBuffer === "function") {
      pdfName = pdfFile.name || "estimate.pdf";

      if (!process.env.PDF_READ_WRITE_TOKEN) {
        console.warn("PDF_READ_WRITE_TOKEN not set; skipping PDF storage for estimate update", {
          clientInput,
          fileName: pdfName,
        });
      } else {
        try {
          const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
          const blob = await put(`estimates/${Date.now()}-${pdfName}`, fileBuffer, {
            access: "public",
            contentType: pdfFile.type || "application/pdf",
            token: process.env.PDF_READ_WRITE_TOKEN,
          });
          pdfUrl = blob.url;
        } catch (uploadErr) {
          console.error("PDF upload failed on update; continuing without pdf_url:", uploadErr);
        }
      }
    }

    // Fetch old PDF URL before update
    const existingRow = await sql`
      SELECT pdf_url
      FROM estimates
      WHERE id = ${id}
    `;

    const oldPdfUrl = existingRow.length > 0 ? existingRow[0].pdf_url : null;

    const now = new Date().toISOString();

    await sql`
      UPDATE estimates
      SET
        client_id = ${clientId},
        title     = ${title},
        service   = ${service},
        price     = ${numericPrice},
        status    = ${status},
        notes     = ${notes},
        ${pdfUrl ? sql`pdf_url = ${pdfUrl},` : sql``}
        ${pdfName ? sql`pdf_name = ${pdfName},` : sql``}
        updated_at = ${now}
      WHERE id = ${id}
    `;

    // Delete old PDF from Blob if it existed and was replaced or removed
    if (oldPdfUrl && oldPdfUrl !== pdfUrl) {
      await deleteBlobPdf(oldPdfUrl);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Estimate update error:", err);
    return NextResponse.json(
      { error: "Failed to update estimate", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    await ensureDatabaseSchema();
    const sql = await getSql();
    const body = await req.json();

    const estimate = await findEstimateById(id);
    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

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

    const timestamp = new Date().toISOString();

    if (estimate.quoteConvertedAt && estimate.convertedProjectId) {
      if (estimate.clientId) {
        await updateClient(estimate.clientId, {
          name: recipientName,
          email: recipientEmail,
          phone: recipientPhone,
          address: recipientAddress,
        });
      }

      const linkedProject = await findProjectById(estimate.convertedProjectId);
      if (linkedProject) {
        await updateProject(linkedProject.id, {
          service,
          address: recipientAddress,
          startDate: linkedProject.startDate,
          estimatedCompletionDate: linkedProject.estimatedCompletionDate,
          completionDate: linkedProject.completionDate,
          totalCost: quoteData.total,
          servicesIncluded,
          quoteData,
          payments: linkedProject.payments,
          ownerNotes: linkedProject.ownerNotes,
          estimatePdfUrl: linkedProject.estimatePdfUrl,
          estimatePdfName: linkedProject.estimatePdfName,
        });
      }
    }

    await sql`
      UPDATE estimates
      SET
        title = ${`${service} Estimate`},
        service = ${service},
        price = ${Number.parseFloat(String(quoteData.total || 0)) || 0},
        notes = ${notes},
        recipient_name = ${recipientName},
        recipient_address = ${recipientAddress},
        recipient_email = ${recipientEmail},
        recipient_phone = ${recipientPhone},
        services_included = ${JSON.stringify(servicesIncluded)},
        quote_data = ${JSON.stringify(quoteData)},
        updated_at = ${timestamp}
      WHERE id = ${id}
    `;

    return NextResponse.json({ estimate: await findEstimateById(id) });
  } catch (err) {
    console.error("Estimate patch error:", err);
    return NextResponse.json(
      { error: "Failed to update estimate", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = requireAdmin(req);
    if (auth.error) return auth.error;

    await ensureDatabaseSchema();
    const sql = await getSql();
    const { id } = await params;
    // Fetch current PDF URL from DB
    const row = await sql`
      SELECT pdf_url
      FROM estimates
      WHERE id = ${id}
    `;

    const pdfUrl = row.length > 0 ? row[0].pdf_url : null;

    // Delete the blob first
    if (pdfUrl) {
      await deleteBlobPdf(pdfUrl);
    }

    // Then delete the DB row
    await sql`DELETE FROM estimates WHERE id = ${id}`;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Estimate delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete estimate", detail: err?.message || "unknown" },
      { status: 500 }
    );
  }
}


