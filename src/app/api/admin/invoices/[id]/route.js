import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/server";
import { findProjectInvoiceById } from "../../../../lib/db/projects";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function renderInvoiceHtml(invoice) {
  const rows = (Array.isArray(invoice.servicesIncluded) ? invoice.servicesIncluded : [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name || invoice.project)}</td>
          <td>${escapeHtml(item.description || "-")}</td>
          <td>${escapeHtml(item.quantity || "1")}</td>
          <td>${formatMoney(item.total || item.price || 0)}</td>
        </tr>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(invoice.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #0f172a; }
      h1, h2, p { margin: 0; }
      .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
      .section { margin-bottom: 24px; }
      .muted { color: #64748b; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; vertical-align: top; }
      th { font-size: 12px; text-transform: uppercase; color: #64748b; }
      .total { margin-top: 24px; font-size: 20px; font-weight: 700; text-align: right; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <p class="muted">Invoice</p>
        <h1>${escapeHtml(invoice.id)}</h1>
      </div>
      <div>
        <p><strong>Client:</strong> ${escapeHtml(invoice.client)}</p>
        <p><strong>Project:</strong> ${escapeHtml(invoice.project)}</p>
        <p><strong>Status:</strong> ${escapeHtml(invoice.status)}</p>
        <p><strong>Issued:</strong> ${escapeHtml(invoice.issuedOn)}</p>
      </div>
    </div>
    <div class="section">
      <p><strong>Address:</strong> ${escapeHtml(invoice.address || "-")}</p>
      <p><strong>Payment Status:</strong> ${escapeHtml(invoice.paymentStatus)}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Project</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td>${escapeHtml(invoice.project)}</td><td>-</td><td>1</td><td>${formatMoney(invoice.amount)}</td></tr>`}
      </tbody>
    </table>
    <div class="total">Total: ${formatMoney(invoice.amount)}</div>
  </body>
</html>`;
}

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params;
    const invoice = await findProjectInvoiceById(resolvedParams.id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (new URL(req.url).searchParams.get("download") === "1") {
      return new Response(renderInvoiceHtml(invoice), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${invoice.id}.html\"`,
        },
      });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("ADMIN INVOICE GET ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
