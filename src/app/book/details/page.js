import Link from "next/link";
import NavBar from "../../components/Navbar.js";
import Footer from "../../components/Footer.js";

const SERVICE_OPTIONS = [
  { id: "fence", name: "Fence Installation", duration: "1-2 days" },
  { id: "deck-railing", name: "Deck & Railing", duration: "3-5 days" },
  { id: "pergola", name: "Pergola", duration: "1-3 days" },
  { id: "sod", name: "Sod Installation", duration: "1 day" },
  { id: "trees-shrubs", name: "Trees & Shrubs", duration: "2-6 hrs" },
];

export default function DetailsPage({ searchParams }) {
  const serviceId = searchParams?.service ?? "";
  const day = searchParams?.day ?? "";
  const time = searchParams?.time ?? "";

  const selectedService =
    SERVICE_OPTIONS.find((s) => s.id === serviceId) || null;

  const backHref = `/book/time?service=${encodeURIComponent(serviceId || "")}`;


  const displayTime =
    day && time ? `Oct ${day}, at ${time}` : "No time selected";

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <div className="booking-page">
        <main className="booking-layout">
          {/* LEFT COLUMN – summary cards */}
          <section className="booking-left">
            <Link href={backHref} className="back-button">
              ← Back
            </Link>

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
                <Link href="/book" className="summary-card-edit">
                  Edit
                </Link>
              </div>
            </div>

            {/* Appointment time summary */}
            <div className="summary-card">
              <div className="summary-card-header">
                <div>
                  <div className="summary-card-label">Appointment time</div>
                  <div className="summary-card-title">{displayTime}</div>
                </div>
                <Link
                  href={
                    serviceId
                      ? `/book/time?service=${encodeURIComponent(serviceId)}`
                      : "/book/time"
                  }
                  className="summary-card-edit"
                >
                  Edit
                </Link>
              </div>
            </div>

            {/* Step indicator */}
            <div className="step-card step-card--active">
              <div className="step-card-header">
                <h2 className="step-card-title">Enter your details</h2>
                <span className="step-card-status">Current step</span>
              </div>
              <p className="step-card-text">
                Add your contact info so we can confirm your appointment and
                send updates.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card-header">
                <h2 className="step-card-title">Note:</h2>
              </div>
              <p className="step-card-text">
                We are Calgary based only, any other provided address will void
                the appointment.
              </p>
            </div>
          </section>

          {/* RIGHT COLUMN – contact form */}
          <section className="booking-right">
            <h1 className="details-title">Enter your details</h1>

            {/* Native form submit to /book/confirm */}
            <form
              className="details-form"
              action="/book/confirm"
              method="GET"
            >
              {/* preserve selection in the URL */}
              <input type="hidden" name="service" value={serviceId} />
              <input type="hidden" name="day" value={day} />
              <input type="hidden" name="time" value={time} />

              {/* Name row */}
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
                  name="email"
                  type="email"
                  className="details-input"
                  required
                />
              </div>

              {/* Address */}
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

              {/* Notes */}
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
