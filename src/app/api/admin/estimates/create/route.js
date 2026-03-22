import { NextResponse } from "next/server";
import { getSql } from "../../../../lib/db/client";
import { put } from "@vercel/blob";

export async function POST(req) {
  const sql = await getSql();

  try {
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

    let pdfUrl = null;
    let pdfName = null;

    const pdfFile = formData.get("pdf");
    if (pdfFile && typeof pdfFile === "object" && typeof pdfFile.arrayBuffer === "function") {
      pdfName = pdfFile.name || "estimate.pdf";

      if (!process.env.PDF_READ_WRITE_TOKEN) {
        console.warn("PDF_READ_WRITE_TOKEN not set; skipping PDF storage for estimate", {
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
          console.error("PDF upload failed; continuing without pdf_url:", uploadErr);
        }
      }
    }

    const now = new Date().toISOString();
    const estimateRes = await sql`
      INSERT INTO estimates (
        id,
        client_id,
        title,
        service,
        price,
        status,
        notes,
        pdf_url,
        pdf_name,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${clientId},
        ${title},
        ${service},
        ${numericPrice},
        ${status},
        ${notes},
        ${pdfUrl || null},
        ${pdfName || null},
        ${now},
        ${now}
      )
      RETURNING id, client_id, title, service, price, status, notes, pdf_url, pdf_name, created_at
    `;

    const estimate = estimateRes[0];

    return NextResponse.json(
      {
        success: true,
        estimate: {
          id: estimate.id,
          clientId: estimate.client_id,
          title: estimate.title,
          service: estimate.service,
          price: estimate.price,
          status: estimate.status,
          notes: estimate.notes,
          pdfName: estimate.pdf_name,
          pdfUrl: estimate.pdf_url,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Estimate create error:", err);
    return NextResponse.json(
      {
        error: "Failed to create estimate",
        detail: err?.message || "unknown",
      },
      { status: 500 }
    );
  }
}

