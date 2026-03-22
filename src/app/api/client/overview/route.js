import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";
import { getSql } from "../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../lib/db/schema";
import { normalizeEmail } from "../../../lib/db/users";

export async function GET(req) {
  const user = getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const sql = getSql();

    // Fetch client by email
    const clientRows = await sql`
      SELECT c.id, c.name, c.email
      FROM clients c
      WHERE c.email = ${normalizeEmail(user.email)}
      LIMIT 1
    `;
    const client = clientRows[0];
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch bookings for the client
    const bookings = await sql`
      SELECT
        b.id,
        b.service,
        b.booking_date,
        b.status,
        b.created_at
      FROM bookings b
      WHERE b.client_id = ${client.id}
      ORDER BY b.created_at DESC
    `;

    // Map bookings to projects format
    const projects = bookings.map(b => ({
      id: b.id,
      name: b.service,
      startDate: new Date(b.booking_date).toLocaleDateString(),
      status: b.status === 'confirmed' ? 'Active' : b.status === 'cancelled' ? 'Cancelled' : 'Pending'
    }));

    // Estimates and payments not implemented yet
    const estimates = [];
    const payments = [];

    return NextResponse.json({
      projects,
      estimates,
      payments
    });
  } catch (error) {
    console.error("Error fetching client overview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";