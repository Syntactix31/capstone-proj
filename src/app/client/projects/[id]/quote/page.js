"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ClientLayout from "../../../../components/ClientLayout.js";
import {
  buildQuoteData,
  formatCurrency,
  formatLongDate,
  formatPercent,
} from "../../../../lib/quotes.js";
import styles from "../../../../dashboard/projects/[id]/quote/QuotePage.module.css";

const COMPANY = {
  name: "Landscape Craftsmen",
  phone: "(587) 438-6672",
  email: "landscapecraftsmen@yahoo.com",
  location: "Calgary, Alberta",
};

function getPrimaryServiceLine(project) {
  return Array.isArray(project?.services) && project.services.length
    ? project.services[0]
    : {
        name: project?.service || "Service",
        description: "",
        price: "0.00",
        quantity: "1",
        total: String(project?.totalAmount || "0.00"),
      };
}

function getRecipientLines(project) {
  return [
    project?.clientName,
    project?.address,
  ].filter(Boolean);
}

export default function ClientProjectQuotePage() {
  const params = useParams();
  const projectId = params?.id;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    let active = true;

    async function loadProject() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/client/project/${projectId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setProject(null);
          setError(data?.error || "Failed to load quote.");
          return;
        }

        if (!data?.project?.quoteData) {
          setProject(null);
          setError("Quote not found.");
          return;
        }

        setProject(data.project || null);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setProject(null);
        setError("Failed to load quote.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProject();
    return () => {
      active = false;
    };
  }, [projectId]);

  const serviceLine = useMemo(() => getPrimaryServiceLine(project), [project]);
  const quote = useMemo(
    () =>
      buildQuoteData(project?.quoteData || {}, {
        unitPrice: serviceLine.price,
        quantity: serviceLine.quantity,
        description: serviceLine.description,
      }),
    [project?.quoteData, serviceLine.description, serviceLine.price, serviceLine.quantity]
  );
  const recipientLines = useMemo(() => getRecipientLines(project), [project]);

  return (
    <ClientLayout>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link className="admin-btn admin-btn--ghost" href="/client/estimates">
            Back to estimates
          </Link>
        </div>

        {loading ? (
          <p className="client-muted">Loading quote...</p>
        ) : error ? (
          <p className="client-error">{error}</p>
        ) : !project ? (
          <p className="client-muted">Quote not found.</p>
        ) : (
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
                <div className={styles.summaryTitle}>
                  Quote #{quote.quoteNumber || project.id.slice(0, 8)}
                </div>
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
        )}
      </div>
    </ClientLayout>
  );
}
