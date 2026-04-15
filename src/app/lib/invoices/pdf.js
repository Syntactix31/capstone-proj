import { buildQuoteData, formatCurrency, formatLongDate, formatPercent } from "../quotes.js";

const COMPANY = {
  name: "Landscape Craftsmen",
  phone: "(587) 438-6672",
  email: "landscapecraftsmen@yahoo.com",
  location: "Calgary, Alberta",
};

function sanitizeFilenamePart(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function getInvoiceLines(invoice) {
  const lines = Array.isArray(invoice?.servicesIncluded) ? invoice.servicesIncluded : [];
  if (lines.length) return lines;

  return [
    {
      name: invoice?.project || "Service",
      description: "",
      quantity: "1",
      price: invoice?.amount || "0.00",
      total: invoice?.amount || "0.00",
    },
  ];
}

function getInvoiceTotals(invoice) {
  const lines = getInvoiceLines(invoice);
  const firstLine = lines[0] || null;
  const quote = buildQuoteData(invoice?.quoteData || {}, {
    unitPrice: firstLine?.price || invoice?.amount || "0.00",
    quantity: firstLine?.quantity || "1",
    description: firstLine?.description || "",
  });

  return {
    subtotal: quote.subtotal,
    gstRate: quote.gstRate,
    gstAmount: quote.gstAmount,
    total: invoice?.amount || quote.total,
    accountBalance:
      invoice?.accountBalance ??
      (invoice?.status === "Paid" ? "0.00" : invoice?.amount || quote.total),
  };
}

export function getInvoicePdfFilename(invoice) {
  const base =
    sanitizeFilenamePart(invoice?.id) ||
    sanitizeFilenamePart(invoice?.project) ||
    sanitizeFilenamePart(invoice?.client) ||
    "invoice";
  return `${base}.pdf`;
}

export async function downloadInvoicePdf(invoice) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 34;
  const contentWidth = pageWidth - marginX * 2;
  const brandGreen = [71, 122, 64];
  const borderGray = [210, 214, 220];
  const textGray = [85, 85, 85];
  const darkText = [17, 24, 39];
  const lines = getInvoiceLines(invoice);
  const totals = getInvoiceTotals(invoice);
  const filename = getInvoicePdfFilename(invoice);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...darkText);
  doc.text(COMPANY.name, marginX, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(COMPANY.location, marginX, 76);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, marginX, 96);

  const recipientX = marginX;
  let recipientY = 154;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("RECIPIENT:", recipientX, recipientY);
  recipientY += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(String(invoice?.client || "Client"), recipientX, recipientY);
  recipientY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  [invoice?.address].filter(Boolean).forEach((line) => {
    doc.text(String(line), recipientX, recipientY);
    recipientY += 16;
  });

  const summaryX = 338;
  const summaryW = 210;
  const summaryHeaderH = 30;
  const summaryRowH = 23;
  const summaryRows = [
    ["Issued", formatLongDate(invoice?.issuedOn)],
    ["Due", formatLongDate(invoice?.dueOn || invoice?.issuedOn)],
    ["Status", invoice?.status || "Open"],
  ];

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(1);
  doc.rect(summaryX, 94, summaryW, summaryHeaderH + summaryRowH * summaryRows.length + summaryRowH + 18);
  doc.setFillColor(...brandGreen);
  doc.rect(summaryX, 94, summaryW, summaryHeaderH, "F");
  doc.rect(summaryX, 94 + summaryHeaderH + summaryRowH * summaryRows.length, summaryW, summaryRowH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice #${String(invoice?.id || "").replace(/^INV-/, "") || invoice?.id || ""}`, summaryX + 12, 114);

  doc.setTextColor(...darkText);
  summaryRows.forEach(([label, value], index) => {
    const baseY = 94 + summaryHeaderH + summaryRowH * index + 16;
    doc.setFont("helvetica", "normal");
    doc.text(label, summaryX + 12, baseY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), summaryX + summaryW - 12, baseY, { align: "right" });
  });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const totalRowY = 94 + summaryHeaderH + summaryRowH * summaryRows.length + 16;
  doc.text("Total", summaryX + 12, totalRowY);
  doc.text(formatCurrency(totals.total), summaryX + summaryW - 12, totalRowY, { align: "right" });
  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Account Balance", summaryX + 12, totalRowY + 18);
  doc.text(formatCurrency(totals.accountBalance), summaryX + summaryW - 12, totalRowY + 18, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text("For Services Rendered", marginX, 256);

  const tableY = 274;
  const colWidths = [132, 236, 44, 70, 70];
  const colXs = colWidths.reduce(
    (acc, width, index) => {
      if (index === 0) return [marginX];
      acc.push(acc[index - 1] + colWidths[index - 1]);
      return acc;
    },
    []
  );

  doc.setFillColor(...brandGreen);
  doc.rect(marginX, tableY, contentWidth, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  ["Product / Service", "Description", "Qty.", "Unit Price", "Total"].forEach((label, index) => {
    doc.text(label, colXs[index] + 6, tableY + 21);
  });

  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  let rowTop = tableY + 42;
  lines.slice(0, 4).forEach((line) => {
    const descriptionLines = doc.splitTextToSize(String(line?.description || "-"), colWidths[1] - 10);
    const rowHeight = Math.max(22, descriptionLines.length * 11 + 6);

    doc.text(String(line?.name || invoice?.project || "Service"), colXs[0] + 4, rowTop);
    doc.text(descriptionLines, colXs[1] + 4, rowTop);
    doc.text(String(line?.quantity || "1"), colXs[2] + 16, rowTop);
    doc.text(formatCurrency(line?.price || 0), colXs[3] + colWidths[3] - 8, rowTop, { align: "right" });
    doc.text(formatCurrency(line?.total || line?.price || 0), colXs[4] + colWidths[4] - 8, rowTop, {
      align: "right",
    });

    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.8);
    doc.line(marginX, rowTop + rowHeight - 8, pageWidth - marginX, rowTop + rowHeight - 8);
    rowTop += rowHeight;
  });

  const noteY = 668;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textGray);
  const thankYouLines = doc.splitTextToSize(
    "Landscape Craftsmen provides professional outdoor construction and landscape services. Thank you for your business. Please contact us with any questions regarding this invoice.",
    250
  );
  doc.text(thankYouLines, marginX, noteY);

  const totalsX = 376;
  const totalsY = 660;
  const totalsRows = [
    ["Subtotal", formatCurrency(totals.subtotal)],
    [`GST (${formatPercent(totals.gstRate)})`, formatCurrency(totals.gstAmount)],
    ["Total", formatCurrency(totals.total)],
    ["Account balance", formatCurrency(totals.accountBalance)],
  ];
  totalsRows.forEach(([label, value], index) => {
    const rowBaseY = totalsY + index * 22;
    if (index < totalsRows.length - 1) {
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.8);
      doc.line(totalsX, rowBaseY + 8, pageWidth - marginX, rowBaseY + 8);
    }
    doc.setFont("helvetica", index === 2 ? "bold" : "normal");
    doc.setFontSize(index === 2 ? 11 : 10);
    doc.setTextColor(...darkText);
    doc.text(label, totalsX, rowBaseY);
    doc.text(value, pageWidth - marginX, rowBaseY, { align: "right" });
  });

  doc.save(filename);
}
