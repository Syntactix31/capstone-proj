"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout.js";

const SERVICES = [
  { id: "fence", name: "Fence Installation", active: true },
  { id: "deck-railing", name: "Deck & Railing", active: true },
  { id: "pergola", name: "Pergola", active: true },
  { id: "sod", name: "Sod Installation", active: false },
  { id: "trees-shrubs", name: "Trees and Shrubs", active: true },
];

const STATUS_CLASS = {
  Pending: "admin-badge admin-badge--pending",
  Confirmed: "admin-badge admin-badge--active",
  Canceled: "admin-badge admin-badge--muted",
};

function prettyServiceName(serviceIdOrName) {
  const hit =
    SERVICES.find((s) => s.id === serviceIdOrName) ||
    SERVICES.find((s) => s.name === serviceIdOrName);
  return hit?.name || String(serviceIdOrName || "Appointment");
}

function to24h(time12h) {
  // "9:30 AM" -> "09:30"
  const m = String(time12h || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "";
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const mer = m[3].toUpperCase();
  if (hh === 12) hh = 0;
  if (mer === "PM") hh += 12;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function to12h(time24) {
  // "14:30" -> "2:30 PM"
  const [hhRaw, mmRaw] = String(time24 || "").split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "";
  const mer = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${mer}`;
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]); // from Google Calendar
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailSource, setDetailSource] = useState(null);

  const [viewMode, setViewMode] = useState("week");
  const [now, setNow] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    service: "fence",
    date: "",
    time: "09:00 AM",
    address: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSource, setCancelSource] = useState(null);

  const calendarScrollRef = useRef(null);

  // Pull from Google Calendar (via API in /api/admin/appointments)
  async function refreshAppointments() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/appointments", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppointments([]);
        setError(data?.error || "Failed to load appointments.");
        return;
      }

      const appts = Array.isArray(data.appointments) ? data.appointments : [];

      // Map into the shape the UI expects
      const mapped = appts.map((a) => ({
        id: a.eventId, // use Google eventId as primary id
        eventId: a.eventId,
        client: a.client || "Unknown",
        service: prettyServiceName(a.service),
        serviceId: a.service,
        date: a.date, 
        time: a.time, 
        address: a.address || "",
        status: "Confirmed", 
        email: a.email || "",
        notes: a.notes || "",
        startIso: a.startIso,
        endIso: a.endIso,
      }));

      setAppointments(mapped);
    } catch (e) {
      console.error(e);
      setAppointments([]);
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAppointments();
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = appointments.filter((appt) => appt.status !== "Canceled").length;

  // Since Google events are real bookings, treat them as Confirmed
  const pending = 0;
  const pendingAppointments = [];
  const bookedAppointments = appointments.filter((appt) => appt.status === "Confirmed");
  const confirmed = bookedAppointments.length;

  const activeServices = useMemo(() => SERVICES.filter((s) => s.active), []);

  const calendarStartHour = 0;
  const calendarEndHour = 23;
  const calendarRowHeight = 54;
  const calendarRowGap = 12;
  const calendarPadding = 12;

  const calendarSlots = useMemo(() => {
    const hours = [];
    for (let hour = calendarStartHour; hour <= calendarEndHour; hour += 1) hours.push(hour);
    return hours;
  }, [calendarStartHour, calendarEndHour]);

  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? "PM" : "AM";
    const normalized = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalized}${period}`;
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? "PM" : "AM";
        const normalized = hour % 12 === 0 ? 12 : hour % 12;
        const minuteLabel = minute.toString().padStart(2, "0");
        slots.push(`${normalized}:${minuteLabel} ${period}`);
      }
    }
    return slots;
  }, []);

  const weekDays = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);

  const formatDateKey = (date) => date.toISOString().split("T")[0];

  const getWeekStart = (date) => {
    const jsDay = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - jsDay);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, idx) => {
      const next = new Date(start);
      next.setDate(start.getDate() + idx);
      return next;
    });
  }, [currentDate]);

  const dayDate = useMemo(() => {
    const next = new Date(currentDate);
    next.setHours(0, 0, 0, 0);
    return next;
  }, [currentDate]);

  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const start = new Date(first);
    const end = new Date(last);

    start.setDate(first.getDate() - first.getDay());
    end.setDate(last.getDate() + (6 - last.getDay()));

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [currentDate]);

  const calendarEvents = useMemo(() => {
    return appointments
      .filter((appt) => appt.status !== "Canceled")
      .map((appt) => {
        const time24 = to24h(appt.time); 
        const hour = Number(time24.split(":")[0] || 0);
        const gridRowStart = Math.max(hour - calendarStartHour + 1, 1);

      
        const span = 1;

        const dateObj = new Date(`${appt.date}T00:00:00`);
        const dayIndex = dateObj.getDay();
        return {
          ...appt,
          gridRow: gridRowStart,
          gridCol: dayIndex + 1,
          span,
          timeLabel: appt.time,
        };
      });
  }, [appointments, calendarStartHour]);

  const visibleEvents = useMemo(() => {
    if (viewMode === "day") {
      const key = formatDateKey(dayDate);
      return calendarEvents.filter((appt) => appt.date === key);
    }
    if (viewMode === "week") {
      const keys = new Set(weekDates.map(formatDateKey));
      return calendarEvents.filter((appt) => keys.has(appt.date));
    }
    return calendarEvents;
  }, [calendarEvents, dayDate, viewMode, weekDates]);

  const nowIndicator = useMemo(() => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour < calendarStartHour || currentHour > calendarEndHour) return null;

    const hoursFromStart = currentHour - calendarStartHour;
    const offset =
      calendarPadding +
      hoursFromStart * (calendarRowHeight + calendarRowGap) +
      (currentMinute / 60) * calendarRowHeight;

    return {
      label: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      offset,
    };
  }, [
    now,
    calendarStartHour,
    calendarEndHour,
    calendarRowHeight,
    calendarRowGap,
    calendarPadding,
  ]);

  useEffect(() => {
    if (!calendarScrollRef.current || !nowIndicator) return;
    const container = calendarScrollRef.current;
    const target = Math.max(nowIndicator.offset - 120, 0);
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [nowIndicator]);

  // Admin actions that actually change Google Calendar
  async function cancelOnServer(eventId) {
    const ok = window.confirm("Cancel this appointment? This removes it from Google Calendar and sends cancel emails.");
    if (!ok) return false;

    setBusy(true);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Cancel failed.");
        return false;
      }
      await refreshAppointments();
      return true;
    } catch (e) {
      console.error(e);
      alert("Cancel failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function rescheduleOnServer(eventId, newDate, newTime) {
    setBusy(true);
    try {
      const res = await fetch("/api/booking/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, newDate, newTime }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Reschedule failed.");
        return false;
      }
      await refreshAppointments();
      return true;
    } catch (e) {
      console.error(e);
      alert("Reschedule failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createOnServer(payload) {
    setBusy(true);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Create failed.");
        return false;
      }
      await refreshAppointments();
      return true;
    } catch (e) {
      console.error(e);
      alert("Create failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const handleDetails = (appt, source = null) => {
    setActiveAppointment(appt);
    setDetailSource(source);
  };

  const closeDetails = (returnToBooked = true) => {
    setActiveAppointment(null);
    if (returnToBooked && detailSource === "booked") setShowBookedModal(true);
    setDetailSource(null);
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormState({
      firstName: "",
      lastName: "",
      email: "",
      service: activeServices[0]?.id ?? "fence",
      date: formatDateKey(new Date()),
      time: "09:00 AM",
      address: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (appt) => {
    setEditingId(appt.eventId || appt.id);
    const nameParts = String(appt.client || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    setFormState({
      firstName,
      lastName,
      email: appt.email || "",
      service: appt.serviceId || "fence",
      date: appt.date,
      time: appt.time,
      address: appt.address || "",
      notes: appt.notes || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!formState.date || !formState.time) return;

    // If editing, reschedule on server (delete+create in your reschedule route)
    if (editingId) {
      const ok = window.confirm("Reschedule this appointment to the new date/time?");
      if (!ok) return;

      const success = await rescheduleOnServer(editingId, formState.date, formState.time);
      if (success) setIsFormOpen(false);
      return;
    }

    // If adding, create on server
    if (!formState.firstName || !formState.lastName || !formState.email || !formState.service) {
      alert("Please fill first name, last name, email, and service.");
      return;
    }

    const payload = {
      service: formState.service, // service id (fence, pergola, etc)
      date: formState.date,
      time: formState.time,
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      address: formState.address,
      notes: formState.notes,
    };

    const success = await createOnServer(payload);
    if (success) setIsFormOpen(false);
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (mode === "day") setCurrentDate(new Date());
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    if (viewMode !== "day") setViewMode("day");
  };

  const shiftDate = (direction) => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(currentDate.getDate() + direction);
    else if (viewMode === "week") next.setDate(currentDate.getDate() + direction * 7);
    else next.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(next);
  };

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Appointments</p>
          <h1 className="admin-title">Schedule overview</h1>
          <p className="admin-subtitle">Synced with Google Calendar bookings.</p>
          {error ? <p className="admin-subtitle" style={{ color: "#b91c1c" }}>{error}</p> : null}
        </div>
        <div className="admin-hero-actions">
          <button
            className="admin-btn admin-btn--secondary"
            type="button"
            onClick={refreshAppointments}
            disabled={loading || busy}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Upcoming</div>
          <div className="admin-stat-value">{upcoming}</div>
          <div className="admin-muted">Next 180 days</div>
        </article>

        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Pending approval</div>
          <div className="admin-stat-value">{pending}</div>
          <button
            type="button"
            className={`${STATUS_CLASS.Pending} admin-badge--button`}
            onClick={() => setShowPendingModal(true)}
            disabled
            title="Pending is disabled because bookings are confirmed when created."
          >
            Review
          </button>
        </article>

        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Confirmed</div>
          <div className="admin-stat-value">{confirmed}</div>
          <button
            type="button"
            className={`${STATUS_CLASS.Confirmed} admin-badge--button`}
            onClick={() => setShowBookedModal(true)}
            disabled={busy}
          >
            Booked
          </button>
        </article>
      </section>

      <section className={`admin-calendar ${viewMode === "day" ? "admin-calendar--day" : ""}`}>
        <div className="admin-calendar__header">
          <div className="admin-calendar__title-stack">
            <h2 className="admin-calendar__title">
              {currentDate.toLocaleString([], { month: "long", year: "numeric" })}
            </h2>
            {viewMode === "day" && (
              <div className="admin-calendar__day-label">
                <div className="admin-calendar__day-label-row">
                  <span className="admin-calendar__day-label-number">{dayDate.getDate()}</span>
                  <span className="admin-calendar__day-label-weekday">
                    {dayDate.toLocaleString([], { weekday: "long" })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="admin-calendar__mode">
            <button
              type="button"
              className={`admin-calendar__mode-btn ${viewMode === "day" ? "is-active" : ""}`}
              onClick={() => handleViewChange("day")}
            >
              Day
            </button>
            <button
              type="button"
              className={`admin-calendar__mode-btn ${viewMode === "week" ? "is-active" : ""}`}
              onClick={() => handleViewChange("week")}
            >
              Week
            </button>
            <button
              type="button"
              className={`admin-calendar__mode-btn ${viewMode === "month" ? "is-active" : ""}`}
              onClick={() => handleViewChange("month")}
            >
              Month
            </button>
          </div>

          <div className="admin-calendar__actions">
            <div className="admin-calendar__nav">
              <button
                className="admin-calendar__nav-btn"
                onClick={() => shiftDate(-1)}
                type="button"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="admin-calendar__nav-btn admin-calendar__nav-btn--today"
                onClick={handleToday}
                type="button"
              >
                Today
              </button>
              <button
                className="admin-calendar__nav-btn"
                onClick={() => shiftDate(1)}
                type="button"
                aria-label="Next"
              >
                ›
              </button>
            </div>
            <button
              className="admin-btn admin-btn--primary"
              onClick={openAddForm}
              type="button"
              disabled={busy}
            >
              Add Appointment
            </button>
          </div>
        </div>

        {viewMode !== "month" ? (
          <div className="admin-calendar__body">
            <div className="admin-calendar__week">
              {viewMode === "week" && (
                <div className="admin-calendar__days">
                  {weekDates.map((date) => {
                    const dayIndex = date.getDay();
                    const isToday = formatDateKey(date) === formatDateKey(now);
                    return (
                      <div
                        key={date.toISOString()}
                        className={`admin-calendar__day ${isToday ? "is-today" : ""}`}
                      >
                        <span>{weekDays[dayIndex]}</span>
                        <span className="admin-calendar__day-number">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="admin-calendar__scroll" ref={calendarScrollRef}>
                <div className="admin-calendar__scroll-grid">
                  <div className="admin-calendar__times">
                    {calendarSlots.map((hour) => (
                      <div key={hour} className="admin-calendar__time">
                        {formatHourLabel(hour)}
                      </div>
                    ))}
                  </div>

                  <div className="admin-calendar__grid">
                    {calendarSlots.map((hour) => (
                      <div key={hour} className="admin-calendar__row" />
                    ))}

                    {nowIndicator && (
                      <div className="admin-calendar__now" style={{ top: `${nowIndicator.offset}px` }}>
                        <span className="admin-calendar__now-dot" />
                        <span className="admin-calendar__now-line" />
                        <span className="admin-calendar__now-label">{nowIndicator.label}</span>
                      </div>
                    )}

                    {visibleEvents.map((appt) => (
                      <div
                        key={appt.id}
                        className={`admin-calendar__event ${
                          appt.status === "Confirmed"
                            ? "admin-calendar__event--confirmed"
                            : appt.status === "Pending"
                            ? "admin-calendar__event--pending"
                            : "admin-calendar__event--neutral"
                        }`}
                        style={{
                          gridRow: `${appt.gridRow} / span ${appt.span}`,
                          gridColumn: viewMode === "day" ? "1 / span 1" : `${appt.gridCol} / span 1`,
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDetails(appt)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleDetails(appt);
                        }}
                      >
                        <div className="admin-calendar__event-title">{appt.client}</div>
                        <div className="admin-calendar__event-subtitle">{appt.timeLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-calendar__month">
            <div className="admin-calendar__month-head">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="admin-calendar__month-day">
                  {day}
                </div>
              ))}
            </div>
            <div className="admin-calendar__month-grid">
              {monthDates.map((date) => {
                const key = formatDateKey(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = formatDateKey(date) === formatDateKey(now);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`admin-calendar__month-cell ${isCurrentMonth ? "is-current" : "is-muted"} ${
                      isToday ? "is-today" : ""
                    }`}
                    onClick={() => {
                      setCurrentDate(date);
                      setViewMode("day");
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {activeAppointment && (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={closeDetails}
            aria-label="Close appointment details"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Appointment Details</p>
                <h2 className="admin-title">{activeAppointment.client}</h2>
                <p className="admin-subtitle">{activeAppointment.id}</p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={closeDetails}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div>
                <div className="admin-muted">Service</div>
                <div className="admin-strong">{activeAppointment.service}</div>
              </div>
              <div>
                <div className="admin-muted">Date</div>
                <div className="admin-strong">{activeAppointment.date}</div>
              </div>
              <div>
                <div className="admin-muted">Time</div>
                <div className="admin-strong">{activeAppointment.time}</div>
              </div>
              <div>
                <div className="admin-muted">Status</div>
                <span className={STATUS_CLASS[activeAppointment.status]}>
                  {activeAppointment.status}
                </span>
              </div>
              <div className="admin-modal__full">
                <div className="admin-muted">Address</div>
                <div className="admin-strong">{activeAppointment.address}</div>
              </div>
              <div className="admin-modal__full">
                <div className="admin-muted">Email</div>
                <div className="admin-strong">{activeAppointment.email || "—"}</div>
              </div>
              <div className="admin-modal__full">
                <div className="admin-muted">Notes</div>
                <div className="admin-strong">{activeAppointment.notes || "—"}</div>
              </div>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setDetailSource(null);
                  openEditForm(activeAppointment);
                  closeDetails(false);
                }}
                type="button"
                disabled={busy}
              >
                Reschedule
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => {
                  setCancelTarget(activeAppointment);
                  setCancelSource(detailSource);
                  setActiveAppointment(null);
                }}
                type="button"
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={closeForm}
            aria-label="Close appointment form"
            type="button"
          />
          <form
            className="admin-modal__content"
            role="dialog"
            aria-modal="true"
            onSubmit={handleFormSubmit}
          >
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">{editingId ? "Reschedule Appointment" : "Add Appointment"}</p>
                <h2 className="admin-title">Appointment details</h2>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={closeForm}
                type="button"
                disabled={busy}
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              {!editingId ? (
                <>
                  <div>
                    <label className="admin-label" htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      className="admin-input"
                      value={formState.firstName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-label" htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      className="admin-input"
                      value={formState.lastName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="admin-modal__full">
                    <label className="admin-label" htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="admin-input"
                      value={formState.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label className="admin-label" htmlFor="service">Service</label>
                <select
                  id="service"
                  name="service"
                  className="admin-input"
                  value={formState.service}
                  onChange={handleFormChange}
                  required={!editingId}
                  disabled={!!editingId}
                  title={editingId ? "Service stays the same when rescheduling." : ""}
                >
                  {activeServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-label" htmlFor="date">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  className="admin-input"
                  value={formState.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label className="admin-label" htmlFor="time">Time</label>
                <select
                  id="time"
                  name="time"
                  className="admin-input"
                  value={formState.time}
                  onChange={handleFormChange}
                  required
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  className="admin-input"
                  value={formState.address}
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-modal__full">
                <label className="admin-label" htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="admin-input"
                  rows={4}
                  value={formState.notes}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Reschedule" : "Add Appointment"}
              </button>
              <button className="admin-btn admin-btn--ghost" type="button" onClick={closeForm} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPendingModal && (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setShowPendingModal(false)}
            aria-label="Close pending appointments"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Pending Approval</p>
                <h2 className="admin-title">Review appointments</h2>
                <p className="admin-subtitle">Pending is disabled (bookings are confirmed when created).</p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setShowPendingModal(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="admin-pending-list">
              <div className="admin-muted">No pending appointments.</div>
            </div>
          </div>
        </div>
      )}

      {showBookedModal && (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setShowBookedModal(false)}
            aria-label="Close booked appointments"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Booked</p>
                <h2 className="admin-title">Confirmed appointments</h2>
                <p className="admin-subtitle">All appointments synced from Google Calendar.</p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setShowBookedModal(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-pending-list admin-pending-list--booked">
              {bookedAppointments.length === 0 ? (
                <div className="admin-muted">No booked appointments.</div>
              ) : (
                bookedAppointments.map((appt) => (
                  <div key={appt.id} className="admin-pending-row">
                    <div>
                      <div className="admin-strong">{appt.client}</div>
                      <div className="admin-muted">
                        {appt.date} · {appt.time}
                      </div>
                    </div>
                    <button
                      className="admin-btn admin-btn--small admin-btn--ghost"
                      type="button"
                      onClick={() => {
                        setShowBookedModal(false);
                        handleDetails(appt, "booked");
                      }}
                      disabled={busy}
                    >
                      Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="admin-modal">
          <button
            className="admin-modal__backdrop"
            onClick={() => setCancelTarget(null)}
            aria-label="Close cancel confirmation"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <p className="admin-kicker">Cancel Appointment</p>
                <h2 className="admin-title">Are you sure?</h2>
                <p className="admin-subtitle">
                  This will remove it from Google Calendar and send cancel emails.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setCancelTarget(null)}
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
                disabled={busy}
                onClick={async () => {
                  const ok = await cancelOnServer(cancelTarget.eventId || cancelTarget.id);
                  setCancelTarget(null);
                  if (ok && cancelSource === "booked") setShowBookedModal(true);
                  setCancelSource(null);
                }}
              >
                {busy ? "Canceling…" : "Yes, cancel it"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                disabled={busy}
                onClick={() => {
                  setCancelTarget(null);
                  if (cancelSource === "booked") setShowBookedModal(true);
                  setCancelSource(null);
                }}
              >
                Keep appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}