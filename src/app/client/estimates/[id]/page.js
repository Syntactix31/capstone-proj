"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ClientLayout from "../../../components/ClientLayout.js";
import {
  buildQuoteData,
  formatCurrency,
  formatLongDate,
  formatPercent,
} from "../../../lib/quotes.js";
import styles from "../../../dashboard/projects/[id]/quote/QuotePage.module.css";

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

export default function ClientEstimateDetailPage() {
  const params = useParams();
  const estimateId = params?.id;
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!estimateId) return;

    let active = true;

    async function loadEstimate() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/client/estimates/${estimateId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setEstimate(null);
          setError(data?.error || "Failed to load estimate.");
          return;
        }

        setEstimate(data.estimate || null);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setEstimate(null);
        setError("Failed to load estimate.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEstimate();
    return () => {
      active = false;
    };
  }, [estimateId]);

  const serviceLine = useMemo(() => getPrimaryServiceLine(estimate), [estimate]);
  const estimateData = useMemo(
    () =>
      buildQuoteData(estimate?.quoteData || {}, {
        unitPrice: serviceLine.price,
        quantity: serviceLine.quantity,
        description: serviceLine.description,
      }),
    [estimate?.quoteData, serviceLine.description, serviceLine.price, serviceLine.quantity]
  );
  const recipientLines = useMemo(() => getRecipientLines(estimate), [estimate]);

  return (
    <ClientLayout>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link className="admin-btn admin-btn--ghost" href="/client/estimates">
            Back to estimates
          </Link>
        </div>

        {loading ? (
          <p className="client-muted">Loading estimate...</p>
        ) : error ? (
          <p className="client-error">{error}</p>
        ) : !estimate ? (
          <p className="client-muted">Estimate not found.</p>
        ) : (
          <article className={styles.sheet}>
            <header className={styles.header}>
              <div>
                <h1 className={styles.companyName}>{COMPANY.name}</h1>
                <p className={styles.companyMeta}>{COMPANY.location}</p>
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
        )}
      </div>
    </ClientLayout>
  );
}
