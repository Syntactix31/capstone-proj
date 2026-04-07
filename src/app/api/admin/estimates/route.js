import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db/client";
import { requireAdmin } from "../../../lib/auth/server";

export async function GET(req) {
  try {
    const auth = requireAdmin(req);
    if (auth.error) return auth.error;

    const sql = await getSql();
    const estimates = await sql`
      SELECT
        e.id,
        e.client_id,
        e.title,
        e.service,
        e.price,
        e.status,
        e.notes,
        e.pdf_url,
        e.pdf_name,
        e.created_at,
        c.name AS client_name -- assuming clients.name is available
      FROM estimates e
      JOIN clients c ON e.client_id = c.id
      ORDER BY e.created_at DESC
    `;

    return NextResponse.json(
      { estimates: estimates.map(est => ({
        id: est.id,
        clientId: est.client_id,
        client: est.client_name,
        clientName: est.client_name,
        title: est.title,
        service: est.service,
        price: est.price,
        status: est.status,
        notes: est.notes || "",
        pdfName: est.pdf_name,
        pdfUrl: est.pdf_url,
        createdAt: est.created_at,
      })) },
      { status: 200 }
    );
  } catch (err) {
    console.error("Estimates fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load estimates" },
      { status: 500 }
    );
  }
}



