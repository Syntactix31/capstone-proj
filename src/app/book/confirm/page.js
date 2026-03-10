"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

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

  const onCancel = async () => {
    if (!eventId) {
      alert("Missing eventId.");
      return;
    }

    const ok = window.confirm("Are you sure you want to cancel this appointment?");
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Could not cancel. Try again.");
        setBusy(false);
        return;
      }

      alert("Your appointment has been cancelled.");
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("Could not cancel. Try again.");
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
              onClick={onCancel}
              disabled={busy || !eventId}
              title={!eventId ? "Missing event id" : ""}
            >
              {busy ? "Cancelling..." : "Cancel booking"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <ConfirmInner />
    </Suspense>
  );
}

