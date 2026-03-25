"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClientLayout from "../../components/ClientLayout.js";

const STATUS_CLASS = {
  Active: "client-badge client-badge--active",
  Pending: "client-badge client-badge--pending",
  Paid: "client-badge client-badge--paid",
  Complete: "client-badge client-badge--complete",
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/client/overview", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(
            data?.error ||
              "Failed to load projects. Please contact support if this problem continues."
          );
          return;
        }

        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(
          "Failed to load projects. Please contact support to get set up with a client account and added to our client system."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ClientLayout>
      <section className="client-hero">
        <div>
          <p className="client-kicker">PROJECTS</p>
          <h1 className="client-title">Your Current Projects</h1>
          <p className="client-subtitle">
            View all your active and past projects in one place.
          </p>
          {error ? <p className="client-error">{error}</p> : null}
        </div>
      </section>

      <section className="client-grid">
        <article className="client-card client-card--full">
          <div className="client-card-header">
            <h2 className="client-card-title">Projects</h2>
            <div className="client-muted">
              {projects.length === 0
                ? "No projects found yet."
                : `${projects.length} project${projects.length === 1 ? "" : "s"} total`}
            </div>
          </div>

          {loading ? (
            <div className="client-list">
              <div className="client-list-row">
                <div className="client-muted">Loading projects...</div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="client-list">
              <div className="client-list-row">
                <div>
                  <div className="client-strong">No projects yet</div>
                  <div className="client-muted">
                    Once your first project has been created, it will show up here with its status and details.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="client-table">
              <div className="client-table-row client-table-head">
                <div>Project</div>
                <div>Start Date</div>
                <div>End Date</div>
                <div>Status</div>
              </div>
              {projects.map((proj) => (
                <div className="client-table-row" key={proj.id}>
                  <div>
                    <div className="client-strong">
                      <Link href={`/client/projects/${proj.id}`} className="client-link">
                        {proj.name}
                      </Link>
                    </div>
                    {proj.description ? (
                      <div className="client-muted">{proj.description}</div>
                    ) : null}
                  </div>
                  <div>{proj.startDate || "-"}</div>
                  <div>{proj.endDate || "-"}</div>
                  <span className={STATUS_CLASS[proj.status] || "client-badge"}>
                    {proj.status}
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


