import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../lib/db/schema.js";
import { getRequestUser } from "../../../lib/auth/server";

export async function GET(req) {
  try {
    // Get CURRENT signed-in user
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Current user email:", user.email);

    await ensureDatabaseSchema();
    const sql = await getSql();

    // Find client's estimates using CURRENT user's email
    const estimates = await sql`
      SELECT 
        e.id, e.title, e.service, e.price, e.status, e.notes,
        e.pdf_url as "pdfUrl", e.pdf_name as "pdfName", e.created_at as "createdAt",
        e.quote_requested_at as "quoteRequestedAt",
        e.quote_converted_at as "quoteConvertedAt",
        e.converted_project_id as "convertedProjectId",
        c.id as clientId, c.name as clientName
      FROM estimates e
      JOIN clients c ON e.client_id = c.id
      WHERE c.email = ${user.email}
      ORDER BY e.created_at DESC
    `;

    console.log(`Found ${estimates.length} estimates for ${user.email}`);

    return NextResponse.json({
      estimates: estimates.map(e => ({
        id: e.id,
        title: e.title,
        service: e.service,
        price: Number(e.price).toFixed(2),
        status: e.status,
        notes: e.notes,
        pdfUrl: e.pdfUrl,
        pdfName: e.pdfName,
        quoteRequestedAt: e.quoteRequestedAt,
        quoteConvertedAt: e.quoteConvertedAt,
        convertedProjectId: e.convertedProjectId,
        createdAt: e.createdAt,
        clientName: e.clientName,
      }))
    });
  } catch (error) {
    console.error("Estimates error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
