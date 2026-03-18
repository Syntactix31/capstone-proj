"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
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

// Half-hour appointment slots shown in the picker.
const TIME_SLOTS = [
  "9:00 am","9:30 am","10:00 am","10:30 am","11:00 am","11:30 am",
  "12:00 pm","12:30 pm","1:00 pm","1:30 pm","2:00 pm","2:30 pm",
  "3:00 pm","3:30 pm",
];

// Convert a Date object into a YYYY-MM-DD string.
function ymd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Format a picked date for user-facing display.
function prettyDate(dateObj) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}

// Format the current calendar month heading.
function monthTitle(dateObj) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    month: "long",
    year: "numeric",
  }).format(dateObj);
}

// Start from local midnight so day comparisons stay cleaner.
function startOfDayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Turn a selected day and slot label into a real Date object.
function makeDateFromYmdAndSlot(dateStr, slot) {
  const m = String(slot).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;

  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const mer = m[3].toLowerCase();

  if (mer === "am") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }

  const hhStr = String(hh).padStart(2, "0");
  const mmStr = String(mm).padStart(2, "0");

  return new Date(`${dateStr}T${hhStr}:${mmStr}:00-07:00`);
}

// Check whether two time ranges overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// Main booking time picker used for both new bookings and reschedules.
function BookTimeInner() {
  const params = useSearchParams();
  const router = useRouter();

  const serviceParam = params.get("service") || "";
  const serviceIds = useMemo(
    () => serviceParam.split(",").filter(Boolean),
    [serviceParam]
  );


  const eventId = params.get("eventId") || "";
  const mode = params.get("mode") || "";

  const selectedServices = useMemo(
    () => serviceIds
      .map(id => SERVICE_OPTIONS.find(s => s.id === id))
      .filter(Boolean),
    [serviceIds]
  );


  const today = useMemo(() => startOfDayLocal(), []);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = startOfDayLocal();
    d.setDate(1);
    return d;
  });

  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [busyIntervals, setBusyIntervals] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const calendarCells = useMemo(() => {
    const first = new Date(monthCursor);
    const year = first.getFullYear();
    const month = first.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  }, [monthCursor]);

  // Load busy intervals from the backend whenever the selected date changes.
  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!selectedDateStr) return;

      setLoadingSlots(true);
      setBusyIntervals([]);
      setSelectedTime(null);

      try {
        const res = await fetch("/api/booking/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDateStr }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!ignore) alert(data?.error || "Could not load availability.");
          return;
        }

        const intervals = Array.isArray(data.busyIntervals) ? data.busyIntervals : [];
        if (!ignore) setBusyIntervals(intervals);
      } catch {
        if (!ignore) alert("Could not load availability. Try again.");
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [selectedDateStr]);

  // Mark slots as disabled if they are in the past or overlap an existing booking.
  const disabledSlots = useMemo(() => {
    const disabled = new Set();

    if (!selectedDateStr) return disabled;

    const intervals = busyIntervals
      .map((i) => {
        const s = new Date(i.start);
        const e = new Date(i.end);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
        return { s, e };
      })
      .filter(Boolean);

    for (const slot of TIME_SLOTS) {
      const slotStart = makeDateFromYmdAndSlot(selectedDateStr, slot);
      if (!slotStart || Number.isNaN(slotStart.getTime())) continue;

      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      if (slotStart.getTime() < Date.now()) {
        disabled.add(slot.toLowerCase());
        continue;
      }

      for (const it of intervals) {
        if (overlaps(slotStart, slotEnd, it.s, it.e)) {
          disabled.add(slot.toLowerCase());
          break;
        }
      }
    }
    return disabled;
  }, [busyIntervals, selectedDateStr]);

  // Continue to either the details step or the reschedule route.
  const onConfirm = async () => {
    if (!selectedDateStr || !selectedTime) {
      alert("Please choose a date and time first.");
      return;
    }

    if (mode === "reschedule") {
      if (!eventId) {
        alert("Missing eventId for reschedule.");
        return;
      }

      try {
        const res = await fetch("/api/booking/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            newDate: selectedDateStr,
            newTime: selectedTime,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(data?.error || "Could not reschedule. Try again.");
          return;
        }

        const qs = new URLSearchParams({
          service: serviceParam,
          date: data.date || selectedDateStr,
          time: data.time || selectedTime,
          eventId: data.newEventId || "",
          status: "rescheduled",
        }).toString();



        router.push(`/book/confirm?${qs}`);
      } catch (e) {
        console.error(e);
        alert("Could not reschedule. Try again.");
      }

      return;
    }

    router.push(
      `/book/details?service=${encodeURIComponent(serviceParam)}&date=${encodeURIComponent(
        selectedDateStr
      )}&time=${encodeURIComponent(selectedTime)}`
    );

  };

  const selectedDateObj = useMemo(() => {
    if (!selectedDateStr) return null;
    const d = new Date(`${selectedDateStr}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [selectedDateStr]);

  const canGoPrev = useMemo(() => {
    const prev = new Date(monthCursor);
    prev.setMonth(prev.getMonth() - 1);
    prev.setDate(1);

    const min = new Date(today);
    min.setDate(1);

    return prev.getTime() >= min.getTime();
  }, [monthCursor, today]);

  const goPrev = () => {
    if (!canGoPrev) return;
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    setMonthCursor(d);
  };

  const goNext = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    setMonthCursor(d);
  };

  return (
    <div>
      <header>
        <NavBar />
      </header>

      <div className="booking-page">
        <main className="booking-layout">
          <section className="booking-left">
            <button type="button" className="back-button" onClick={() => router.push("/book")}>
              ← Back to services
            </button>
            

            <div className="step-card">
              <h2 className="step-card-title">Selected service(s)</h2>
              <p className="step-card-text">
                {selectedServices.length > 0 ? (
                  <>
                    {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected:
                    <br />
                    {selectedServices.map(s => s.name).join(", ")}
                    <br />
                    <span className="step-card-sub">
                      {selectedServices.map(s => `${s.name}: ${s.duration}`).join(" • ")}
                    </span>
                  </>
                ) : (
                  "No service selected"
                )}
              </p>
            </div>



            <div className="step-card step-card--active">
              <div className="step-card-header">
                <h2 className="step-card-title">
                  {mode === "reschedule" ? "Reschedule appointment" : "Appointment time"}
                </h2>
                <span className="step-card-status">Current step</span>
              </div>
              <p className="step-card-text">
                {mode === "reschedule"
                  ? "Choose a new date and time."
                  : "Pick a date and an available time slot."}
              </p>
            </div>

            <div className="step-card">
              <h2 className="step-card-title">Enter your details</h2>
              <p className="step-card-text">Next, you&apos;ll add your contact info and project address.</p>
            </div>
          </section>

          <section className="booking-right">
            <div className="calendar-card">
              <div className="calendar-header">
                <div>
                  <div className="calendar-month">{monthTitle(monthCursor)}</div>
                  <div className="calendar-sub">Choose a date</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={goPrev} disabled={!canGoPrev} className="calendar-nav">
                    ←
                  </button>
                  <button type="button" onClick={goNext} className="calendar-nav">
                    →
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekday">Su</div>
                <div className="calendar-weekday">Mo</div>
                <div className="calendar-weekday">Tu</div>
                <div className="calendar-weekday">We</div>
                <div className="calendar-weekday">Th</div>
                <div className="calendar-weekday">Fr</div>
                <div className="calendar-weekday">Sa</div>

                {calendarCells.map((d, idx) => {
                  if (!d) return <div key={`empty-${idx}`} className="calendar-empty" />;

                  const dateStr = ymd(d);
                  const isSelected = selectedDateStr === dateStr;

                  const dStart = new Date(d);
                  dStart.setHours(0, 0, 0, 0);
                  const isPast = dStart.getTime() < today.getTime();

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isPast}
                      className={
                        "calendar-day" +
                        (isSelected ? " calendar-day--selected" : "") +
                        (isPast ? " calendar-day--disabled" : "")
                      }
                      onClick={() => setSelectedDateStr(dateStr)}
                      title={prettyDate(d)}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="times-card">
              <h2 className="times-title">Available Times</h2>
              <p className="times-sub">
                {selectedDateObj ? (
                  <>
                    For <strong>{prettyDate(selectedDateObj)}</strong>
                  </>
                ) : (
                  "Select a date to see availability."
                )}
              </p>

              {!selectedDateStr ? (
                <p className="times-hint">Select a date on the calendar to see time slots.</p>
              ) : loadingSlots ? (
                <p className="times-hint">Loading availability…</p>
              ) : (
                <>
                  <div className="times-grid">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = disabledSlots.has(slot.toLowerCase());
                      const isSelected = selectedTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          className={
                            "time-slot" +
                            (isSelected ? " time-slot--selected" : "") +
                            (isBooked ? " time-slot--disabled" : "")
                          }
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                          {isBooked ? " (Booked)" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="times-footer">
                    <button className="times-confirm" type="button" onClick={onConfirm}>
                      {mode === "reschedule" ? "Reschedule" : "Continue"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}

// Wrap the page in Suspense because it reads search params on the client.
export default function BookTimePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <BookTimeInner />
    </Suspense>
  );
}
