"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavBar from "../../components/Navbar.js";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1–2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3–5 days" },
  { id: "pergola", name: "Pergola", duration: "1–3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2–6 hrs" },
];

export default function DetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("service");
  const day = searchParams.get("day");
  const time = searchParams.get("time");

  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((s) => s.id === serviceId) || null,
    [serviceId]
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    notes: "",
  });

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.firstName || !form.email) {
      alert("Please enter at least your first name and email.");
      return;
    }

    /*TEMPORARY PLACEHOLDER UNTIL WE GET DATABASE ACCESS OR CALENDAR INTEGRATIONS*/
    console.log("BOOK APPOINTMENT:", {
      serviceId,
      day,
      time,
      ...form,
    });

    alert("Appointment request submitted! (Check console for payload.)");
  };

  return (
    <div>
        <header>
            < NavBar />
        </header>
        <div className="booking-page">
          <main className="booking-layout">
        {/* LEFT COLUMN – summary cards */}
        <section className="booking-left">
          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          {/* Service summary */}
          <div className="summary-card">
            <div className="summary-card-header">
              <div>
                <div className="summary-card-label">Services</div>
                <div className="summary-card-title">
                  {selectedService ? selectedService.name : "Not selected"}
                </div>
                {selectedService && (
                  <div className="summary-card-sub">
                    {selectedService.duration}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="summary-card-edit"
                onClick={() => router.push("/book")}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Appointment time summary */}
          <div className="summary-card">
            <div className="summary-card-header">
              <div>
                <div className="summary-card-label">Appointment time</div>
                <div className="summary-card-title">
                {/*TEMPORARY PLACEHOLDER ,, need to change for when we get calendar integration*/}
                  {day && time
                    ? `Oct ${day}, at ${time}`
                    : "No time selected"
                  }
                </div>
              </div>
              <button
                type="button"
                className="summary-card-edit"
                onClick={() =>
                  router.push(
                    `/book/time?service=${encodeURIComponent(serviceId || "")}`
                  )
                }
              >
                Edit
              </button>
            </div>
          </div>

          {/* step */}
          <div className="step-card step-card--active">
            <div className="step-card-header">
              <h2 className="step-card-title">Enter your details</h2>
              <span className="step-card-status">Current step</span>
            </div>
            <p className="step-card-text">
              Add your contact info so we can confirm your appointment and send
              updates.
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN – contact form */}
        <section className="booking-right">
          <h1 className="details-title">Enter your details</h1>

          <form className="details-form" onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="details-row">
              <div className="details-field">
                <label className="details-label" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="details-input"
                  value={form.firstName}
                  onChange={update("firstName")}
                  required
                />
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="details-input"
                  value={form.lastName}
                  onChange={update("lastName")}
                />
              </div>
            </div>

            {/* Email */}
            <div className="details-field">
              <label className="details-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="details-input"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>

            {/* Notes */}
            <div className="details-field">
              <label className="details-label" htmlFor="notes">
                Appointment notes (optional)
              </label>
              <textarea
                id="notes"
                className="details-textarea"
                rows={5}
                value={form.notes}
                onChange={update("notes")}
                placeholder="Anything we should know? Access details, project notes, measurements, etc."
              />
            </div>

            <button type="submit" className="details-submit">
              Book appointment
            </button>
          </form>
        </section>
      </main>
    </div>
    </div>
  );
}
