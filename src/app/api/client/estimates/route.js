import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db/client";
import { ensureDatabaseSchema } from "../../../lib/db/schema.js";
import { getRequestUser } from "../../../lib/auth/server";
import { normalizeEmail } from "../../../lib/db/users";
import { listProjects } from "../../../lib/db/projects";

export async function GET(req) {
  try {
    const user = getRequestUser(req);
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureDatabaseSchema();
    const sql = getSql();
    const normalizedEmail = normalizeEmail(user.email);

    const clientRows = await sql`
      SELECT id, name
      FROM clients
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;
    const client = clientRows[0];

    if (!client) {
      return NextResponse.json({ estimates: [] });
    }

    const estimates = await sql`
      SELECT 
        e.id, e.title, e.service, e.price, e.status, e.notes,
        e.pdf_url as "pdfUrl", e.pdf_name as "pdfName", e.created_at as "createdAt",
        e.quote_requested_at as "quoteRequestedAt",
        e.quote_converted_at as "quoteConvertedAt",
        e.converted_project_id as "convertedProjectId",
        c.id as clientId, c.name as clientName,
        pr.quote_signed_at as "quoteSignedAt",
        pr.quote_signer_name as "quoteSignerName",
        pr.estimate_pdf_url as "convertedQuotePdfUrl",
        pr.estimate_pdf_name as "convertedQuotePdfName"
      FROM estimates e
      JOIN clients c ON e.client_id = c.id
      LEFT JOIN projects pr ON pr.id = e.converted_project_id
      WHERE c.email = ${normalizedEmail}
      ORDER BY e.created_at DESC
    `;

    const projects = await listProjects({ clientId: client.id });
    const convertedProjectIds = new Set(
      estimates.map((estimate) => estimate.convertedProjectId).filter(Boolean)
    );
    const projectQuotes = projects
      .filter((project) => project?.quoteData && !convertedProjectIds.has(project.id))
      .map((project) => ({
        id: `project-quote-${project.id}`,
        title: `${project.service} Quotation`,
        service: project.service,
        price: Number(project.quoteData?.total || project.totalCost || 0).toFixed(2),
        status: project.quoteSignedAt ? "Signed" : "Signature Required",
        notes: project.ownerNotes || "",
        pdfUrl: project.estimatePdfUrl || "",
        pdfName: project.estimatePdfName || "",
        quoteRequestedAt: null,
        quoteConvertedAt: null,
        convertedProjectId: null,
        createdAt: project.createdAt,
        clientName: project.client,
        sourceType: "project_quote",
        projectId: project.id,
        quoteSignedAt: project.quoteSignedAt || null,
        quoteSignerName: project.quoteSignerName || "",
      }));

    const combinedEstimates = [...projectQuotes, ...estimates]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({
      estimates: combinedEstimates.map((e) => ({
        id: e.id,
        title: e.title,
        service: e.service,
        price: Number(e.price).toFixed(2),
        status: e.status,
        notes: e.notes,
        pdfUrl: e.convertedQuotePdfUrl || e.pdfUrl,
        pdfName: e.convertedQuotePdfName || e.pdfName,
        quoteRequestedAt: e.quoteRequestedAt,
        quoteConvertedAt: e.quoteConvertedAt,
        convertedProjectId: e.convertedProjectId,
        createdAt: e.createdAt,
        clientName: e.clientName,
        sourceType: e.sourceType || "estimate",
        projectId: e.projectId || e.convertedProjectId || null,
        quoteSignedAt: e.quoteSignedAt || null,
        quoteSignerName: e.quoteSignerName || "",
      })),
    });
  } catch (error) {
    console.error("Estimates error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
