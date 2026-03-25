import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/auth/server";
import { getSql } from "../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../lib/db/schema";
import { normalizeEmail } from "../../../lib/db/users";

const EDMONTON_TIME_ZONE = "America/Edmonton";

// function formatDateOnly(dateValue) {
//   if (!dateValue) return "-";

//   const date = new Date(`${dateValue}T12:00:00-07:00`);
//   if (Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleDateString("en-CA", {
//     timeZone: EDMONTON_TIME_ZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });
// }

// function formatDateOnly(dateValue) {
//   if (!dateValue) return "-";
//   return String(dateValue).split("T")[0];
// }

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";
  const s = String(dateValue).trim();
  // Take only the first 10 characters (e.g., "2025-03-20")
  return s.slice(0, 10);
}

export async function GET(req) {
  const user = getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const sql = await getSql();

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

    const recentEstimates = await sql`
      SELECT 
        e.id, e.title, e.service, e.price, e.status, e.notes,
        e.created_at as "createdAt", e.pdf_url as "pdfUrl"
      FROM estimates e
      WHERE e.client_id = ${client.id}
      ORDER BY e.created_at DESC
      LIMIT 3
    `;

    const estimates = recentEstimates.map(e => ({
      id: e.id,
      title: e.title || e.service,
      price: Number(e.price).toFixed(2),
      status: e.status,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "-", 
      pdfUrl: e.pdfUrl
    }));

    // Might not need this
    const bookings = await sql`
      SELECT
        b.id, b.service, b.booking_date, b.status, b.created_at
      FROM bookings b
      WHERE b.client_id = ${client.id}
      ORDER BY b.created_at DESC
      LIMIT 5
    `;


    const projectRows = await sql`
      SELECT 
        p.id, 
        p.service as name, 
        COALESCE(p.address, '') as description,
        COALESCE(p.start_date, NULL) as "startDate", 
        COALESCE(p.estimated_completion_date, NULL) as "endDate", 
        COALESCE(p.payment_status, 'Unpaid') as status,
        COALESCE(p.total_cost, 0) as "totalCost",
        p.created_at as "createdAt"
      FROM projects p
      WHERE p.client_id = ${client.id}  
      ORDER BY p.created_at DESC
    `;

    const projects = projectRows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '-',
      startDate: formatDateOnly(p.startDate),
      endDate: formatDateOnly(p.endDate),
      status: p.status === 'Unpaid' ? 'Pending' :
              p.status === 'Deposit Paid' ? 'Active' :
              p.status === 'Fully Paid' ? 'Complete' : p.status,
      totalAmount: Number(p.totalCost || 0).toLocaleString()
    }));


// const projectRows = await sql`
//   SELECT 
//     p.id, 
//     p.service as name, 
//     COALESCE(p.address, '') as description,
//     COALESCE(p.start_date, NULL) as "startDate", 
//     COALESCE(p.completion_date, NULL) as "endDate", 
//     COALESCE(p.payment_status, 'Unpaid') as status,
//     COALESCE(p.total_cost, 0) as "totalCost",
//     p.created_at as "createdAt"
//   FROM projects p
//   WHERE p.client_id = ${client.id}  
//   ORDER BY p.created_at DESC
// `;

//   const projects = projectRows.map(p => ({
//     id: p.id,
//     name: p.name,
//     description: p.description || '-',  
//     startDate: formatDateOnly(p.startDate),    
//     endDate: formatDateOnly(p.endDate),      
//     status: p.status === 'Unpaid' ? 'Pending' : 
//             p.status === 'Deposit Paid' ? 'Active' : 
//             p.status === 'Fully Paid' ? 'Complete' : p.status,
//     totalAmount: Number(p.totalCost || 0).toLocaleString()
//   }));

    const payments = [];

    console.log(`Overview for ${user.email}: ${estimates.length} estimates, ${projects.length} projects`);

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
