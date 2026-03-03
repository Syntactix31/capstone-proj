"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout.js";

const APPOINTMENTS = [
  {
    id: "A-1001",
    client: "Jordan Lee",
    service: "Fence Installation",
    date: "2026-03-04",
    time: "10:00 AM",
    address: "123 Main St, Calgary",
    status: "Pending",
  },
  {
    id: "A-1002",
    client: "Avery Chen",
    service: "Deck & Railing",
    date: "2026-03-05",
    time: "1:30 PM",
    address: "44 5 Ave SW, Calgary",
    status: "Pending",
  },
  {
    id: "A-1003",
    client: "Taylor Singh",
    service: "Pergola",
    date: "2026-03-06",
    time: "9:00 AM",
    address: "912 10 St NW, Calgary",
    status: "Pending",
  },
  {
    id: "A-1004",
    client: "Morgan Park",
    service: "Sod Installation",
    date: "2026-03-08",
    time: "2:00 PM",
    address: "80 17 Ave NE, Calgary",
    status: "Pending",
  },
];

const SERVICES = [
  { id: "S-01", name: "Fence Installation", active: true },
  { id: "S-02", name: "Deck & Railing", active: true },
  { id: "S-03", name: "Pergola", active: true },
  { id: "S-04", name: "Sod Installation", active: false },
  { id: "S-05", name: "Trees and Shrubs", active: true },
];

const STATUS_CLASS = {
  Pending: "admin-badge admin-badge--pending",
  Confirmed: "admin-badge admin-badge--active",
  Canceled: "admin-badge admin-badge--muted",
};

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailSource, setDetailSource] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [now, setNow] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    client: "",
    service: "",
    date: "",
    time: "",
    address: "",
    status: "Pending",
  });
  const [editingId, setEditingId] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSource, setCancelSource] = useState(null);
  const calendarScrollRef = useRef(null);

  /*Role verification*/
  
  /*useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("auth_role");
    if (role !== "admin") {
      router.replace("/auth");
    }
  }, [router]);*/

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = appointments.filter(
    (appt) => appt.status !== "Canceled"
  ).length;
  const pending = appointments.filter((appt) => appt.status === "Pending")
    .length;
  const pendingAppointments = appointments.filter(
    (appt) => appt.status === "Pending"
  );
  const bookedAppointments = appointments.filter(
    (appt) => appt.status === "Confirmed"
  );
  const confirmed = appointments.filter((appt) => appt.status === "Confirmed")
    .length;
  const activeServices = useMemo(
    () => SERVICES.filter((service) => service.active),
    []
  );
  const calendarStartHour = 0;
  const calendarEndHour = 23;
  const calendarRowHeight = 54;
  const calendarRowGap = 12;
  const calendarPadding = 12;
  const calendarSlots = useMemo(() => {
    const hours = [];
    for (let hour = calendarStartHour; hour <= calendarEndHour; hour += 1) {
      hours.push(hour);
    }
    return hours;
  }, []);

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

  const weekDays = useMemo(
    () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    []
  );

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
  const todayIndex = useMemo(() => new Date().getDay(), []);

  const calendarEvents = useMemo(
    () =>
      appointments
        .filter((appt) => appt.status !== "Canceled")
        .map((appt, index) => {
          const [hourPart] = appt.time.split(" ")[0].split(":");
          const hour = parseInt(hourPart, 10);
          const gridRowStart = Math.max(hour - calendarStartHour + 1, 1);
          const span = 1;
          const dateObj = new Date(`${appt.date}T00:00:00`);
          const dayIndex = dateObj.getDay();
          return {
            ...appt,
            gridRow: gridRowStart,
            gridCol: dayIndex + 1,
            span,
            timeLabel: `${appt.time}`,
          };
        }),
    [appointments]
  );

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
    if (currentHour < calendarStartHour || currentHour > calendarEndHour) {
      return null;
    }

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

  const handleApprove = (id) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: "Confirmed" } : appt
      )
    );
  };

  const handleCancel = (id) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: "Canceled" } : appt
      )
    );
  };

  const handleReschedule = (id) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: "Pending" } : appt
      )
    );
  };

  const handleDetails = (appt, source = null) => {
    setActiveAppointment(appt);
    setDetailSource(source);
  };

  const closeDetails = (returnToBooked = true) => {
    setActiveAppointment(null);
    if (returnToBooked && detailSource === "booked") {
      setShowBookedModal(true);
    }
    setDetailSource(null);
  };

  const openAddForm = () => {
    const defaultService = activeServices[0]?.name ?? "";
    setEditingId(null);
    setFormState({
      client: "",
      service: defaultService,
      date: formatDateKey(new Date()),
      time: "09:00 AM",
      address: "",
      status: "Pending",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (appt) => {
    setEditingId(appt.id);
    setFormState({
      client: appt.client,
      service: appt.service,
      date: appt.date,
      time: appt.time,
      address: appt.address,
      status: appt.status,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!formState.client || !formState.date || !formState.time) return;

    if (editingId) {
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === editingId ? { ...appt, ...formState } : appt
        )
      );
    } else {
      setAppointments((prev) => [
        ...prev,
        {
          id: `A-${Date.now()}`,
          ...formState,
        },
      ]);
    }

    setIsFormOpen(false);
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (mode === "day") setCurrentDate(new Date());
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    if (viewMode !== "day") {
      setViewMode("day");
    }
  };

  const shiftDate = (direction) => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(currentDate.getDate() + direction);
    } else if (viewMode === "week") {
      next.setDate(currentDate.getDate() + direction * 7);
    } else {
      next.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(next);
  };


  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Appointments</p>
          <h1 className="admin-title">Schedule overview</h1>
          <p className="admin-subtitle">
            Track upcoming visits, approvals, and on-site details.
          </p>
        </div>
        <div className="admin-hero-actions">
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Upcoming</div>
          <div className="admin-stat-value">{upcoming}</div>
          <div className="admin-muted">Next 14 days</div>
        </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Pending approval</div>
              <div className="admin-stat-value">{pending}</div>
              <button
                type="button"
                className={`${STATUS_CLASS.Pending} admin-badge--button`}
                onClick={() => setShowPendingModal(true)}
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
              >
                Booked
              </button>
            </article>
      </section>

      <section
        className={`admin-calendar ${
          viewMode === "day" ? "admin-calendar--day" : ""
        }`}
      >
          <div className="admin-calendar__header">
          <div className="admin-calendar__title-stack">
            <h2 className="admin-calendar__title">
              {currentDate.toLocaleString([], {
                month: "long",
                year: "numeric",
              })}
            </h2>
            {viewMode === "day" && (
              <div className="admin-calendar__day-label">
                <div className="admin-calendar__day-label-row">
                  <span className="admin-calendar__day-label-number">
                    {dayDate.getDate()}
                  </span>
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
                  className={`admin-calendar__mode-btn ${
                    viewMode === "day" ? "is-active" : ""
                  }`}
                  onClick={() => handleViewChange("day")}
                >
                  Day
                </button>
                <button
                  type="button"
                  className={`admin-calendar__mode-btn ${
                    viewMode === "week" ? "is-active" : ""
                  }`}
                  onClick={() => handleViewChange("week")}
                >
                  Week
                </button>
                <button
                  type="button"
                  className={`admin-calendar__mode-btn ${
                    viewMode === "month" ? "is-active" : ""
                  }`}
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
                      className={`admin-calendar__day ${
                        isToday ? "is-today" : ""
                      }`}
                    >
                      <span>{weekDays[dayIndex]}</span>
                      <span className="admin-calendar__day-number">
                        {date.getDate()}
                      </span>
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
                          <div
                            className="admin-calendar__now"
                            style={{ top: `${nowIndicator.offset}px` }}
                          >
                            <span className="admin-calendar__now-dot" />
                            <span className="admin-calendar__now-line" />
                            <span className="admin-calendar__now-label">
                              {nowIndicator.label}
                            </span>
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
                              gridColumn:
                                viewMode === "day"
                                  ? "1 / span 1"
                                  : `${appt.gridCol} / span 1`,
                            }}
                            role="button"
                            tabIndex={0}
                          onClick={() => handleDetails(appt)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleDetails(appt);
                            }}
                          >
                          <div className="admin-calendar__event-title">
                            {appt.client}
                          </div>
                          {appt.status === "Pending" && (
                            <div className="admin-calendar__event-subtitle">
                              pending
                            </div>
                          )}
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
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="admin-calendar__month-day">
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="admin-calendar__month-grid">
                  {monthDates.map((date) => {
                    const key = formatDateKey(date);
                    const isCurrentMonth =
                      date.getMonth() === currentDate.getMonth();
                    const isToday = formatDateKey(date) === formatDateKey(now);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`admin-calendar__month-cell ${
                          isCurrentMonth ? "is-current" : "is-muted"
                        } ${isToday ? "is-today" : ""}`}
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
                <div className="admin-strong">
                  {activeAppointment.address}
                </div>
              </div>
            </div>
            <div className="admin-modal__actions">
              {activeAppointment.status === "Pending" && (
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={() => {
                    handleApprove(activeAppointment.id);
                    closeDetails();
                  }}
                  type="button"
                >
                  Approve
                </button>
              )}
              <button
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setDetailSource(null);
                  openEditForm(activeAppointment);
                  closeDetails(false);
                }}
                type="button"
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
                <p className="admin-kicker">
                  {editingId ? "Edit Appointment" : "Add Appointment"}
                </p>
                <h2 className="admin-title">Appointment details</h2>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={closeForm}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-modal__grid">
              <div>
                <label className="admin-label" htmlFor="client">
                  Client
                </label>
                <input
                  id="client"
                  name="client"
                  className="admin-input"
                  value={formState.client}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="admin-label" htmlFor="service">
                  Service
                </label>
                <select
                  id="service"
                  name="service"
                  className="admin-input"
                  value={formState.service}
                  onChange={handleFormChange}
                  required
                >
                  {activeServices.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label" htmlFor="date">
                  Date
                </label>
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
                <label className="admin-label" htmlFor="time">
                  Time
                </label>
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
                <label className="admin-label" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  className="admin-input"
                  value={formState.address}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--primary" type="submit">
                {editingId ? "Save Changes" : "Add Appointment"}
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={closeForm}
              >
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
                <p className="admin-subtitle">
                  Confirm each booking to lock it in.
                </p>
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
              {pendingAppointments.length === 0 ? (
                <div className="admin-muted">No pending appointments.</div>
              ) : (
                pendingAppointments.map((appt) => (
                  <div key={appt.id} className="admin-pending-row">
                    <div>
                      <div className="admin-strong">{appt.client}</div>
                      <div className="admin-muted">
                        {appt.date} · {appt.time}
                      </div>
                    </div>
                    <button
                      className="admin-btn admin-btn--small admin-btn--primary"
                      type="button"
                      onClick={() => {
                        handleApprove(appt.id);
                        setShowPendingModal(false);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                ))
              )}
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
                <p className="admin-subtitle">
                  All appointments that are locked in.
                </p>
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
                  This will mark the appointment as canceled.
                </p>
              </div>
              <button
                className="admin-btn admin-btn--ghost admin-btn--small"
                onClick={() => setCancelTarget(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-btn admin-btn--danger"
                type="button"
                onClick={() => {
                  handleCancel(cancelTarget.id);
                  setCancelTarget(null);
                  if (cancelSource === "booked") {
                    setShowBookedModal(true);
                  }
                  setCancelSource(null);
                }}
              >
                Yes, cancel it
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => {
                  setCancelTarget(null);
                  if (cancelSource === "booked") {
                    setShowBookedModal(true);
                  }
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
