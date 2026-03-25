import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchClientById } from "../../../../lib/db/clients.js";
import { findProjectById } from "../../../../lib/db/projects.js";
import {
  buildQuoteData,
  formatCurrency,
  formatLongDate,
  formatPercent,
} from "../../../../lib/quotes.js";
import PrintQuoteButton from "./PrintQuoteButton.js";
import styles from "./QuotePage.module.css";

const COMPANY = {
  name: "Landscape Craftsmen",
  phone: "(587) 438-6672",
  email: "landscapecraftsmen@yahoo.com",
  location: "Calgary, Alberta",
};

function getPrimaryServiceLine(project) {
  return Array.isArray(project?.servicesIncluded) && project.servicesIncluded.length
    ? project.servicesIncluded[0]
    : {
        name: project?.service || "Service",
        description: "",
        price: "0.00",
        quantity: "1",
        total: String(project?.totalCost || "0.00"),
      };
}

function getRecipientLines(client, project) {
  const lines = [];
  if (client?.name) lines.push(client.name);
  if (project?.address) lines.push(project.address);
  if (client?.city || client?.province) {
    lines.push([client?.city, client?.province].filter(Boolean).join(", "));
  }
  if (client?.phone) lines.push(client.phone);
  if (client?.email) lines.push(client.email);
  return lines;
}

export default async function AdminProjectQuotePage({ params }) {
  const resolvedParams = await params;
  const project = await findProjectById(resolvedParams.id);

  if (!project) notFound();
  if (!project.quoteData) notFound();

  const client = await fetchClientById(project.clientId);
  const serviceLine = getPrimaryServiceLine(project);
  const quote = buildQuoteData(project.quoteData, {
    unitPrice: serviceLine.price,
    quantity: serviceLine.quantity,
    description: serviceLine.description,
  });
  const recipientLines = getRecipientLines(client, project);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link className="admin-btn admin-btn--ghost" href={`/dashboard/projects/${project.id}`}>
          Back to project
        </Link>
        <PrintQuoteButton />
      </div>

      <article className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.companyName}>{COMPANY.name}</h1>
            <p className={styles.companyMeta}>
              {COMPANY.location} | {COMPANY.location}
            </p>
            <p className={styles.companyMeta}>
              {COMPANY.phone} | {COMPANY.email}
            </p>
          </div>

          <aside className={styles.summary}>
            <div className={styles.summaryTitle}>Quote #{quote.quoteNumber || project.id.slice(0, 8)}</div>
            <div className={styles.summaryRow}>
              <span>Sent on</span>
              <strong>{formatLongDate(quote.sentDate)}</strong>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <strong>{formatCurrency(quote.total)}</strong>
            </div>
          </aside>
        </header>

        <section className={styles.recipient}>
          <div>
            <div className={styles.label}>Recipient:</div>
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
            <span>Unit Price</span>
            <span>Total</span>
          </div>

          <div className={styles.tableRow}>
            <div>{serviceLine.name}</div>
            <div className={styles.description}>{quote.description || "No description added."}</div>
            <div>{quote.quantity}</div>
            <div>{formatCurrency(quote.unitPrice)}</div>
            <div>{formatCurrency(quote.subtotal)}</div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.deposit}>
          A deposit of {formatCurrency(quote.depositAmount)} will be required to begin.
        </section>

        <footer className={styles.footer}>
          <div className={styles.signature}>
            <div className={styles.signatureLine} />
            <div className={styles.signatureMeta}>
              <span>{formatLongDate(quote.sentDate)}</span>
              <span>Client Signature</span>
            </div>
            <p className={styles.note}>
              This quote is valid for the next 30 days, after which values may be subject to change.
            </p>
          </div>

          <div className={styles.totals}>
            <div className={styles.totalsRow}>
              <span>Subtotal</span>
              <strong>{formatCurrency(quote.subtotal)}</strong>
            </div>
            <div className={styles.totalsRow}>
              <span>GST ({formatPercent(quote.gstRate)})</span>
              <strong>{formatCurrency(quote.gstAmount)}</strong>
            </div>
            <div className={`${styles.totalsRow} ${styles.totalsRowTotal}`}>
              <span>Total</span>
              <strong>{formatCurrency(quote.total)}</strong>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
