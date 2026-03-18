"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";


/*placeholder services until active database implemented*/
const SERVICES = [
  {
    id: "S-01",
    name: "Fence Installation",
    description: "Custom fence design, materials, and full installation.",
    duration: "1-2 days",
    price: "2800.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-02",
    name: "Deck & Railing",
    description: "Deck builds, railing upgrades, and safety repairs.",
    duration: "3-5 days",
    price: "4500.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-03",
    name: "Pergola",
    description: "Backyard pergola installation and finishing.",
    duration: "1-3 days",
    price: "3200.00",
    quantity: 1,
    active: true,
  },
  {
    id: "S-04",
    name: "Sod Installation",
    description: "Site prep and fresh sod installation.",
    duration: "1 day",
    price: "1100.00",
    quantity: 1,
    active: false,
  },
  {
    id: "S-05",
    name: "Trees and Shrubs",
    description: "Planting, pruning, and seasonal care.",
    duration: "1 day",
    price: "1100.00",
    quantity: 1,
    active: true,
  },
];

// Admin UI for managing service cards/details.
export default function AdminServicesPage() {
  const [services, setServices] = useState(SERVICES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0.00",
    quantity: "1",
    durationValue: "1",
    durationUnit: "hours",
  });

  // Save service edits locally so the admin UI keeps its state between refreshes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_services", JSON.stringify(services));
  }, [services]);

  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );

  // Update whichever field changed in the service form.
  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset the form back to its default "new service" state.
  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      price: "0.00",
      quantity: "1",
      durationValue: "1",
      durationUnit: "hours",
    });
    setSelectedServiceId(null);
  };

  // Either update an existing service or create a new one in local state.
  const handleSubmit = (event) => {
    event.preventDefault();
    const formattedDuration = `${formData.durationValue} ${formData.durationUnit}`;
    const normalizedPrice = (
      Number.parseFloat(formData.price || "0") || 0
    ).toFixed(2);
    const normalizedQuantity = String(
      Math.max(1, Number.parseInt(formData.quantity || "1", 10) || 1)
    );

    if (selectedServiceId) {
      setServices((prev) =>
        prev.map((service) =>
          service.id === selectedServiceId
            ? {
                ...service,
                name: formData.name || "Updated Service",
                description: formData.description || service.description,
                duration: formattedDuration,
                price: normalizedPrice,
                quantity: normalizedQuantity,
              }
            : service
        )
      );
    } else {
      const nextId = `S-${String(services.length + 1).padStart(2, "0")}`;
      setServices((prev) => [
        {
          id: nextId,
          name: formData.name || "New Service",
          description: formData.description || "Service description",
          duration: formattedDuration,
          price: normalizedPrice,
          quantity: normalizedQuantity,
          active: true,
        },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
    handleReset();
  };

  const openAddService = () => {
    handleReset();
    setIsModalOpen(true);
  };

  const openEditService = (service) => {
    const [valuePart = "1", unitPart = "hours"] = (service.duration || "1 hours").split(" ");
    setSelectedServiceId(service.id);
    setFormData((prev) => ({
      ...prev,
      name: service.name,
      description: service.description || "",
      price: String(service.price || "0.00"),
      quantity: String(service.quantity || "1"),
      durationValue: valuePart,
      durationUnit: unitPart,
    }));
    setIsModalOpen(true);
  };

  const requestDeleteService = (service) => {
    setDeleteTarget(service);
    setIsModalOpen(false);
  };

  const handleDeleteService = (serviceId) => {
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
    setDeleteTarget(null);
    handleReset();
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Services</p>
          <h1 className="admin-title">Active services</h1>
          <p className="admin-subtitle">
            Services currently available for booking.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button
            className="admin-btn admin-btn--primary"
            type="button"
            onClick={openAddService}
          >
            Add service
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Service List</h2>
          <span className="admin-muted">{activeServices.length} active</span>
        </div>
        <div className="admin-service-table">
          <div className="admin-service-row admin-service-row--head">
            <span>Name</span>
            <span>Price</span>
            <span>Quantity</span>
          </div>
          {activeServices.map((service) => (
            <button
              type="button"
              className="admin-service-row"
              key={service.id}
              onClick={() => openEditService(service)}
            >
              <span className="admin-strong">{service.name}</span>
              <span className="admin-muted">${Number(service.price || 0).toFixed(2)}</span>
              <span className="admin-muted">{service.quantity}</span>
            </button>
          ))}
        </div>
      </section>

      {isModalOpen ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            className="admin-modal__backdrop"
            type="button"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close add service form"
          />
          <form className="admin-modal__content" onSubmit={handleSubmit}>
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Service setup</p>
                <h2 className="admin-title">
                  {selectedServiceId ? "Edit service" : "Add a new service"}
                </h2>
                <p className="admin-subtitle">
                  Set the service details, price, quantity, and duration.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleReset();
                }}
              >
                Close
              </button>
            </div>

            <div className="admin-form">
              <label className="admin-field admin-field--full">
                <span className="admin-label">Name</span>
                <input
                  className="admin-input"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Lawn sprinkler repairs"
                  required
                />
              </label>

              <label className="admin-field admin-field--full">
                <span className="admin-label">Description</span>
                <textarea
                  className="admin-textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Overview of the service, what is included, and how it helps the client."
                  rows={4}
                />
              </label>

              <div className="admin-form__row admin-form__row--price admin-field--full">
                <label className="admin-field">
                  <span className="admin-label">Price ($)</span>
                  <input
                    className="admin-input"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-label">Quantity</span>
                  <input
                    className="admin-input"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    type="number"
                    step="1"
                    min="1"
                  />
                </label>
              </div>

              <label className="admin-field admin-field--full">
                <span className="admin-label">Service duration</span>
                <div className="admin-form__row admin-form__row--two">
                  <select
                    className="admin-input"
                    name="durationValue"
                    value={formData.durationValue}
                    onChange={handleFormChange}
                  >
                    {formData.durationUnit === "minutes" &&
                      Array.from({ length: 12 }, (_, index) => (index + 1) * 5).map(
                        (value) => (
                          <option key={`min-${value}`} value={String(value)}>
                            {value}
                          </option>
                        )
                      )}
                    {formData.durationUnit === "hours" &&
                      Array.from({ length: 12 }, (_, index) => index + 1).map(
                        (value) => (
                          <option key={`hour-${value}`} value={String(value)}>
                            {value}
                          </option>
                        )
                      )}
                    {formData.durationUnit === "days" &&
                      Array.from({ length: 14 }, (_, index) => index + 1).map(
                        (value) => (
                          <option key={`day-${value}`} value={String(value)}>
                            {value}
                          </option>
                        )
                      )}
                  </select>
                  <select
                    className="admin-input"
                    name="durationUnit"
                    value={formData.durationUnit}
                    onChange={handleFormChange}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </label>
            </div>

            <div className="admin-modal__actions">
              <div className="admin-modal__actions-left">
                {selectedServiceId ? (
                  <button
                    className="admin-btn admin-btn--danger"
                    type="button"
                    onClick={() =>
                      requestDeleteService(
                        services.find((service) => service.id === selectedServiceId)
                      )
                    }
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <div className="admin-modal__actions-right">
                <button
                  className="admin-btn admin-btn--ghost"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleReset();
                  }}
                >
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit">
                  {selectedServiceId ? "Save changes" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close delete confirmation"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Delete Service</p>
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  This will permanently delete {deleteTarget.name}.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--danger"
                type="button"
                onClick={() => handleDeleteService(deleteTarget.id)}
              >
                Yes, delete it
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Keep service
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
