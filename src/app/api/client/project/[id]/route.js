import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/auth/server";
import { getSql } from "../../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../../lib/db/schema";
import { normalizeEmail } from "../../../../lib/db/users";
import { listProjects } from "../../../../lib/db/projects";

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

    const projectRecord = (await listProjects({ clientId: client.id })).find(
      (project) => project.id === resolvedParams.id
    );
    if (!projectRecord) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = {
      id: projectRecord.id,
      name: projectRecord.service,
      description: projectRecord.address || "",
      startDate: formatDateOnly(projectRecord.startDate),
      projectedCompletion: formatDateOnly(projectRecord.estimatedCompletionDate),
      estimatedCompletionDate: formatDateOnly(projectRecord.estimatedCompletionDate),
      endDate: formatDateOnly(projectRecord.completionDate),
      totalAmount: Number(projectRecord.totalCost || 0),
      status: projectRecord.paymentStatus,
      services: Array.isArray(projectRecord.servicesIncluded) ? projectRecord.servicesIncluded : [],
      payments: Array.isArray(projectRecord.payments) ? projectRecord.payments : [],
      totalPaid: (Array.isArray(projectRecord.payments) ? projectRecord.payments : []).reduce(
        (sum, payment) =>
          sum + (String(payment?.status || "Paid").trim() === "Paid" ? Number(payment.amount || 0) : 0),
        0
      ),
      ownerNotes: projectRecord.ownerNotes || "",
      notesUpdatedAt: formatDateOnly(projectRecord.updatedAt),
      estimatePdfUrl: projectRecord.estimatePdfUrl,
    };

    return NextResponse.json({ project });
  } catch (error) {
    console.error("CLIENT PROJECT DETAIL ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";



