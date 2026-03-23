import { NextResponse } from "next/server";

import { getSql } from "../../../../../lib/db/client";
import { getRequestUser } from "../../../../../lib/auth/server";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("User email:", user.email, "Estimate ID:", id);

    const { signerName, signatureDate } = await req.json();
    const sql = await getSql();

    const estimate = await sql`
      SELECT e.id, e.status, c.email as client_email
      FROM estimates e
      JOIN clients c ON e.client_id = c.id
      WHERE e.id = ${id}
    `;

    console.log("Estimate found:", estimate);

    if (!estimate.length) {
      return NextResponse.json({ 
        error: "Estimate not found" 
      }, { status: 404 });
    }

    const estimateRecord = estimate[0];
    
    if (estimateRecord.client_email !== user.email) {
      console.log(`Access denied: user ${user.email} vs client ${estimateRecord.client_email}`);
      return NextResponse.json({ 
        error: "Access denied - this estimate belongs to another client" 
      }, { status: 403 });
    }

    if (estimateRecord.status !== 'Pending') {
      return NextNextResponse.json({ 
        error: "Estimate already signed or processed" 
      }, { status: 400 });
    }

    // Sign it!
    const now = new Date().toISOString();
    const signatureText = `\n\n--- ELECTRONIC SIGNATURE (PIPEDA/UECA) ---\nSigned: ${signerName}\nDate: ${signatureDate}\nServer: ${now}`;
    
    await sql`
      UPDATE estimates 
      SET 
        status = 'Approved',
        notes = notes || ${signatureText},
        updated_at = ${now}
      WHERE id = ${id}
    `;

    console.log("Estimate signed successfully:", id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Signing error:", error);
    return NextResponse.json({ error: "Failed to sign estimate" }, { status: 500 });
  }
}