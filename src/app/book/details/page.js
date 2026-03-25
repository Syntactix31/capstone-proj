"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "../../components/Navbar.js";
import Footer from "../../components/Footer.js";

const BOOKING_FIELD_LIMITS = {
  name: 30,
  email: 120,
  address: 120,
  notes: 1000,
};

// Services that can be attached to a booking.
const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

// Format the selected date so the summary card is easier to read.
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

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value));
}

function formatPhoneDisplay(value) {
  const digits = normalizePhone(value);
  if (digits.length !== 10) return "";
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Collect the user's personal/job-site details before creating the booking.
function DetailsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const phoneDisplayValue = phoneFocused
    ? phone
    : isValidPhone(phone)
      ? formatPhoneDisplay(phone)
      : phone;
  const showPhoneError = submitAttempted && !isValidPhone(phone);

  const servicesParam = params.get("service") || "";
  const servicesArray = servicesParam.split(",").filter(Boolean);
  const selectedServices = servicesArray
    .map(id => SERVICE_OPTIONS.find(s => s.id === id))
    .filter(Boolean);

  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const durationHours = params.get("durationHours") || "1";

  const backHref = `/book/time?service=${encodeURIComponent(servicesParam)}&durationHours=${encodeURIComponent(durationHours)}`;

  const displayTime = (() => {
    if (!date || !time) return "No time selected";
    const pretty = formatPrettyDate(date);
    return `${pretty}, at ${time}`;
  })();

  // Send the selected service/date/time plus the form fields to the booking API.
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    const normalizedPhone = normalizePhone(phone);

    if (!isValidPhone(normalizedPhone)) {
      return;
    }

    payload.phone = normalizedPhone;

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
                    ? `/book/time?service=${encodeURIComponent(servicesParam)}&durationHours=${encodeURIComponent(durationHours)}`
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
              <input type="hidden" name="durationHours" value={durationHours} />

              <div className="details-row">
                <div className="details-field">
                  <label className="details-label" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    maxLength={BOOKING_FIELD_LIMITS.name}
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
                    maxLength={BOOKING_FIELD_LIMITS.name}
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
                  maxLength={BOOKING_FIELD_LIMITS.email}
                  name="email"
                  type="email"
                  className="details-input"
                  required
                />
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  className="details-input"
                  value={phoneDisplayValue}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  onChange={(event) =>
                    setPhone(normalizePhone(event.target.value).slice(0, 10))
                  }
                  required
                />
                {showPhoneError ? (
                  <p className="admin-error">Enter a 10-digit phone number.</p>
                ) : null}
              </div>

              <div className="details-field">
                <label className="details-label" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  maxLength={BOOKING_FIELD_LIMITS.address}
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
                  maxLength={BOOKING_FIELD_LIMITS.notes}
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

// Wrap the page in Suspense because it reads search params on the client.
export default function DetailsPage() {
  return (
    <Suspense fallback={<div>Loading booking details...</div>}>
      <DetailsContent />
    </Suspense>
  );
}
