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

function getEstimateData(estimate) {
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

export async function downloadEstimatePdf(estimate) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const { quote, serviceLine } = getEstimateData(estimate);
  const filename = estimate?.pdfName || getEstimatePdfFilename(estimate);

  let y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(COMPANY.name, 40, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(COMPANY.location, 40, y);
  y += 14;
  doc.text(`${COMPANY.phone} | ${COMPANY.email}`, 40, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Estimate", 572, 48, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Estimate #${quote.quoteNumber || String(estimate?.id || "").slice(0, 8)}`, 572, 68, {
    align: "right",
  });
  doc.text(`Prepared on ${formatLongDate(quote.sentDate)}`, 572, 82, { align: "right" });

  y = 122;
  doc.setFont("helvetica", "bold");
  doc.text("Prepared For", 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  [
    estimate?.recipientName,
    estimate?.recipientAddress,
    estimate?.recipientPhone,
    estimate?.recipientEmail,
  ]
    .filter(Boolean)
    .forEach((line) => {
      doc.text(String(line), 40, y);
      y += 14;
    });

  autoTable(doc, {
    startY: Math.max(y + 14, 196),
    head: [["Product/Service", "Description", "Qty.", "Unit Price", "Total"]],
    body: [
      [
        serviceLine.name,
        quote.description || "No description added.",
        quote.quantity,
        formatCurrency(quote.unitPrice),
        formatCurrency(quote.subtotal),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [71, 122, 64] },
    styles: { fontSize: 10, cellPadding: 8, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 115 },
      1: { cellWidth: 220 },
      2: { cellWidth: 45, halign: "center" },
      3: { cellWidth: 82, halign: "right" },
      4: { cellWidth: 70, halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 300;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const noteText = doc.splitTextToSize(
    String(estimate?.notes || "This estimate is valid for the next 30 days and is for budgeting purposes only."),
    320
  );
  doc.text(noteText, 40, finalY + 28);

  autoTable(doc, {
    startY: finalY + 24,
    margin: { left: 360 },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    body: [
      ["Subtotal", formatCurrency(quote.subtotal)],
      [`GST (${formatPercent(quote.gstRate)})`, formatCurrency(quote.gstAmount)],
      ["Deposit", formatCurrency(quote.depositAmount)],
      ["Total", formatCurrency(quote.total)],
    ],
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 90, halign: "right" },
    },
    didParseCell: (hook) => {
      if (hook.row.index === 3) {
        hook.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`);
}
