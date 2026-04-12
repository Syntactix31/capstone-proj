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

      <section className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 md:gap-6 lg:gap-8">
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
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="w-full min-w-[600px] table-auto">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
            Project
          </th>
          <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
            Start Date
          </th>
          <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
            End Date
          </th>
          <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {projects.map((proj) => (
          <tr key={proj.id} className="hover:bg-gray-50 transition-colors duration-150">
            <td className="py-4 px-6 align-top">
              <div className="client-strong">
                <Link href={`/client/projects/${proj.id}`} className="client-link hover:underline">
                  {proj.name}
                </Link>
              </div>
              {proj.description && (
                <div className="client-muted text-sm mt-1 line-clamp-2">{proj.description}</div>
              )}
            </td>
            <td className="py-4 px-6 text-sm text-gray-900 font-medium">
              {proj.startDate || "-"}
            </td>
            <td className="py-4 px-6 text-sm text-gray-900 font-medium">
              {proj.endDate || "-"}
            </td>
            <td className="py-4 px-6 text-center">
              <span
                className={
                  STATUS_CLASS[proj.status] || "client-badge client-badge--pending"
                }
              >
                {proj.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
          )}
        </article>
      </section>
    </ClientLayout>
  );
}


