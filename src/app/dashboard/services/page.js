"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

// Admin UI for managing service cards/details.
export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    let active = true;

    async function loadServices() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/services", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setServices([]);
          setError(data?.error || "Failed to load services.");
          return;
        }

        setServices(Array.isArray(data.services) ? data.services : []);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setServices([]);
        setError("Failed to load services.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadServices();
    return () => {
      active = false;
    };
  }, []);

  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );

  const serviceFormTotal = useMemo(() => {
    const price = Number.parseFloat(formData.price || "0") || 0;
    const quantity = Math.max(1, Number.parseInt(formData.quantity || "1", 10) || 1);
    return (price * quantity).toFixed(2);
  }, [formData.price, formData.quantity]);

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
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    const formattedDuration = `${formData.durationValue} ${formData.durationUnit}`;
    const normalizedPrice = (
      Number.parseFloat(formData.price || "0") || 0
    ).toFixed(2);
    const normalizedQuantity = String(
      Math.max(1, Number.parseInt(formData.quantity || "1", 10) || 1)
    );

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/services", {
        method: selectedServiceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedServiceId || undefined,
          name: formData.name || "New Service",
          description: formData.description || "Service description",
          durationValue: formData.durationValue,
          durationUnit: formData.durationUnit,
          price: normalizedPrice,
          quantity: normalizedQuantity,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to save service.");
        return;
      }

      setServices((prev) => {
        const nextService = data.service;
        if (!nextService) return prev;
        if (selectedServiceId) {
          return prev.map((service) => (service.id === selectedServiceId ? nextService : service));
        }
        return [nextService, ...prev];
      });
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save service.");
      return;
    } finally {
      setBusy(false);
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

  const handleDeleteService = async (serviceId) => {
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/services?id=${encodeURIComponent(serviceId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to delete service.");
        return;
      }

      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      setDeleteTarget(null);
      handleReset();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Failed to delete service.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Active services</h1>
          <p className="admin-subtitle">
            Services currently available for booking.
          </p>
          {error ? <p className="admin-error">{error}</p> : null}
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
            <span>Price / Qty</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>
          {loading ? <p className="admin-muted">Loading services...</p> : null}
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
              <span className="admin-muted">
                $
                {(
                  (Number.parseFloat(service.price || "0") || 0) *
                  (Math.max(1, Number.parseInt(service.quantity || "1", 10) || 1))
                ).toFixed(2)}
              </span>
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
                disabled={busy}
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
                  disabled={busy}
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
                  disabled={busy}
                />
              </label>

              <div className="admin-form__row admin-form__row--price admin-field--full">
                <label className="admin-field">
                  <span className="admin-label">Price per quantity ($)</span>
                  <input
                    className="admin-input"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={busy}
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
                    disabled={busy}
                  />
                </label>
              </div>

              <label className="admin-field admin-field--full">
                <span className="admin-label">Calculated total</span>
                <input
                  className="admin-input"
                  value={`$${serviceFormTotal}`}
                  disabled
                  readOnly
                />
              </label>

              <label className="admin-field admin-field--full">
                <span className="admin-label">Service duration</span>
                <div className="admin-form__row admin-form__row--two">
                  <select
                    className="admin-input"
                    name="durationValue"
                    value={formData.durationValue}
                    onChange={handleFormChange}
                    disabled={busy}
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
                    disabled={busy}
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
                    disabled={busy}
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
                  disabled={busy}
                >
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
                  {busy ? "Saving..." : selectedServiceId ? "Save changes" : "Create"}
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
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  This will permanently delete {deleteTarget.name}.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setDeleteTarget(null)}
                type="button"
                disabled={busy}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--danger"
                type="button"
                onClick={() => handleDeleteService(deleteTarget.id)}
                disabled={busy}
              >
                {busy ? "Deleting..." : "Yes, delete it"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={busy}
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
