import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth/server";
import { listProjects } from "../../../lib/db/projects.js";
import { buildQuoteData } from "../../../lib/quotes.js";
import { normalizeServiceDisplay } from "../../../lib/services/catalog.js";

function getPrimaryServiceLine(project) {
  return Array.isArray(project?.servicesIncluded) && project.servicesIncluded.length
    ? project.servicesIncluded[0]
    : {
        name: normalizeServiceDisplay(project?.service || "Service"),
        description: "",
        price: String(project?.totalCost || "0.00"),
        quantity: "1",
      };
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const projects = await listProjects();

    const quotations = projects
      .filter((project) => project?.quoteData)
      .map((project) => {
        const serviceLine = getPrimaryServiceLine(project);
        const quote = buildQuoteData(project.quoteData, {
          unitPrice: serviceLine.price,
          quantity: serviceLine.quantity,
          description: serviceLine.description,
        });

        return {
          id: project.id,
          projectId: project.id,
          clientId: project.clientId,
          client: project.client,
          service: normalizeServiceDisplay(project.service),
          address: project.address || "",
          quoteNumber: quote.quoteNumber || project.id.slice(0, 8),
          sentDate: quote.sentDate || null,
          total: quote.total,
          subtotal: quote.subtotal,
          depositAmount: quote.depositAmount,
          paymentStatus: project.paymentStatus || "Unpaid",
          pdfUrl: project.estimatePdfUrl || "",
          pdfName: project.estimatePdfName || "",
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.sentDate || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.sentDate || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

    return NextResponse.json({ quotations }, { status: 200 });
  } catch (error) {
    console.error("ADMIN QUOTATIONS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load quotations" }, { status: 500 });
  }
}
