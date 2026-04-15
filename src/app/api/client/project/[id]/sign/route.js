import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../../../lib/db/schema.js";
import { getRequestUser } from "../../../../../lib/auth/server";
import { put, del } from "@vercel/blob";

async function deleteBlobPdf(pdfUrl) {
  if (!pdfUrl) return;
  if (!process.env.PDF_READ_WRITE_TOKEN) {
    console.warn("PDF_READ_WRITE_TOKEN not set; skipping delete of blob PDF:", pdfUrl);
    return;
  }

  try {
    await del(pdfUrl, { token: process.env.PDF_READ_WRITE_TOKEN });
  } catch (err) {
    console.error("Failed to delete blob PDF:", err);
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const signerNameRaw = formData.get("signerName");
    const signatureDateRaw = formData.get("signatureDate");
    const signedPdfFile = formData.get("signedPdf");

    if (!signerNameRaw || !signatureDateRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const signerName = signerNameRaw.toString().trim();
    const signatureDate = signatureDateRaw.toString().trim();

    if (!signerName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await ensureDatabaseSchema();
    const sql = getSql();

    const projectRows = await sql`
      SELECT pr.id, pr.estimate_pdf_url, pr.quote_signed_at, c.email AS client_email
      FROM projects pr
      JOIN clients c ON c.id = pr.client_id
      WHERE pr.id = ${id}
      LIMIT 1
    `;

    const project = projectRows[0];
    if (!project) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (project.client_email !== user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (project.quote_signed_at) {
      return NextResponse.json({ error: "Quotation already signed" }, { status: 400 });
    }

    if (
      !signedPdfFile ||
      typeof signedPdfFile !== "object" ||
      typeof signedPdfFile.arrayBuffer !== "function"
    ) {
      return NextResponse.json({ error: "Signed PDF is required" }, { status: 400 });
    }

    const signedPdfName = signedPdfFile.name || "signed-quotation.pdf";
    const fileBuffer = Buffer.from(await signedPdfFile.arrayBuffer());

    let signedPdfUrl = null;
    if (!process.env.PDF_READ_WRITE_TOKEN) {
      console.warn(
        "PDF_READ_WRITE_TOKEN not set; skipping PDF upload on sign, using existing PDF"
      );
    } else {
      try {
        const blob = await put(`projects/signed-${Date.now()}-${signedPdfName}`, fileBuffer, {
          access: "public",
          contentType: signedPdfFile.type || "application/pdf",
          token: process.env.PDF_READ_WRITE_TOKEN,
        });
        signedPdfUrl = blob.url;
      } catch (uploadErr) {
        console.error("Signed PDF upload failed:", uploadErr);
        return NextResponse.json({ error: "Failed to upload signed PDF" }, { status: 500 });
      }
    }

    const oldPdfUrl = project.estimate_pdf_url;
    if (oldPdfUrl && oldPdfUrl !== signedPdfUrl) {
      await deleteBlobPdf(oldPdfUrl);
    }

    const now = new Date().toISOString();
    const signatureText = `\n\n--- QUOTATION SIGNATURE (PIPEDA/UECA) ---\nSigned: ${signerName}\nDate: ${signatureDate}\nServer: ${now}\n`;

    await sql`
      UPDATE projects
      SET
        owner_notes = owner_notes || ${signatureText},
        estimate_pdf_url = ${signedPdfUrl},
        estimate_pdf_name = ${signedPdfName},
        quote_signed_at = ${now},
        quote_signer_name = ${signerName},
        updated_at = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      project: {
        id,
        status: "Signed",
        estimatePdfUrl: signedPdfUrl,
        estimatePdfName: signedPdfName,
        quoteSignedAt: now,
        quoteSignerName: signerName,
      },
    });
  } catch (error) {
    console.error("Project quotation signing error:", error);
    return NextResponse.json({ error: "Failed to sign quotation" }, { status: 500 });
  }
}

export const runtime = "nodejs";
