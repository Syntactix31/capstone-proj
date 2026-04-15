import { buildQuoteData, formatCurrency, formatLongDate, formatPercent } from "../quotes.js";

const COMPANY = {
  name: "Landscape Craftsmen",
  phone: "(587) 438-6672",
  email: "landscapecraftsmen@yahoo.com",
  location: "Calgary, Alberta",
};

function getPrimaryServiceLine(estimate) {
  return Array.isArray(estimate?.servicesIncluded) && estimate.servicesIncluded.length
    ? estimate.servicesIncluded[0]
    : {
        name: estimate?.service || "Service",
        description: "",
        price: "0.00",
        quantity: "1",
        total: String(estimate?.total || "0.00"),
      };
}

function getDocumentData(record) {
  const serviceLine = getPrimaryServiceLine(record);
  const quote = buildQuoteData(record?.quoteData || {}, {
    unitPrice: serviceLine.price,
    quantity: serviceLine.quantity,
    description: serviceLine.description,
  });

  return { quote, serviceLine };
}

function sanitizeFilenamePart(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function getEstimatePdfFilename(estimate) {
  const base =
    sanitizeFilenamePart(estimate?.title) ||
    sanitizeFilenamePart(estimate?.service) ||
    sanitizeFilenamePart(estimate?.id) ||
    "estimate";
  return `${base}.pdf`;
}

export function getQuotePdfFilename(project, fallbackTitle = "") {
  const base =
    sanitizeFilenamePart(fallbackTitle) ||
    sanitizeFilenamePart(project?.service) ||
    sanitizeFilenamePart(project?.quoteData?.quoteNumber) ||
    sanitizeFilenamePart(project?.id) ||
    "quote";
  return `${base}.pdf`;
}

export async function downloadPdfFromUrl(url, filename = "document.pdf") {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to download PDF.");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function createEstimatePdf(estimate) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const { quote, serviceLine } = getDocumentData(estimate);
  const filename = estimate?.pdfName || getEstimatePdfFilename(estimate);
  const recipientLines = [
    estimate?.recipientName,
    estimate?.recipientAddress,
    estimate?.recipientPhone,
    estimate?.recipientEmail,
  ].filter(Boolean);

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 34;
  const contentWidth = pageWidth - marginX * 2;
  const darkGray = [90, 90, 90];
  const borderGray = [198, 198, 198];
  const textGray = [80, 80, 80];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(23);
  doc.text(COMPANY.name, marginX, 54);

  doc.setFontSize(10.5);
  doc.text(COMPANY.location, marginX, 76);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, marginX, 96);

  const summaryX = 396;
  const summaryW = 174;
  const summaryHeaderH = 30;
  const summaryRowH = 32;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(1);
  doc.rect(summaryX, 30, summaryW, summaryHeaderH + summaryRowH * 2);
  doc.setFillColor(...darkGray);
  doc.rect(summaryX, 30, summaryW, summaryHeaderH, "F");
  doc.rect(summaryX, 30 + summaryHeaderH + summaryRowH, summaryW, summaryRowH, "F");
  doc.line(summaryX, 30 + summaryHeaderH, summaryX + summaryW, 30 + summaryHeaderH);
  doc.line(
    summaryX,
    30 + summaryHeaderH + summaryRowH,
    summaryX + summaryW,
    30 + summaryHeaderH + summaryRowH
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Estimate #${quote.quoteNumber || String(estimate?.id || "").slice(0, 8)}`, summaryX + 12, 50);
  doc.text("Estimated Total", summaryX + 12, 50 + summaryHeaderH + summaryRowH);
  doc.text(formatCurrency(quote.total), summaryX + summaryW - 12, 50 + summaryHeaderH + summaryRowH, {
    align: "right",
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Prepared on", summaryX + 12, 50 + summaryHeaderH);
  doc.setFont("helvetica", "bold");
  doc.text(formatLongDate(quote.sentDate), summaryX + summaryW - 12, 50 + summaryHeaderH, {
    align: "right",
  });

  let recipientY = 180;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("PREPARED FOR:", marginX, recipientY);
  recipientY += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  recipientLines.forEach((line) => {
    doc.text(String(line), marginX, recipientY);
    recipientY += 16;
  });

  const tableY = 282;
  const colWidths = [140, 262, 54, 100, 74];
  const colXs = colWidths.reduce(
    (acc, width, index) => {
      if (index === 0) return [marginX];
      acc.push(acc[index - 1] + colWidths[index - 1]);
      return acc;
    },
    []
  );

  doc.setFillColor(...darkGray);
  doc.rect(marginX, tableY, contentWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  ["Product/Service", "Description", "Qty.", "Est. Unit Price", "Est. Total"].forEach((label, index) => {
    doc.text(label, colXs[index] + 10, tableY + 21);
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const rowY = tableY + 48;
  const descriptionLines = doc.splitTextToSize(
    quote.description || "No description added.",
    colWidths[1] - 16
  );
  doc.text(String(serviceLine.name || "Service"), colXs[0] + 10, rowY);
  doc.text(descriptionLines, colXs[1] + 10, rowY);
  doc.text(String(quote.quantity), colXs[2] + 10, rowY);
  doc.text(formatCurrency(quote.unitPrice), colXs[3] + 10, rowY);
  doc.text(formatCurrency(quote.subtotal), colXs[4] + colWidths[4] - 10, rowY, {
    align: "right",
  });

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.8);
  doc.line(marginX, 432, pageWidth - marginX, 432);
  doc.line(marginX, 456, pageWidth - marginX, 456);

  doc.setTextColor(...textGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const scopeLines = doc.splitTextToSize(
    "This estimate is provided as an approximate cost based on the current project scope. Final pricing may change depending on site conditions, material costs, and changes requested before work begins.",
    270
  );
  doc.text(scopeLines, marginX, 490);

  const validityLines = doc.splitTextToSize(
    "This estimate is valid for the next 30 days and is for budgeting purposes only. A formal quotation with approval/signature and any required deposit will be issued before work starts.",
    270
  );
  doc.text(validityLines, marginX, 592);

  const totalsX = 418;
  const totalsY = 530;
  const totalsW = 156;
  const rowH = 34;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(191, 191, 191);
  doc.setLineWidth(1);
  doc.rect(totalsX, totalsY, totalsW, rowH * 3);
  doc.line(totalsX, totalsY + rowH, totalsX + totalsW, totalsY + rowH);
  doc.line(totalsX, totalsY + rowH * 2, totalsX + totalsW, totalsY + rowH * 2);

  const totalsRows = [
    ["Estimated Subtotal", formatCurrency(quote.subtotal)],
    [`GST (${formatPercent(quote.gstRate)})`, formatCurrency(quote.gstAmount)],
    ["Estimated Total", formatCurrency(quote.total)],
  ];
  totalsRows.forEach(([label, value], index) => {
    const rowBaseY = totalsY + rowH * index + 22;
    doc.setFont("helvetica", index === 2 ? "bold" : "normal");
    doc.setFontSize(index === 2 ? 11.5 : 10);
    doc.text(label, totalsX + 12, rowBaseY);
    doc.text(value, totalsX + totalsW - 12, rowBaseY, { align: "right" });
  });

  doc.save(filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`);
}

async function createQuotePdf(project, recipient = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const { quote, serviceLine } = getDocumentData(project);
  const filename = getQuotePdfFilename(project, recipient?.title);
  const recipientLines = [
    recipient?.name,
    recipient?.address || project?.address,
    recipient?.phone,
    recipient?.email,
  ].filter(Boolean);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 34;
  const contentWidth = pageWidth - marginX * 2;
  const darkGray = [90, 90, 90];
  const borderGray = [198, 198, 198];
  const textGray = [80, 80, 80];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.text(COMPANY.name, marginX, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`${COMPANY.location} | ${COMPANY.location}`, marginX, 78);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, marginX, 96);

  const summaryX = 398;
  const summaryW = 176;
  const summaryHeaderH = 30;
  const summaryRowH = 32;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(1);
  doc.rect(summaryX, 34, summaryW, summaryHeaderH + summaryRowH * 2);
  doc.setFillColor(...darkGray);
  doc.rect(summaryX, 34, summaryW, summaryHeaderH, "F");
  doc.rect(summaryX, 34 + summaryHeaderH + summaryRowH, summaryW, summaryRowH, "F");
  doc.line(summaryX, 34 + summaryHeaderH, summaryX + summaryW, 34 + summaryHeaderH);
  doc.line(
    summaryX,
    34 + summaryHeaderH + summaryRowH,
    summaryX + summaryW,
    34 + summaryHeaderH + summaryRowH
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Quote #${quote.quoteNumber || String(project?.id || "").slice(0, 8)}`, summaryX + 12, 54);
  doc.text("Total", summaryX + 12, 54 + summaryHeaderH + summaryRowH);
  doc.text(formatCurrency(quote.total), summaryX + summaryW - 12, 54 + summaryHeaderH + summaryRowH, {
    align: "right",
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Sent on", summaryX + 12, 54 + summaryHeaderH);
  doc.setFont("helvetica", "bold");
  doc.text(formatLongDate(quote.sentDate), summaryX + summaryW - 12, 54 + summaryHeaderH, {
    align: "right",
  });

  let recipientY = 188;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RECIPIENT:", marginX, recipientY);
  recipientY += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  recipientLines.forEach((line) => {
    doc.text(String(line), marginX, recipientY);
    recipientY += 16;
  });

  const tableY = 302;
  const colWidths = [136, 244, 48, 74, 56];
  const colXs = colWidths.reduce(
    (acc, width, index) => {
      if (index === 0) return [marginX];
      acc.push(acc[index - 1] + colWidths[index - 1]);
      return acc;
    },
    []
  );

  doc.setFillColor(...darkGray);
  doc.rect(marginX, tableY, contentWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  ["Product/Service", "Description", "Qty.", "Unit Price", "Total"].forEach((label, index) => {
    doc.text(label, colXs[index] + 10, tableY + 21);
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rowY = tableY + 48;
  const descriptionLines = doc.splitTextToSize(
    quote.description || "No description added.",
    colWidths[1] - 14
  );
  doc.text(String(serviceLine.name || "Service"), colXs[0] + 10, rowY);
  doc.text(descriptionLines, colXs[1] + 10, rowY);
  doc.text(String(quote.quantity), colXs[2] + 10, rowY);
  doc.text(formatCurrency(quote.unitPrice), colXs[3] + 10, rowY);
  doc.text(formatCurrency(quote.subtotal), colXs[4] + colWidths[4] - 10, rowY, {
    align: "right",
  });

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.8);
  doc.line(marginX, 448, pageWidth - marginX, 448);
  doc.line(marginX, 470, pageWidth - marginX, 470);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    `A deposit of ${formatCurrency(quote.depositAmount)} will be required to begin.`,
    pageWidth / 2,
    500,
    { align: "center" }
  );

  doc.setDrawColor(191, 191, 191);
  doc.setLineWidth(1);
  doc.line(marginX, 700, marginX + 200, 700);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...textGray);
  doc.text(formatLongDate(quote.sentDate), marginX, 718);
  doc.text("Client Signature", marginX + 120, 718);
  const noteLines = doc.splitTextToSize(
    "This quote is valid for the next 30 days, after which values may be subject to change.",
    300
  );
  doc.text(noteLines, marginX, 750);

  const totalsX = 418;
  const totalsY = 676;
  const totalsW = 156;
  const rowH = 34;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(191, 191, 191);
  doc.setLineWidth(1);
  doc.rect(totalsX, totalsY, totalsW, rowH * 3);
  doc.line(totalsX, totalsY + rowH, totalsX + totalsW, totalsY + rowH);
  doc.line(totalsX, totalsY + rowH * 2, totalsX + totalsW, totalsY + rowH * 2);

  const totalsRows = [
    ["Subtotal", formatCurrency(quote.subtotal)],
    [`GST (${formatPercent(quote.gstRate)})`, formatCurrency(quote.gstAmount)],
    ["Total", formatCurrency(quote.total)],
  ];
  totalsRows.forEach(([label, value], index) => {
    const rowBaseY = totalsY + rowH * index + 22;
    doc.setFont("helvetica", index === 2 ? "bold" : "normal");
    doc.setFontSize(index === 2 ? 11.5 : 10);
    doc.text(label, totalsX + 12, rowBaseY);
    doc.text(value, totalsX + totalsW - 12, rowBaseY, { align: "right" });
  });

  doc.save(filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export async function downloadEstimatePdf(estimate) {
  return createEstimatePdf(estimate);
}

export async function downloadQuotePdf(project, recipient = {}) {
  return createQuotePdf(project, recipient);
}
