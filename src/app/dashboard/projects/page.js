"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout.js";

const PAYMENT_STATUSES = ["Unpaid", "Deposit Paid", "Fully Paid"];
const DEFAULT_SERVICES = [
  {
    id: "S-01",
    name: "Fence Installation",
    description: "Custom fence design, materials, and full installation.",
    price: "2800.00",
    quantity: "1",
    active: true,
  },
  {
    id: "S-02",
    name: "Deck & Railing",
    description: "Deck builds, railing upgrades, and safety repairs.",
    price: "4500.00",
    quantity: "1",
    active: true,
  },
  {
    id: "S-03",
    name: "Pergola",
    description: "Backyard pergola installation and finishing.",
    price: "3200.00",
    quantity: "1",
    active: true,
  },
  {
    id: "S-04",
    name: "Sod Installation",
    description: "Site prep and fresh sod installation.",
    price: "1100.00",
    quantity: "1",
    active: false,
  },
  {
    id: "S-05",
    name: "Trees and Shrubs",
    description: "Planting, pruning, and seasonal care.",
    price: "1100.00",
    quantity: "1",
    active: true,
  },
];

const PAYMENT_CLASS = {
  Unpaid: "admin-badge admin-badge--muted",
  "Deposit Paid": "admin-badge admin-badge--pending",
  "Fully Paid": "admin-badge admin-badge--active",
};

function formatVisitLabel(project) {
  if (!project.nextVisitDate) return "No upcoming visit";

  const rawDate = String(project.nextVisitDate).trim();
  if (!rawDate) return "No upcoming visit";

  return rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [services] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SERVICES;

    try {
      const stored = window.localStorage.getItem("admin_services");
      const parsed = stored ? JSON.parse(stored) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    clientId: "",
    service: DEFAULT_SERVICES[0].name,
    quantity: "1",
  });

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/projects", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setProjects([]);
          setError(data?.error || "Failed to load projects.");
          return;
        }

        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setProjects([]);
        setError("Failed to load projects.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setClientsLoading(true);
      try {
        const res = await fetch("/api/admin/clients", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setClients([]);
          return;
        }

        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setClients([]);
      } finally {
        if (active) setClientsLoading(false);
      }
    }

    loadClients();
    return () => {
      active = false;
    };
  }, []);

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
          sensitivity: "base",
        })
      ),
    [clients]
  );

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesPayment =
        paymentFilter === "All" || project.paymentStatus === paymentFilter;
      const matchesService =
        serviceFilter === "All" || project.service === serviceFilter;

      if (!q) return matchesPayment && matchesService;

      const matchesQuery =
        project.id.toLowerCase().includes(q) ||
        project.client.toLowerCase().includes(q) ||
        project.service.toLowerCase().includes(q);

      return matchesPayment && matchesService && matchesQuery;
    });
  }, [paymentFilter, projects, query, serviceFilter]);

  const serviceOptions = useMemo(
    () => ["All", ...Array.from(new Set([...services.map((service) => service.name), ...projects.map((project) => project.service)])).sort()],
    [projects, services]
  );

  const availableServices = useMemo(
    () => services.filter((service) => service.active !== false),
    [services]
  );

  const selectedService = useMemo(
    () =>
      availableServices.find((service) => service.name === projectForm.service) ||
      availableServices[0] ||
      null,
    [availableServices, projectForm.service]
  );

  const projectQuantity = useMemo(
    () => Math.max(1, Number.parseInt(projectForm.quantity || "1", 10) || 1),
    [projectForm.quantity]
  );

  const projectTotal = useMemo(() => {
    const unitPrice = Number.parseFloat(selectedService?.price || "0") || 0;
    return (unitPrice * projectQuantity).toFixed(2);
  }, [projectQuantity, selectedService]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      upcoming: projects.filter((project) => project.nextVisitTs < Number.POSITIVE_INFINITY).length,
      unpaid: projects.filter((project) => project.paymentStatus === "Unpaid").length,
    };
  }, [projects]);

  const openProjectModal = () => {
    setProjectForm({
      clientId: sortedClients[0]?.id || "",
      service: availableServices[0]?.name || DEFAULT_SERVICES[0].name,
      quantity: "1",
    });
    setIsProjectModalOpen(true);
  };

  const openProjectPreview = (project) => {
    setSelectedProject(project);
  };

  const handleProjectFormChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectCreate = async (event) => {
    event.preventDefault();
    const selectedClient =
      sortedClients.find((client) => client.id === projectForm.clientId) || null;
    if (!selectedClient) return;

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          service: projectForm.service,
          address: selectedClient.address || "",
          totalCost: projectTotal,
          servicesIncluded: [
            {
              id: selectedService?.id || "service-1",
              name: projectForm.service,
              description: selectedService?.description || "",
              price: String(selectedService?.price || "0.00"),
              quantity: String(projectQuantity),
              total: projectTotal,
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to create project.");
        return;
      }

      setProjects((prev) => [data.project, ...prev.filter((project) => project.id !== data.project.id)]);
      setIsProjectModalOpen(false);
    } catch (error) {
      console.error(error);
      setError("Failed to create project.");
    }
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Projects</h1>
          <p className="admin-subtitle">
            Track active client work, upcoming visits, and payment progress in one list.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn admin-btn--primary" type="button" onClick={openProjectModal}>
            New project
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header admin-projects-header">
          <h2 className="admin-card-title">Project list</h2>
        </div>
        <div className="admin-actions admin-projects-controls">
          <div className="admin-projects-control admin-projects-control--search">
            <input
              id="projects-search"
              className="admin-input"
              type="search"
              placeholder="Search projects..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search projects"
            />
          </div>
          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="projects-payment-filter">
              Status
            </label>
            <select
              id="projects-payment-filter"
              className="admin-input"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              aria-label="Filter project payment status"
            >
              <option value="All">All</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-projects-control">
            <label className="admin-projects-control-label" htmlFor="projects-service-filter">
              Type
            </label>
            <select
              id="projects-service-filter"
              className="admin-input"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              aria-label="Filter project service"
            >
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service === "All" ? "All" : service}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="admin-muted">Loading projects...</p>
        ) : (
          <div className="admin-table admin-projects-table">
            <div className="admin-table-row admin-table-head admin-projects-table-row">
              <div>Client</div>
              <div>Included service</div>
              <div>Next visit</div>
              <div>Payment status</div>
            </div>

            {filteredProjects.map((project) => (
              <button
                type="button"
                className="admin-table-row admin-projects-table-row admin-projects-table-row--button"
                key={project.id}
                onClick={() => openProjectPreview(project)}
              >
                <div>
                  <div className="admin-strong">{project.client}</div>
                  <div className="admin-muted">{project.address || "Address not added"}</div>
                </div>
                <div>{project.service}</div>
                <div>
                  <div>{formatVisitLabel(project)}</div>
                  <div className="admin-muted">
                    {project.nextVisitTs < Number.POSITIVE_INFINITY ? "Upcoming appointment" : "No visit scheduled"}
                  </div>
                </div>
                <div>
                  <span className={PAYMENT_CLASS[project.paymentStatus]}>
                    {project.paymentStatus}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !filteredProjects.length ? (
          <p className="admin-muted" style={{ marginTop: "12px" }}>
            No projects match current filters.
          </p>
        ) : null}
      </section>

      {isProjectModalOpen ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close new project modal"
            onClick={() => setIsProjectModalOpen(false)}
          />
          <form
            className="admin-modal__content"
            role="dialog"
            aria-modal="true"
            onSubmit={handleProjectCreate}
          >
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">New project</h2>
                <p className="admin-subtitle">Select a client first, then choose the included service.</p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-client">
                  Client
                </label>
                <select
                  id="project-client"
                  name="clientId"
                  className="admin-input"
                  value={projectForm.clientId}
                  onChange={handleProjectFormChange}
                  required
                  disabled={clientsLoading || !sortedClients.length}
                >
                  {!sortedClients.length ? (
                    <option value="">
                      {clientsLoading ? "Loading clients..." : "No clients available"}
                    </option>
                  ) : null}
                  {sortedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-service">
                  Service
                </label>
                <select
                  id="project-service"
                  name="service"
                  className="admin-input"
                  value={projectForm.service}
                  onChange={handleProjectFormChange}
                  required
                >
                  {availableServices.map((service) => (
                    <option key={service.id || service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-quantity">
                  Quantity
                </label>
                <input
                  id="project-quantity"
                  name="quantity"
                  className="admin-input"
                  type="number"
                  min="1"
                  step="1"
                  value={projectForm.quantity}
                  onChange={handleProjectFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Calculated total</label>
                <input
                  className="admin-input"
                  value={`$${projectTotal}`}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--primary"
                type="submit"
                disabled={clientsLoading || !projectForm.clientId}
              >
                Create project
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedProject ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            className="admin-modal__backdrop"
            type="button"
            aria-label="Close project details"
            onClick={() => setSelectedProject(null)}
          />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">{selectedProject.client}</h2>
                <p className="admin-subtitle">
                  {selectedProject.service}
                  {selectedProject.address ? ` - ${selectedProject.address}` : ""}
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => setSelectedProject(null)}
              >
                Close
              </button>
            </div>

            <div className="admin-form">
              <div className="admin-field">
                <span className="admin-label">Project ID</span>
                <div className="admin-muted">{selectedProject.id}</div>
              </div>
              <div className="admin-field">
                <span className="admin-label">Payment status</span>
                <span className={PAYMENT_CLASS[selectedProject.paymentStatus]}>
                  {selectedProject.paymentStatus}
                </span>
              </div>
              <div className="admin-field">
                <span className="admin-label">Start date</span>
                <div className="admin-muted">{selectedProject.startDate || "Not set"}</div>
              </div>
              <div className="admin-field">
                <span className="admin-label">Estimated completion</span>
                <div className="admin-muted">
                  {selectedProject.estimatedCompletionDate || "Not set"}
                </div>
              </div>
              <div className="admin-field">
                <span className="admin-label">Total cost</span>
                <div className="admin-muted">
                  ${Number(selectedProject.totalCost || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="admin-modal__actions">
              <Link
                className="admin-btn admin-btn--primary"
                href={`/dashboard/projects/${selectedProject.id}`}
              >
                Open project page
              </Link>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setSelectedProject(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
