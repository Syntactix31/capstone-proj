"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminLayout from "../../../components/AdminLayout.js";
import { downloadInvoicePdf } from "../../../lib/invoices/pdf.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatIssuedDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).split("T")[0] || "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
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
          <h1 className="admin-title">Invoice</h1>
          <p className="admin-subtitle">Review the invoice and download a PDF copy when needed.</p>
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
            <article
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                background: "#fff",
                padding: "30px 32px",
                boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "28px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827" }}>
                    Landscape Craftsmen
                  </h2>
                  <p style={{ margin: "10px 0 0", color: "#4b5563" }}>Calgary, Alberta</p>
                  <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
                    (587) 438-6672 | landscapecraftsmen@yahoo.com
                  </p>
                </div>

                <div
                  style={{
                    minWidth: "240px",
                    border: "1px solid #cfd8cc",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: "#477a40", color: "#fff", padding: "12px 16px", fontWeight: 800 }}>
                    {invoice.id}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "12px 16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Issued</span>
                    <strong>{formatIssuedDate(invoice.issuedOn)}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "12px 16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Due</span>
                    <strong>{formatIssuedDate(invoice.dueOn || invoice.issuedOn)}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "12px 16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Status</span>
                    <strong>{invoice.status}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "12px 16px",
                      background: "#477a40",
                      color: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    <span>Total</span>
                    <strong>{formatMoney(invoice.amount)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "34px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#374151", marginBottom: "10px" }}>
                  RECIPIENT:
                </div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{invoice.client}</div>
                <div style={{ marginTop: "6px", color: "#4b5563" }}>{invoice.address || "-"}</div>
              </div>

              <div style={{ marginTop: "34px" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#111827", marginBottom: "14px" }}>
                  For Services Rendered
                </div>
                <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.15fr 2fr 0.5fr 0.75fr 0.75fr",
                      gap: "14px",
                      background: "#477a40",
                      color: "#fff",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    <div>Product / Service</div>
                    <div>Description</div>
                    <div>Qty.</div>
                    <div>Unit Price</div>
                    <div>Total</div>
                  </div>
                  {(
                    Array.isArray(invoice.servicesIncluded) && invoice.servicesIncluded.length
                      ? invoice.servicesIncluded
                      : [{ name: invoice.project, description: "", quantity: "1", price: invoice.amount, total: invoice.amount }]
                  ).map((line, index) => (
                    <div
                      key={`${line.name || invoice.project}-${index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.15fr 2fr 0.5fr 0.75fr 0.75fr",
                        gap: "14px",
                        padding: "14px 16px",
                        borderTop: index ? "1px solid #e5e7eb" : "none",
                        color: "#111827",
                      }}
                    >
                      <div>{line.name || invoice.project}</div>
                      <div>{line.description || "-"}</div>
                      <div>{line.quantity || "1"}</div>
                      <div>{formatMoney(line.price || line.total || 0)}</div>
                      <div>{formatMoney(line.total || line.price || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "28px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "24px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ maxWidth: "420px", color: "#4b5563", lineHeight: 1.65 }}>
                  Landscape Craftsmen provides professional outdoor construction and landscape services.
                  Thank you for your business. Please contact us with any questions regarding this invoice.
                </div>

                <div style={{ minWidth: "260px", maxWidth: "320px", width: "100%" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "10px 0",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Subtotal</span>
                    <strong>{formatMoney(invoice.quoteData?.subtotal || invoice.amount)}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "10px 0",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>GST ({Number(invoice.quoteData?.gstRate || 0.05) * 100}%)</span>
                    <strong>{formatMoney(invoice.quoteData?.gstAmount || 0)}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "10px 0",
                      borderTop: "1px solid #e5e7eb",
                      fontWeight: 800,
                    }}
                  >
                    <span>Total</span>
                    <strong>{formatMoney(invoice.amount)}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "12px",
                      padding: "10px 0",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Account balance</span>
                    <strong>{formatMoney(invoice.accountBalance || (invoice.status === "Paid" ? 0 : invoice.amount))}</strong>
                  </div>
                </div>
              </div>
            </article>

            <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={async () => {
                  try {
                    await downloadInvoicePdf(invoice);
                  } catch (downloadError) {
                    console.error(downloadError);
                    alert("Failed to download invoice PDF.");
                  }
                }}
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
