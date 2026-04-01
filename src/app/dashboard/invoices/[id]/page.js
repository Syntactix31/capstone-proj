"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../../components/AdminLayout.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params?.id;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoiceId) return;

    let active = true;

    async function loadInvoice() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/admin/invoices/${invoiceId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setInvoice(null);
          setError(data?.error || "Failed to load invoice.");
          return;
        }

        setInvoice(data.invoice || null);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setInvoice(null);
        setError("Failed to load invoice.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInvoice();
    return () => {
      active = false;
    };
  }, [invoiceId]);

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-muted">
            <Link href="/dashboard/invoices" className="admin-link">
              Back to invoices
            </Link>
          </p>
          <h1 className="admin-title">{invoice?.id || "Invoice"}</h1>
          <p className="admin-subtitle">Open invoice details and download a copy when needed.</p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
      </section>

      <section className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading invoice...</p>
        ) : !invoice ? (
          <p className="admin-muted">Invoice not found.</p>
        ) : (
          <div className="admin-stack">
            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <div className="admin-summary-label">Client</div>
                <div className="admin-summary-value">{invoice.client}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Project</div>
                <div className="admin-summary-value">{invoice.project}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Status</div>
                <div className="admin-summary-value">{invoice.status}</div>
              </article>
              <article className="admin-summary-card">
                <div className="admin-summary-label">Total</div>
                <div className="admin-summary-value">{formatMoney(invoice.amount)}</div>
              </article>
            </div>

            <div className="admin-table admin-invoices-table">
              <div className="admin-table-row admin-table-head admin-invoices-table-row">
                <div>Client</div>
                <div>Invoice ID</div>
                <div>Project</div>
                <div>Issued</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="admin-table-row admin-invoices-table-row">
                <div>{invoice.client}</div>
                <div className="admin-strong">{invoice.id}</div>
                <div>{invoice.project}</div>
                <div>{invoice.issuedOn || "-"}</div>
                <div>{formatMoney(invoice.amount)}</div>
                <div>{invoice.status}</div>
                <div className="admin-actions">
                  <a
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    href={`/api/admin/invoices/${invoice.id}?download=1`}
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
