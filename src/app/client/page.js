"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ClientLayout from "../components/ClientLayout.js";

const STATUS_CLASS = {
  Active: "client-badge client-badge--active",
  Pending: "client-badge client-badge--pending",
  Paid: "client-badge client-badge--paid",
};

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadClientOverview() {
      try {
        const res = await fetch("/api/client/overview", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;
        if (!res.ok) {
          setError(data?.error || "Failed to load client data.");
          return;
        }

        setProjects(data.projects || []);
        setEstimates(data.estimates || []);
        setPayments(data.payments || []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load client data.");
      }
    }

    loadClientOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const pendingEstimates = estimates.filter((e) => e.status === "Pending").length;
  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2),
    [payments]
  );

  return (
    <ClientLayout>
      <section className="client-hero">
        <div>
          <p className="client-kicker">Client Dashboard</p>
          <h1 className="client-title">Welcome Back</h1>
          <p className="client-subtitle">
            Here’s a quick summary of your projects, estimates, and recent payments.
          </p>
          {error ? <p className="client-error">{error}</p> : null}
        </div>
      </section>

      <section className="client-summary-grid">
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Active Projects</div>
          <div className="client-stat-value">{activeProjects}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Pending Estimates</div>
          <div className="client-stat-value">{pendingEstimates}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Total Paid</div>
          <div className="client-stat-value">${totalPaid}</div>
        </article>
      </section>

      <section className="client-grid">
        <article className="client-card">
          <div className="client-card-header">
            <h2 className="client-card-title">Projects Overview</h2>
            <Link className="client-link" href="/client/projects">
              View all projects
            </Link>
          </div>
          <div className="client-list">
            {projects.slice(0, 5).map((proj) => (
              <div className="client-list-row" key={proj.id}>
                <div>
                  <div className="client-strong">{proj.name}</div>
                  <div className="client-muted">{proj.startDate}</div>
                </div>
                <span className={STATUS_CLASS[proj.status] || "client-badge"}>
                  {proj.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="client-card">
          <div className="client-card-header">
            <h2 className="client-card-title">Recent Estimates</h2>
            <Link className="client-link" href="/client/estimates">
              Manage estimates
            </Link>
          </div>
          <div className="client-list">
            {estimates.slice(0, 5).map((est) => (
              <div className="client-list-row" key={est.id}>
                <div>
                  <div className="client-strong">{est.project}</div>
                  <div className="client-muted">${est.amount}</div>
                </div>
                <span className={STATUS_CLASS[est.status] || "client-badge"}>
                  {est.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="client-card client-card--full">
          <div className="client-card-header">
            <h2 className="client-card-title">Recent Payments</h2>
            <Link className="client-link" href="/client/payments">
              View all payments
            </Link>
          </div>
          <div className="client-table">
            <div className="client-table-row client-table-head">
              <div>Date</div>
              <div>Project</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            {payments.slice(0, 5).map((p) => (
              <div className="client-table-row" key={p.id}>
                <div>{p.date}</div>
                <div>{p.project}</div>
                <div>${p.amount}</div>
                <span className={STATUS_CLASS[p.status] || "client-badge"}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </ClientLayout>
  );
}

