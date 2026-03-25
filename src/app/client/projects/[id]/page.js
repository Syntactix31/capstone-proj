"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ClientLayout from "../../../components/ClientLayout.js";

const STATUS_CLASS = {
  Active: "client-badge client-badge--active",
  Pending: "client-badge client-badge--pending",
  Paid: "client-badge client-badge--paid",
  Complete: "client-badge client-badge--complete",
};

export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    async function loadProject() {
      try {
        setLoading(true);
        const res = await fetch(`/api/client/project/${projectId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(data?.error || "Project not found or access denied.");
          return;
        }

        setProject(data.project || null);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load project details. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProject();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <ClientLayout>
        <section className="client-hero">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#477a40] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading project details...</p>
            </div>
          </div>
        </section>
      </ClientLayout>
    );
  }

  if (error || !project) {
    return (
      <ClientLayout>
        <section className="client-hero">
          <div className="text-center py-24">
            <h1 className="client-title mb-4">Project Not Found</h1>
            <p className="client-subtitle mb-8 max-w-md mx-auto">
              {error || "This project doesn't exist or you don't have access."}
            </p>
            <Link href="/client/projects" className="client-link">
              ← Back to Projects
            </Link>
          </div>
        </section>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <section className="client-hero">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p className="client-kicker">Project Details</p>
            <h1 className="client-title">{project.name}</h1>
            <p className="client-subtitle">
              {project.description || "Landscape project in progress."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={STATUS_CLASS[project.status] || "client-badge"}>
              {project.status}
            </span>
            {project.projectedCompletion && (
              <div className="text-sm text-gray-600">
                Projected completion: {project.estimatedCompletionDate}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="client-summary-grid mb-8">
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Start Date</div>
          <div className="client-stat-value">{project.startDate || "-"}</div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Est. Completion</div>
          <div className="client-stat-value">
            {project.estimatedCompletionDate || "-"}
          </div>
        </article>
        <article className="client-card client-card--stat">
          <div className="client-stat-title">Total Cost</div>
          <div className="client-stat-value">
            ${project.totalAmount?.toLocaleString() || "-"}
          </div>
        </article>
      </section>

      <section className="client-grid">
        <article className="client-card">
          <div className="client-card-header">
            <h2 className="client-card-title">Services Included</h2>
          </div>
          <div className="client-list">
            {project.services && project.services.length > 0 ? (
              project.services.map((service, idx) => (
                <div className="client-list-row" key={idx}>
                  <div>
                    <div className="client-strong">{service.name}</div>
                    <div className="client-muted">
                      {/* Ensuring all value fields are consistent */}
                      {/* {service.description || service.amount ? `$${service.amount}` : ""} */}

                      {service.description || service.price ? `$${service.price}` : ""}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="client-list-row">
                <div className="client-muted">No services listed yet</div>
              </div>
            )}
          </div>
        </article>

        <article className="client-card">
          <div className="client-card-header">
            <h2 className="client-card-title">Payments</h2>
            <div className="client-muted">
              Total: ${project.totalPaid?.toLocaleString() || "0"}
            </div>
          </div>
          <div className="client-table">
            <div className="client-table-row client-table-head">
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            {project.payments && project.payments.length > 0 ? (
              project.payments.map((payment) => (
                <div className="client-table-row" key={payment.id}>
                  <div>{payment.date}</div>
                  <div>${payment.amount}</div>
                  <span className={STATUS_CLASS[payment.status] || "client-badge"}>
                    {payment.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="client-table-row">
                <div colSpan="3" className="client-muted text-center py-8">
                  No payments recorded
                </div>
              </div>
            )}
          </div>
        </article>

        {project.ownerNotes && (
          <article className="client-card client-card--full">
            <div className="client-card-header">
              <h2 className="client-card-title">Owner Notes</h2>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {project.ownerNotes}
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {project.notesUpdatedAt || project.updatedAt || "-"}
              </div>
            </div>
          </article>
        )}

        {project.estimatePdfUrl && (
          <article className="client-card">
            <div className="client-card-header">
              <h2 className="client-card-title">Estimate</h2>
            </div>
            <div className="p-8 text-center">
              <a
                href={project.estimatePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-[#477a40] text-white font-semibold rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-200 max-w-sm mx-auto"
              >
                View Estimate PDF
              </a>
            </div>
          </article>
        )}
      </section>
    </ClientLayout>
  );
}


// ======== TODO ============
// Add estimate connection to pdf blob storage but linked to admin estimate based on client information
