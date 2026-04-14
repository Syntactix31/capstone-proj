"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout.js";
import {
  buildQuoteData,
  DEFAULT_DEPOSIT_RATE,
  DEFAULT_GST_RATE,
  formatCurrency,
  todayDateValue,
} from "../../lib/quotes.js";
import { SERVICE_CATALOG, normalizeServiceDisplay, normalizeServiceList, normalizeServiceName } from "../../lib/services/catalog.js";

const PAYMENT_STATUSES = ["Unpaid", "Deposit Paid", "Fully Paid"];
const DEFAULT_SERVICES = SERVICE_CATALOG.map((service, index) => ({
  id: `S-${String(index + 1).padStart(2, "0")}`,
  name: service.name,
  description: service.description,
  price: service.price,
  quantity: String(service.quantity),
  active: service.active,
}));

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

function createProjectForm(service) {
  return {
    clientId: "",
    service: service?.name || DEFAULT_SERVICES[0].name,
    priceMode: "default",
    unitPrice: String(service?.price || "0.00"),
    quantity: "1",
    description: service?.description || "",
    quoteSentDate: todayDateValue(),
    gstRate: String(DEFAULT_GST_RATE * 100),
    depositRate: String(DEFAULT_DEPOSIT_RATE * 100),
  };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState(() =>
    createProjectForm(DEFAULT_SERVICES[0])
  );

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

    async function loadServices() {
      try {
        const res = await fetch("/api/admin/services", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setServices(DEFAULT_SERVICES);
          return;
        }

        const nextServices = Array.isArray(data.services)
          ? data.services.map((service) => ({ ...service, name: normalizeServiceName(service.name) }))
          : [];
        setServices(nextServices.length ? nextServices : DEFAULT_SERVICES);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setServices(DEFAULT_SERVICES);
      }
    }

    loadServices();
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
        serviceFilter === "All" || normalizeServiceName(project.service) === serviceFilter;

      if (!q) return matchesPayment && matchesService;

      const matchesQuery =
        project.id.toLowerCase().includes(q) ||
        project.client.toLowerCase().includes(q) ||
        normalizeServiceName(project.service).toLowerCase().includes(q);

      return matchesPayment && matchesService && matchesQuery;
    });
  }, [paymentFilter, projects, query, serviceFilter]);

  const serviceOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set([
          ...services.map((service) => normalizeServiceName(service.name)),
          ...projects.flatMap((project) => normalizeServiceList(project.service)),
        ])
      ).sort(),
    ],
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

  const projectQuote = useMemo(
    () =>
      buildQuoteData({
        priceMode: projectForm.priceMode,
        unitPrice: projectForm.unitPrice,
        quantity: projectForm.quantity,
        description: projectForm.description,
        sentDate: projectForm.quoteSentDate,
        gstRate: projectForm.gstRate,
        depositRate: projectForm.depositRate,
      }),
    [
      projectForm.depositRate,
      projectForm.description,
      projectForm.gstRate,
      projectForm.priceMode,
      projectForm.quantity,
      projectForm.quoteSentDate,
      projectForm.unitPrice,
    ]
  );

  const projectTotal = projectQuote.total;

  const stats = useMemo(() => {
    return {
      total: projects.length,
      upcoming: projects.filter((project) => project.nextVisitTs < Number.POSITIVE_INFINITY).length,
      unpaid: projects.filter((project) => project.paymentStatus === "Unpaid").length,
    };
  }, [projects]);

  const openProjectModal = () => {
    const defaultService = availableServices[0] || DEFAULT_SERVICES[0];
    setProjectForm({
      ...createProjectForm(defaultService),
      clientId: sortedClients[0]?.id || "",
    });
    setIsProjectModalOpen(true);
  };

  const openProjectPreview = (project) => {
    setSelectedProject(project);
  };

  const handleProjectFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "service") {
      const nextService =
        availableServices.find((service) => service.name === value) || null;
      setProjectForm((prev) => ({
        ...prev,
        service: value,
        unitPrice:
          prev.priceMode === "default"
            ? String(nextService?.price || "0.00")
            : prev.unitPrice,
        description:
          !prev.description || prev.description === selectedService?.description
            ? nextService?.description || ""
            : prev.description,
      }));
      return;
    }

    if (name === "priceMode") {
      setProjectForm((prev) => ({
        ...prev,
        priceMode: value,
        unitPrice:
          value === "default"
            ? String(selectedService?.price || "0.00")
            : prev.unitPrice,
      }));
      return;
    }

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
              description: projectForm.description,
              price: projectQuote.unitPrice,
              quantity: String(projectQuantity),
              total: projectQuote.subtotal,
            },
          ],
          quoteData: projectQuote,
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
                  <div>{normalizeServiceDisplay(project.service)}</div>
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
                <p className="admin-subtitle">
                  Build the service line, quote pricing, and recipient details before creating the project.
                </p>
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
                <label className="admin-label" htmlFor="project-price-mode">
                  Pricing mode
                </label>
                <select
                  id="project-price-mode"
                  name="priceMode"
                  className="admin-input"
                  value={projectForm.priceMode}
                  onChange={handleProjectFormChange}
                >
                  <option value="default">Use default service price</option>
                  <option value="custom">Use custom unit price</option>
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-unit-price">
                  Unit price ($)
                </label>
                <input
                  id="project-unit-price"
                  name="unitPrice"
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={projectForm.unitPrice}
                  onChange={handleProjectFormChange}
                  disabled={projectForm.priceMode === "default"}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-quote-sent-date">
                  Quote sent date
                </label>
                <input
                  id="project-quote-sent-date"
                  name="quoteSentDate"
                  className="admin-input"
                  type="date"
                  value={projectForm.quoteSentDate}
                  onChange={handleProjectFormChange}
                  required
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-gst-rate">
                  GST (%)
                </label>
                <input
                  id="project-gst-rate"
                  name="gstRate"
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={projectForm.gstRate}
                  onChange={handleProjectFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-deposit-rate">
                  Deposit required (%)
                </label>
                <input
                  id="project-deposit-rate"
                  name="depositRate"
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={projectForm.depositRate}
                  onChange={handleProjectFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="project-description">
                  Service description
                </label>
                <textarea
                  id="project-description"
                  name="description"
                  className="admin-textarea"
                  rows={5}
                  value={projectForm.description}
                  onChange={handleProjectFormChange}
                  placeholder="Describe the service, materials, and scope for the quote."
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Calculated total</label>
                <input
                  className="admin-input"
                  value={formatCurrency(projectQuote.total)}
                  disabled
                  readOnly
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Quote subtotal</label>
                <input
                  className="admin-input"
                  value={formatCurrency(projectQuote.subtotal)}
                  disabled
                  readOnly
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">GST amount</label>
                <input
                  className="admin-input"
                  value={formatCurrency(projectQuote.gstAmount)}
                  disabled
                  readOnly
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label">Deposit amount</label>
                <input
                  className="admin-input"
                  value={formatCurrency(projectQuote.depositAmount)}
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
                Create project and quotation
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
                  {normalizeServiceDisplay(selectedProject.service)}
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
              {selectedProject.quoteData ? (
                <Link
                  className="admin-btn admin-btn--ghost"
                  href={`/dashboard/projects/${selectedProject.id}/quote`}
                  target="_blank"
                >
                  View quotation
                </Link>
              ) : null}
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
