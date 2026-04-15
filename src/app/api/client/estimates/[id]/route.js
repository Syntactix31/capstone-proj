import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "../../../../lib/db/schema.js";
import { getSql } from "../../../../lib/db/client";
import { getRequestUser } from "../../../../lib/auth/server";
import { findEstimateById } from "../../../../lib/db/estimates.js";

export async function GET(req, { params }) {
  try {
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await ensureDatabaseSchema();
    const sql = await getSql();
    const rows = await sql`
      SELECT e.id, c.email AS client_email
      FROM estimates e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = ${id}
      LIMIT 1
    `;

    const ownedEstimate = rows[0];
    if (!ownedEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (ownedEstimate.client_email !== user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const estimate = await findEstimateById(id);
    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("CLIENT ESTIMATE GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load estimate" }, { status: 500 });
  }
}
