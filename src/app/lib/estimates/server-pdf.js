import PDFDocument from "pdfkit";
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

function getDocumentData(estimate) {
  const serviceLine = getPrimaryServiceLine(estimate);
  const quote = buildQuoteData(estimate?.quoteData || {}, {
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

// Server-side PDF generation using pdfkit
export async function generateEstimatePdfBuffer(estimate) {
  const doc = new PDFDocument({ size: 'letter', margin: 50 });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  const { quote, serviceLine } = getDocumentData(estimate);
  const recipientLines = [
    estimate?.recipientName,
    estimate?.recipientAddress,
    estimate?.recipientPhone,
    estimate?.recipientEmail,
  ].filter(Boolean);

  // Header
  doc.fontSize(24).text(COMPANY.name, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(COMPANY.location);
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`);
  doc.moveDown();

  // Summary box
  const summaryX = 300;
  const summaryWidth = 250;
  doc.rect(summaryX, 50, summaryWidth, 120).stroke();
  doc.fontSize(14).text(`Estimate #${quote.quoteNumber || String(estimate?.id || "").slice(0, 8)}`, summaryX + 10, 70);
  doc.text(`Prepared on: ${formatLongDate(quote.sentDate)}`, summaryX + 10, 100);
  doc.fontSize(16).text(`Estimated Total: ${formatCurrency(quote.total)}`, summaryX + 10, 130);

  // Recipient
  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica-Bold').text('PREPARED FOR:');
  doc.font('Helvetica').fontSize(12);
  recipientLines.forEach(line => {
    doc.text(line);
  });

  // Table
  doc.moveDown();
  const tableTop = doc.y;
  const colWidths = [150, 200, 50, 80, 80];
  const headers = ['Product/Service', 'Description', 'Qty.', 'Est. Unit Price', 'Est. Total'];

  // Header row
  doc.font('Helvetica-Bold').fontSize(12);
  headers.forEach((header, i) => {
    const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
  });

  // Data row
  doc.moveDown();
  const rowY = doc.y;
  doc.font('Helvetica').fontSize(12);
  const data = [
    serviceLine.name || 'Service',
    quote.description || 'No description added.',
    quote.quantity,
    formatCurrency(quote.unitPrice),
    formatCurrency(quote.subtotal)
  ];

  data.forEach((cell, i) => {
    const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(cell, x, rowY, { width: colWidths[i], align: 'left' });
  });

  // Totals
  doc.moveDown(2);
  const totalsX = 350;
  doc.rect(totalsX, doc.y, 200, 100).stroke();
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Estimated Subtotal', totalsX + 10, doc.y + 10);
  doc.text(formatCurrency(quote.subtotal), totalsX + 180, doc.y + 10, { align: 'right' });
  doc.text(`GST (${formatPercent(quote.gstRate)})`, totalsX + 10, doc.y + 30);
  doc.text(formatCurrency(quote.gstAmount), totalsX + 180, doc.y + 30, { align: 'right' });
  doc.fontSize(14).text('Estimated Total', totalsX + 10, doc.y + 50);
  doc.text(formatCurrency(quote.total), totalsX + 180, doc.y + 50, { align: 'right' });

  // Footer notes
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(10).text(
    'This estimate is provided as an approximate cost based on the current project scope. Final pricing may change depending on site conditions, material costs, and changes requested before work begins.',
    { width: 400 }
  );
  doc.moveDown();
  doc.text(
    'This estimate is valid for the next 30 days and is for budgeting purposes only. A formal quotation with approval/signature and any required deposit will be issued before work starts.',
    { width: 400 }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}