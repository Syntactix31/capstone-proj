"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout.js";

// still need database implementation
const SERVICES = [
  {
    id: "S-01",
    name: "Fence Installation",
    duration: "1-2 days",
    price: "$2,800+",
    active: true,
  },
  {
    id: "S-02",
    name: "Deck & Railing",
    duration: "3-5 days",
    price: "$4,500+",
    active: true,
  },
  {
    id: "S-03",
    name: "Pergola",
    duration: "1-3 days",
    price: "$3,200+",
    active: true,
  },
  {
    id: "S-04",
    name: "Sod Installation",
    duration: "1 day",
    price: "$1,100+",
    active: true,
  },
  {
    id: "S-05",
    name: "Trees and Shrubs",
    duration: "1 day",
    price: "$1,100+",
    active: true,
  },
];

// status class
const STATUS_CLASS = {
  Confirmed: "admin-badge admin-badge--active",
  Active: "admin-badge admin-badge--active",
};

/*
phone input field formatting
*/
function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, ""); // input field, takes only digits, removes any spaces
  if (digits.length !== 10) return phone || "No phone";
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function to24h(time12h) {
  const match = String(time12h || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hour === 12) hour = 0;
  if (meridiem === "PM") hour += 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getAppointmentDate(appointment) {
  const isoDate = new Date(appointment?.startIso || "");
  if (!Number.isNaN(isoDate.getTime())) return isoDate;

  const time24 = to24h(appointment?.time);
  if (!appointment?.date || !time24) return null;

  const fallbackDate = new Date(`${appointment.date}T${time24}:00`);
  if (Number.isNaN(fallbackDate.getTime())) return null;
  return fallbackDate;
}

function getDateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      month: "TBD",
      day: "--",
      weekday: "Date unavailable",
      full: "Date unavailable",
    };
  }

  return {
    month: date.toLocaleString([], { month: "short" }).toUpperCase(),
    day: date.toLocaleString([], { day: "2-digit" }),
    weekday: date.toLocaleString([], { weekday: "long" }),
    full: date.toLocaleString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export default function DashboardPage() {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState("");
    const [activeClient, setActiveClient] = useState(null);
    const [now, setNow] = useState(() => new Date());

    // Jiro 
    // Load the dashboard summary data from the protected overview route.
    useEffect(() => {
      let alive = true;

      async function loadOverview() {
        try {
          const res = await fetch("/api/admin/overview", { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          if (!alive) return;

          if (!res.ok) {
            setError(data?.error || "Failed to load dashboard data.");
            return;
          }

          setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
          setClients(Array.isArray(data.clients) ? data.clients : []);
        } catch (loadError) {
          console.error(loadError);
          if (!alive) return;
          setError("Failed to load dashboard data.");
        }
      }

      loadOverview();
      return () => {
        alive = false;
      };
    }, []);

    useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60 * 1000);
      return () => clearInterval(interval);
    }, []);

    const confirmedCount = appointments.filter((appt) => appt.status === "Confirmed").length;
    const activeServices = SERVICES.filter((service) => service.active).length;
    const activeClients = clients.length;
    const nextAppointment = useMemo(
      () =>
        appointments
          .filter((appt) => appt.status === "Confirmed")
          .map((appt) => ({
            ...appt,
            appointmentDate: getAppointmentDate(appt),
          }))
          .filter((appt) => appt.appointmentDate && appt.appointmentDate.getTime() >= now.getTime())
          .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())[0] || null,
      [appointments, now]
    );
    const nextAppointmentDateParts = useMemo(
      () => getDateParts(nextAppointment?.appointmentDate || nextAppointment?.startIso || `${nextAppointment?.date || ""}T00:00:00`),
      [nextAppointment]
    );
    const recentClients = clients.slice(0, 5);
    const closeClientProfile = () => setActiveClient(null);
    
  return (
    <AdminLayout>
          {/*hero card*/}
            <section className="admin-hero">
            <div>
              <p className="admin-kicker">Admin Dashboard</p>
              <h1 className="admin-title">
                Your job overview
              </h1>
              <p className="admin-subtitle">
                A quick overview check across appointments, services, and
                customers.
              </p>
              {error ? <p className="admin-error">{error}</p> : null}
            </div>
          </section>
          {/*summary grid*/}
          <section className="admin-summary-grid">
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Total appointments</div>
              <div className="admin-stat-value">{appointments.length}</div>
              <span className={STATUS_CLASS.Confirmed}>
                {confirmedCount} Confirmed
              </span>
            </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Active services</div>
              <div className="admin-stat-value">{activeServices}</div>
            </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Active clients</div>
              <div className="admin-stat-value">{activeClients}</div>
            </article>
          </section>

          <section className="admin-grid">
            {/*next appointmet*/}
            <article className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Next Appointment</h2>
              <Link className="admin-link" href="/dashboard/appointments">
                Open schedule
              </Link>
            </div>
            {nextAppointment ? (
              <div className="dashboard-next-card">
                <div className="dashboard-next-card__hero">
                  <div className="dashboard-next-card__date-tile">
                    <span className="dashboard-next-card__date-month">
                      {nextAppointmentDateParts.month}
                    </span>
                    <span className="dashboard-next-card__date-day">
                      {nextAppointmentDateParts.day}
                    </span>
                  </div>

                  <div className="dashboard-next-card__hero-copy">
                    <p className="dashboard-next-card__eyebrow">Confirmed appointment</p>
                    <h3 className="dashboard-next-card__client">{nextAppointment.client}</h3>
                    <p className="dashboard-next-card__service">{nextAppointment.service}</p>
                  </div>

                  <span className={STATUS_CLASS.Confirmed}>Scheduled</span>
                </div>

                <div className="dashboard-next-card__details">
                  <div className="dashboard-next-card__detail">
                    <span className="dashboard-next-card__label">Day</span>
                    <span className="dashboard-next-card__value">
                      {nextAppointmentDateParts.weekday}
                    </span>
                  </div>
                  <div className="dashboard-next-card__detail">
                    <span className="dashboard-next-card__label">Date</span>
                    <span className="dashboard-next-card__value">
                      {nextAppointmentDateParts.full}
                    </span>
                  </div>
                  <div className="dashboard-next-card__detail">
                    <span className="dashboard-next-card__label">Time</span>
                    <span className="dashboard-next-card__value">{nextAppointment.time}</span>
                  </div>
                </div>

                <div className="dashboard-next-card__footer">
                  <div className="dashboard-next-card__location">
                    <span className="dashboard-next-card__label">Location</span>
                    <span className="dashboard-next-card__address">
                      {nextAppointment.address || "Address not added yet"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="admin-muted">No upcoming appointments.</p>
            )}
          </article>
          {/*Services overivew*/}
          <article className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Services Overview</h2>
              <Link className="admin-link" href="/dashboard/services">
                Manage services
              </Link>
            </div>
            <div className="admin-list">
              {SERVICES.map((service) => (
                <div className="admin-list-row" key={service.id}>
                  <div>
                    <div className="admin-strong">{service.name}</div>
                    <div className="admin-muted">
                      {service.duration} - {service.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
          {/*Client Overiew*/}
          <article className="admin-card admin-card--full">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Clients</h2>
              <Link className="admin-link" href="/dashboard/clients">
                View clients
              </Link>
            </div>

            <div className="admin-table">
              <div className="admin-table-row admin-table-head">
                <div>Client</div>
                <div>Contact</div>
                <div>Last Visit</div>
                <div>Lifetime Value</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {recentClients.map((client) => (
                <div className="admin-table-row" key={client.id}>
                  <div>
                    <div className="admin-strong">{client.name}</div>
                    <div className="admin-muted">{client.id}</div>
                  </div>
                  <div>
                    <div>{client.email}</div>
                    <div className="admin-muted">{formatPhone(client.phone)}</div>
                  </div>
                  <div>{client.updatedAt ? client.updatedAt.slice(0, 10) : "N/A"}</div>
                  <div>N/A</div>
                  <div>
                    <span className={STATUS_CLASS.Active}>
                      Active
                    </span>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="admin-btn admin-btn--small"
                      type="button"
                      onClick={() => setActiveClient(client)}
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!recentClients.length ? (
              <p className="admin-muted">No clients available yet.</p>
            ) : null}
          </article>
          </section>
          {activeClient ? (
            <div className="admin-modal">
              <button
                className="admin-modal__backdrop"
                onClick={closeClientProfile}
                aria-label="Close client profile"
                type="button"
              />
              <div className="admin-modal__content" role="dialog" aria-modal="true">
                <div className="admin-modal__header">
                  <div>
                    <p className="admin-kicker">Client Profile</p>
                    <h2 className="admin-title">{activeClient.name || "Client"}</h2>
                    <p className="admin-subtitle">{activeClient.id}</p>
                  </div>
                  <button
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    onClick={closeClientProfile}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="admin-modal__grid">
                  <div>
                    <div className="admin-muted">Email</div>
                    <div className="admin-strong">{activeClient.email || "—"}</div>
                  </div>
                  <div>
                    <div className="admin-muted">Phone</div>
                    <div className="admin-strong">{formatPhone(activeClient.phone)}</div>
                  </div>
                  <div>
                    <div className="admin-muted">Last Visit</div>
                    <div className="admin-strong">
                      {activeClient.updatedAt ? activeClient.updatedAt.slice(0, 10) : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="admin-muted">Status</div>
                    <span className={STATUS_CLASS.Active}>Active</span>
                  </div>
                  <div className="admin-modal__full">
                    <div className="admin-muted">Address</div>
                    <div className="admin-strong">{activeClient.address || "—"}</div>
                  </div>
                  <div>
                    <div className="admin-muted">City</div>
                    <div className="admin-strong">{activeClient.city || "—"}</div>
                  </div>
                  <div>
                    <div className="admin-muted">Province</div>
                    <div className="admin-strong">{activeClient.province || "—"}</div>
                  </div>
                  <div>
                    <div className="admin-muted">Property Type</div>
                    <div className="admin-strong">{activeClient.propertyType || "—"}</div>
                  </div>
                  <div className="admin-modal__full">
                    <div className="admin-muted">Notes</div>
                    <div className="admin-strong">{activeClient.notes || "—"}</div>
                  </div>
                  <div className="admin-modal__full">
                    <div className="admin-muted">Additional Instructions</div>
                    <div className="admin-strong">{activeClient.additionalInstructions || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
    </AdminLayout>
  );
}

