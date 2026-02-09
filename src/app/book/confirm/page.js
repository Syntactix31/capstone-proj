"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NavBar from "../../components/Navbar";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1–2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3–5 days" },
  { id: "pergola", name: "Pergola", duration: "1–3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2–6 hrs" },
];

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const serviceId = searchParams.get("service");
  const day = searchParams.get("day");
  const time = searchParams.get("time");
  const firstName = searchParams.get("firstName") || "";

  const service = useMemo(
    () => SERVICE_OPTIONS.find((s) => s.id === serviceId) || null,
    [serviceId]
  );

  //*TEMPORARY UNTIL WE GET BACKEND CALENDAR*//
  const formattedDay = day ? `Oct ${day}, 2026` : "Date not set";
  const formattedTime = time || "Time not set";

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <main className="confirm-page">
        <h1 className="confirm-title">Thank you for booking with us</h1>
        <p className="confirm-subtitle">
          {firstName ? `${firstName}, your appointment request has been sent.` : "Your appointment request has been sent."}
        </p>

        <section className="confirm-card">

          <div className="confirm-with">
            <div className="confirm-with-label">Scheduled with</div>
            <div className="confirm-with-name">Landscape Craftsmen</div>
          </div>

          <div className="confirm-divider" />

          <div className="confirm-info">
            <div className="confirm-date">{formattedDay}</div>
            <div className="confirm-time">{formattedTime}</div>
          </div>

          <div className="confirm-service">
            {service ? service.name : "Selected service"}
          </div>

          <div className="confirm-actions">
            <button
              type="button"
              className="confirm-primary"
              onClick={() =>
                router.push(
                  `/book/time?service=${encodeURIComponent(serviceId || "")}`
                )
              }
            >
              Reschedule booking
            </button>

            <button
              type="button"
              className="confirm-secondary"
              onClick={() => alert("Cancellation flow not implemented yet.")}
            >
              Cancel booking
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
