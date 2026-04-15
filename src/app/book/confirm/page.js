"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Services that can be attached to a booking.
const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

// Format the final booked day for the confirmation screen.
function prettyDay(dateStr) {
  if (!dateStr) return "Date not set";
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

// Final booking screen that also allows cancel/reschedule actions.
function ConfirmInner() {
  const params = useSearchParams();
  const router = useRouter();

  const serviceParam = params.get("service") || "";
  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const firstName = params.get("firstName") || "";
  const eventId = params.get("eventId") || "";
  const status = params.get("status") || "";

  const serviceIds = useMemo(
    () => serviceParam.split(",").filter(Boolean),
    [serviceParam]
  );

  const services = useMemo(
    () =>
      serviceIds
        .map(id => SERVICE_OPTIONS.find(s => s.id === id))
        .filter(Boolean),
    [serviceIds]
  );


  const [busy, setBusy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Let the customer cancel the booking from the confirmation page.
  const onCancel = async () => {
    if (!eventId) {
      setErrorMessage("Missing eventId.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data?.error || "Could not cancel. Try again.");
        return;
      }

      setShowCancelModal(false);
      router.push("/");
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not cancel. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const rescheduleHref = serviceParam && eventId
    ? `/book/time?service=${encodeURIComponent(serviceParam)}&mode=reschedule&eventId=${encodeURIComponent(eventId)}`
    : "/book/time";


  return (
    <div>
      <header>
        <NavBar />
      </header>

      <main className="confirm-page">
        <h1 className="confirm-title">
          {status === "rescheduled" ? "Your appointment was rescheduled" : "Thank you for booking with us"}
        </h1>

        <p className="confirm-subtitle">
          {firstName
            ? `${firstName}, your appointment is confirmed.`
            : "Your appointment is confirmed."}
        </p>
        {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}

        <section className="confirm-card">
          <div className="confirm-with">
            <div className="confirm-with-label">Scheduled with</div>
            <div className="confirm-with-name">Landscape Craftsmen</div>
          </div>

          <div className="confirm-divider" />

          <div className="confirm-info">
            <div className="confirm-date">{prettyDay(date)}</div>
            <div className="confirm-time">{time || "Time not set"}</div>
          </div>

          <div className="confirm-service">
            {services.length > 0
              ? services.map(s => s.name).join(", ")
              : "Selected service(s)"}
          </div>


          <div className="confirm-actions">
            <Link href={rescheduleHref} className="confirm-primary">
              Reschedule booking
            </Link>

            <button
              type="button"
              className="confirm-secondary"
              onClick={() => setShowCancelModal(true)}
              disabled={busy || !eventId}
              title={!eventId ? "Missing event id" : ""}
            >
              {busy ? "Cancelling..." : "Cancel booking"}
            </button>
          </div>
        </section>
      </main>

      {showCancelModal ? (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => {
              if (busy) return;
              setShowCancelModal(false);
            }}
            aria-label="Close cancel confirmation"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  This will cancel your appointment.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setShowCancelModal(false)}
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
                onClick={onCancel}
                disabled={busy}
              >
                {busy ? "Cancelling..." : "Yes, cancel it"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={busy}
              >
                Keep appointment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

// Wrap the page in Suspense because it reads search params on the client.
export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <ConfirmInner />
    </Suspense>
  );
}

