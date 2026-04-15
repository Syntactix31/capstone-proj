import Link from "next/link";
import { notFound } from "next/navigation";
import { findEstimateById } from "../../../lib/db/estimates.js";
import {
  buildQuoteData,
  formatCurrency,
  formatLongDate,
  formatPercent,
} from "../../../lib/quotes.js";
import PrintEstimateButton from "./PrintEstimateButton.js";
import styles from "../../projects/[id]/quote/QuotePage.module.css";

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

function getRecipientLines(estimate) {
  return [
    estimate?.recipientName,
    estimate?.recipientAddress,
    estimate?.recipientPhone,
    estimate?.recipientEmail,
  ].filter(Boolean);
}

export default async function AdminEstimatePage({ params }) {
  const resolvedParams = await params;
  const estimate = await findEstimateById(resolvedParams.id);

  if (!estimate) notFound();

  if (estimate.pdfUrl) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Link className="admin-btn admin-btn--ghost" href="/dashboard/estimates">
              Back to estimates
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h1 className="text-2xl font-bold mb-4">Estimate PDF</h1>
            <iframe
              src={estimate.pdfUrl}
              className="w-full h-[600px] border rounded"
              title="Estimate PDF"
            />
            <div className="mt-4">
              <a
                href={estimate.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn--primary"
              >
                Open PDF in New Tab
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to in-page rendering if no PDF
  const serviceLine = getPrimaryServiceLine(estimate);
  const estimateData = buildQuoteData(estimate.quoteData, {
    unitPrice: serviceLine.price,
    quantity: serviceLine.quantity,
    description: serviceLine.description,
  });
  const recipientLines = getRecipientLines(estimate);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link className="admin-btn admin-btn--ghost" href="/dashboard/estimates">
          Back to estimates
        </Link>
        <PrintEstimateButton />
      </div>

      <article className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.companyName}>{COMPANY.name}</h1>
            <p className={styles.companyMeta}>
              {COMPANY.location}
            </p>
            <p className={styles.companyMeta}>
              {COMPANY.phone} | {COMPANY.email}
            </p>
          </div>

          <aside className={styles.summary}>
            <div className={styles.summaryTitle}>
              Estimate #{estimateData.quoteNumber || estimate.id.slice(0, 8)}
            </div>
            <div className={styles.summaryRow}>
              <span>Prepared on</span>
              <strong>{formatLongDate(estimateData.sentDate)}</strong>
            </div>
            <div className={styles.summaryTotal}>
              <span>Estimated Total</span>
              <strong>{formatCurrency(estimateData.total)}</strong>
            </div>
          </aside>
        </header>

        <section className={styles.recipient}>
          <div>
            <div className={styles.label}>Prepared For:</div>
            {recipientLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </section>

        <section>
          <div className={styles.tableHead}>
            <span>Product/Service</span>
            <span>Description</span>
            <span>Qty.</span>
            <span>Est. Unit Price</span>
            <span>Est. Total</span>
          </div>

          <div className={styles.tableRow}>
            <div>{serviceLine.name}</div>
            <div className={styles.description}>
              {estimateData.description || "No description added."}
            </div>
            <div>{estimateData.quantity}</div>
            <div>{formatCurrency(estimateData.unitPrice)}</div>
            <div>{formatCurrency(estimateData.subtotal)}</div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.note}>
          This estimate is provided as an approximate cost based on the current project scope.
          Final pricing may change depending on site conditions, material costs, and changes
          requested before work begins.
        </section>

        <footer className={styles.footer}>
          <div className={styles.note}>
            This estimate is valid for the next 30 days and is for budgeting purposes only.
            A formal quotation with approval/signature and any required deposit will be issued
            before work starts.
          </div>

          <div className={styles.totals}>
            <div className={styles.totalsRow}>
              <span>Estimated Subtotal</span>
              <strong>{formatCurrency(estimateData.subtotal)}</strong>
            </div>
            <div className={styles.totalsRow}>
              <span>GST ({formatPercent(estimateData.gstRate)})</span>
              <strong>{formatCurrency(estimateData.gstAmount)}</strong>
            </div>
            <div className={`${styles.totalsRow} ${styles.totalsRowTotal}`}>
              <span>Estimated Total</span>
              <strong>{formatCurrency(estimateData.total)}</strong>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
