import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../../../lib/db/schema.js";
import { getRequestUser } from "../../../../../lib/auth/server";
import { requestEstimateQuote } from "../../../../../lib/db/estimates.js";

export async function POST(req, { params }) {
  try {
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await ensureDatabaseSchema();
    const sql = await getSql();
    const rows = await sql`
      SELECT e.id, e.quote_requested_at, e.quote_converted_at, c.email AS client_email
      FROM estimates e
      JOIN clients c ON c.id = e.client_id
      WHERE e.id = ${id}
      LIMIT 1
    `;

    const estimate = rows[0];
    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.client_email !== user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (estimate.quote_converted_at) {
      return NextResponse.json({ error: "This estimate has already been converted to a quote." }, { status: 409 });
    }

    if (estimate.quote_requested_at) {
      return NextResponse.json({ error: "Quote already requested for this estimate." }, { status: 409 });
    }

    const updatedEstimate = await requestEstimateQuote(id);
    return NextResponse.json({ estimate: updatedEstimate });
  } catch (error) {
    console.error("CLIENT REQUEST QUOTE ERROR:", error);
    return NextResponse.json({ error: "Failed to request quote" }, { status: 500 });
  }
}
