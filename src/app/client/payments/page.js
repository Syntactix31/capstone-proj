"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ClientLayout from "../../components/ClientLayout.js";

const STATUS_CLASS = {
  Active: "client-badge client-badge--active",
  Pending: "client-badge client-badge--pending",
  Paid: "client-badge client-badge--paid",
  Required: "client-badge client-badge--pending",
  Failed: "client-badge client-badge--rejected",
  Refunded: "client-badge client-badge--complete",
};

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPayments() {
      try {
        setLoading(true);
        const res = await fetch("/api/client/payments", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(
            data?.error ||
              "Failed to load payments. Please contact support if this problem continues."
          );
          return;
        }

        setPayments(data.payments || []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load payments data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPayments();
    return () => {
      mounted = false;
    };
  }, []);

  const paidPayments = payments.filter((p) => p.status === "Paid");
  const pendingPayments = payments.filter((p) => p.status === "Pending");
  const requiredPayments = payments.filter(
    (p) => p.status === "Required" || p.type === "Required"
  );

  const totalPaid = useMemo(
    () =>
      paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString(
        "en-CA",
        {
          style: "currency",
          currency: "CAD",
        }
      ),
    [paidPayments]
  );

  const totalRequired = useMemo(
    () =>
      requiredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString(
        "en-CA",
        {
          style: "currency",
          currency: "CAD",
        }
      ),
    [requiredPayments]
  );

  return (
    <ClientLayout>
      <section className="client-hero">
        <div>
          <p className="client-kicker">PAYMENTS</p>
          <h1 className="client-title">Payment History & Status</h1>
          <p className="client-subtitle">
            Track all your payments, pending transactions, and upcoming required payments.
          </p>
          {error ? <p className="client-error">{error}</p> : null}
        </div>
      </section>

      <section className="client-summary-grid mb-8">
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Total Paid</div>
          <div className="client-stat-value">{totalPaid}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Pending</div>
          <div className="client-stat-value">{pendingPayments.length}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Required</div>
          <div className="client-stat-value">{requiredPayments.length}</div>
        </article>
      </section>

      <section className="client-grid">
        {/* Paid payments */}
        <article className="client-card">
          <div className="client-card-header">
            <h2 className="client-card-title">Completed Payments</h2>
            <div className="client-muted">
              Deposits & Final Payments • {paidPayments.length} total
            </div>
          </div>
          {loading ? (
            <div className="client-table">
              <div className="client-table-row">
                <div colSpan="4" className="client-muted text-center py-8">
                  Loading payments...
                </div>
              </div>
            </div>
          ) : paidPayments.length === 0 ? (
            <div className="client-table">
              <div className="client-table-row">
                <div colSpan="4" className="client-muted text-center py-8">
                  No completed payments yet
                </div>
              </div>
            </div>
          ) : (
            <div className="client-table">
              <div className="client-table-row client-table-head">
                <div>Date</div>
                <div>Project</div>
                <div>Type</div>
                <div>Amount</div>
              </div>
              {paidPayments.slice(0, 10).map((payment) => (
                <div className="client-table-row" key={payment.id}>
                  <div>{payment.date}</div>
                  <div className="client-strong">{payment.project}</div>
                  <div>{payment.type || "Payment"}</div>
                  <div className="font-semibold">${payment.amount}</div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="client-card client-card--full">
          <div className="client-card-header">
            <h2 className="client-card-title">
              Pending & Required Payments
            </h2>
            <div className="client-muted">
              Action required • Total due: {totalRequired}
            </div>
          </div>

          {loading ? (
            <div className="client-list">
              <div className="client-list-row">
                <div className="client-muted">Loading...</div>
              </div>
            </div>
          ) : pendingPayments.length === 0 && requiredPayments.length === 0 ? (
            <div className="client-list">
              <div className="client-list-row">
                <div>
                  <div className="client-strong">All payments up to date</div>
                  <div className="client-muted">
                    No pending or required payments at this time.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="client-table">
              <div className="client-table-row client-table-head">
                <div>Project</div>
                <div>Type</div>
                <div>Due Date</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              {[...pendingPayments, ...requiredPayments]
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                .slice(0, 10)
                .map((payment) => (
                  <div className="client-table-row" key={payment.id}>
                    <div className="client-strong">{payment.project}</div>
                    <div>{payment.type}</div>
                    <div>{payment.dueDate || "-"}</div>
                    <div className="font-semibold">${payment.amount}</div>
                    <span className={STATUS_CLASS[payment.status] || "client-badge"}>
                      {payment.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </article>
      </section>
    </ClientLayout>
  );
}




