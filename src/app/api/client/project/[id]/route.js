import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/auth/server";
import { getSql } from "../../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../../lib/db/schema";
import { normalizeEmail } from "../../../../lib/db/users";

const EDMONTON_TIME_ZONE = "America/Edmonton";

// function formatDateOnly(dateValue) {
//   if (!dateValue) return "-";
//   const date = new Date(`${dateValue}`);
//   if (Number.isNaN(date.getTime())) return "-";
//   return date.toLocaleDateString("en-CA", {
//     timeZone: EDMONTON_TIME_ZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });
// }

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";
  const s = String(dateValue).trim();
  // Take only the first 10 characters (e.g., "2025-03-20")
  return s.slice(0, 10);
}

export async function GET(req, { params }) {
  const user = getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const sql = await getSql();

    const clientRows = await sql`
      SELECT id FROM clients WHERE email = ${normalizeEmail(user.email)} LIMIT 1
    `;
    const client = clientRows[0];
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const resolvedParams = await params;

    const projectRows = await sql`
      SELECT 
        id, service as name, COALESCE(address, '') as description,
        COALESCE(start_date, NULL) as startdate,
        COALESCE(estimated_completion_date, NULL) as "projectedCompletion",
        COALESCE(completion_date, NULL) as "endDate", 
        COALESCE(total_cost, 0) as "totalAmount",
        COALESCE(payment_status, 'Unpaid') as status,
        services_included as servicesincluded,
        payments as payments,
        owner_notes as ownernotes,
        estimate_pdf_url as "estimatePdfUrl",
        COALESCE(updated_at, created_at) as "notesUpdatedAt"
      FROM projects 
      WHERE id = ${resolvedParams.id} AND client_id = ${client.id}
      LIMIT 1
    `;

    const projectRow = projectRows[0];
    if (!projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = {
      ...projectRow,
      startDate: formatDateOnly(projectRow.startdate),
      estimatedCompletionDate: formatDateOnly(projectRow.projectedCompletion),
      services: JSON.parse(projectRow.servicesincluded || '[]'),
      payments: JSON.parse(projectRow.payments || '[]'),
      totalPaid: JSON.parse(projectRow.payments || '[]').reduce(
        (sum, p) => sum + (String(p?.status || "Paid").trim() === "Paid" ? Number(p.amount || 0) : 0),
        0
      ),
      ownerNotes: projectRow.ownernotes,
      notesUpdatedAt: formatDateOnly(projectRow.notesUpdatedAt),
      estimatePdfUrl: projectRow.estimatePdfUrl
    };

    return NextResponse.json({ project });
  } catch (error) {
    console.error("CLIENT PROJECT DETAIL ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";



