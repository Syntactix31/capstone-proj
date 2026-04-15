import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/db/client";
import { getRequestUser } from "../../../../../lib/auth/server";
import { put, del } from "@vercel/blob";

// Reusing the delete helper from your admin file
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const signerName = signerNameRaw.toString().trim();
    const signatureDate = signatureDateRaw.toString().trim();

    if (!signerName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const sql = await getSql();

    const estimateRes = await sql`
      SELECT e.id, e.status, e.pdf_url, c.email as client_email
      FROM estimates e
      JOIN clients c ON e.client_id = c.id
      WHERE e.id = ${id}
    `;

    if (!estimateRes.length) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    const estimate = estimateRes[0];

    if (estimate.client_email !== user.email) {
      return NextResponse.json(
        { error: "Access denied - this estimate belongs to another client" },
        { status: 403 }
      );
    }

    if (estimate.status !== "Pending") {
      return NextResponse.json(
        { error: "Estimate already signed or processed" },
        { status: 400 }
      );
    }

    let signedPdfUrl = null;
    let signedPdfName = null;

    if (
      signedPdfFile &&
      typeof signedPdfFile === "object" &&
      typeof signedPdfFile.arrayBuffer === "function"
    ) {
      signedPdfName = signedPdfFile.name || "signed-estimate.pdf";
      const fileBuffer = Buffer.from(await signedPdfFile.arrayBuffer());

      if (!process.env.PDF_READ_WRITE_TOKEN) {
        console.warn(
          "PDF_READ_WRITE_TOKEN not set; skipping PDF upload on sign, using existing PDF"
        );
      } else {
        try {
          const blob = await put(
            `estimates/signed-${Date.now()}-${signedPdfName}`,
            fileBuffer,
            {
              access: "public",
              contentType: signedPdfFile.type || "application/pdf",
              token: process.env.PDF_READ_WRITE_TOKEN,
            }
          );
          signedPdfUrl = blob.url;
        } catch (uploadErr) {
          console.error("Signed PDF upload failed:", uploadErr);
          return NextResponse.json(
            { error: "Failed to upload signed PDF" },
            { status: 500 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: "Signed PDF is required" },
        { status: 400 }
      );
    }

    const oldPdfUrl = estimate.pdf_url;

    if (oldPdfUrl && oldPdfUrl !== signedPdfUrl) {
      await deleteBlobPdf(oldPdfUrl);
    }

    const now = new Date().toISOString();
    const signatureText = `
\n\n--- ELECTRONIC SIGNATURE (PIPEDA/UECA) ---
Signed: ${signerName}
Date: ${signatureDate}
Server: ${now}
`;

    await sql`
      UPDATE estimates
      SET
        status = 'Signed',
        notes = notes || ${signatureText},
        pdf_url = ${signedPdfUrl},
        pdf_name = ${signedPdfName},
        updated_at = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, pdfUrl: signedPdfUrl });
  } catch (error) {
    console.error("Signing error:", error);
    return NextResponse.json(
      { error: "Failed to sign estimate" },
      { status: 500 }
    );
  }
}


