"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "../../components/Navbar.js";
import Footer from "../../components/Footer.js";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

function formatPrettyDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function DetailsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const servicesParam = params.get("service") || "";
  const servicesArray = servicesParam.split(",").filter(Boolean);
  const selectedServices = servicesArray
    .map(id => SERVICE_OPTIONS.find(s => s.id === id))
    .filter(Boolean);

  const date = params.get("date") || "";
  const time = params.get("time") || "";

  const backHref = `/book/time?service=${encodeURIComponent(servicesParam)}`;

  const displayTime = (() => {
    if (!date || !time) return "No time selected";
    const pretty = formatPrettyDate(date);
    return `${pretty}, at ${time}`;
  })();

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(
          data?.error ||
            "This time slot was just booked. Please choose another time."
        );
        return;
      }

      const queryObj = {
        ...payload,
        eventId: data.eventId || "",
      };

      // Might be dead code comment out if u don't need ts
      const query = new URLSearchParams(queryObj).toString();

      router.push(
        `/book/confirm?service=${encodeURIComponent(servicesParam)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&eventId=${encodeURIComponent(data.eventId)}&firstName=${encodeURIComponent(payload.firstName || '')}&status=confirmed`
      );


    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <div className="booking-page">
        <main className="booking-layout">
          <section className="booking-left">
            <Link href={backHref} className="back-button">
              ← Back
            </Link>

            <div className="summary-card">
              <div className="summary-card-header">
                <div>
                  <div className="summary-card-label">Services</div>
                  <div className="summary-card-title">
                    {selectedServices.length > 0 
                      ? selectedServices.map(s => s.name).join(', ')
                      : "Not selected"
                    }
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="summary-card-sub">
                      {selectedServices.map(s => `${s.name}: ${s.duration}`).join('; ')}
                    </div>
                  )}
                </div>
                <Link href="/book" className="summary-card-edit">
                  Edit
                </Link>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <div>
                  <div className="summary-card-label">Appointment time</div>
                  <div className="summary-card-title">{displayTime}</div>
                </div>
                <Link
                  href={servicesParam
                    ? `/book/time?service=${encodeURIComponent(servicesParam)}`
                    : "/book/time"
                  }
                  className="summary-card-edit"
                >
                  Edit
                </Link>
              </div>
            </div>

            <div className="step-card step-card--active">
              <div className="step-card-header">
                <h2 className="step-card-title">Enter your details</h2>
                <span className="step-card-status">Current step</span>
              </div>
              <p className="step-card-text">
                Add your contact info so we can confirm your appointment and send updates.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card-header">
                <h2 className="step-card-title">Note:</h2>
              </div>
              <p className="step-card-text">
                We are Calgary based only, any other provided address will void the appointment.
              </p>
            </div>
          </section>

          <section className="booking-right">
            <h1 className="details-title">Enter your details</h1>

            <form className="details-form" onSubmit={handleSubmit}>
              <input type="hidden" name="service" value={servicesParam} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={time} />

              <div className="details-row">
                <div className="details-field">
                  <label className="details-label" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="details-input"
                    required
                  />
                </div>

                <div className="details-field">
                  <label className="details-label" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="details-input"
                    required
                  />
                </div>
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="details-input"
                  required
                />
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="details-input"
                  required
                />
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="notes">
                  Appointment notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="details-textarea"
                  rows={5}
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
      <Footer />
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense fallback={<div>Loading booking details...</div>}>
      <DetailsContent />
    </Suspense>
  );
}