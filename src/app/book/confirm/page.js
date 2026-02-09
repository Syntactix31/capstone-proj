import Link from "next/link";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

export default function ConfirmPage({ searchParams }) {
  const serviceId = searchParams?.service ?? "";
  const day = searchParams?.day ?? "";
  const time = searchParams?.time ?? "";
  const firstName = searchParams?.firstName ?? "";

  const service =
    SERVICE_OPTIONS.find((s) => s.id === serviceId) || null;

  // *TEMPORARY UNTIL WE GET BACKEND CALENDAR*
  const formattedDay = day ? `Oct ${day}, 2026` : "Date not set";
  const formattedTime = time || "Time not set";

  const rescheduleHref = serviceId
    ? `/book/time?service=${encodeURIComponent(serviceId)}`
    : "/book";

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <main className="confirm-page">
        <h1 className="confirm-title">Thank you for booking with us</h1>
        <p className="confirm-subtitle">
          {firstName
            ? `${firstName}, your appointment request has been sent.`
            : "Your appointment request has been sent."}
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
            {/* Reschedule but not really a functional rescheduler until we have active database*/}
            <Link href={rescheduleHref} className="confirm-primary">
              Reschedule booking
            </Link>

            {/* Placeholder cancel button for now */}
            <button
              type="button"
              className="confirm-secondary"
              disabled
              title="Cancellation flow coming soon"
            >
              Cancel booking
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
