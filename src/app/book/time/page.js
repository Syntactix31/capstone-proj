"use client";

import { useState, useMemo } from "react";
// For App Router:
import { useSearchParams, useRouter } from "next/navigation";
import NavBar from "../../components/Navbar";

const SERVICE_OPTIONS = [
  {
    id: "fence",
    name: "Fence Installation",
    duration: "1–2 days",
  },
  {
    id: "deck-railing",
    name: "Deck & Railing",
    duration: "3–5 days",
  },
  {
    id: "pergola",
    name: "Pergola",
    duration: "1–3 days",
  },
  {
    id: "sod",
    name: "Sod Installation",
    duration: "1 day",
  },
  {
    id: "trees-shrubs",
    name: "Trees & Shrubs",
    duration: "2–6 hrs",
  },
];

const TIME_SLOTS = [
  "9:00 am",
  "9:30 am",
  "10:00 am",
  "10:30 am",
  "11:00 am",
  "11:30 am",
  "12:00 pm",
  "12:30 pm",
  "1:00 pm",
  "1:30 pm",
  "2:00 pm",
  "2:30 pm",
  "3:00 pm",
  "3:30 pm",
];

export default function BookPage() {
  // For App Router:
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("service");
  const router = useRouter();

  // If you're using the pages router instead, use this:
  // const router = useRouter();
  // const serviceId = router.query.service;

  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((s) => s.id === serviceId) || null,
    [serviceId]
  );

  // Simple "fake month": 30 days
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const canSelectTime = !!selectedDay;

  const onConfirm = () => {
    if (!selectedDay || !selectedTime) {
      alert("Please choose a date and time first.");
      return;
    }

    // Later: push to details page or send to backend
    console.log("Booking selection:", {
      serviceId,
      day: selectedDay,
      time: selectedTime,
    });

    alert(
      `Selected:\nService: ${
        selectedService ? selectedService.name : serviceId
      }\nDay: ${selectedDay}\nTime: ${selectedTime}`
    );
  };

  return (
    <div>
    <header>
        <NavBar />
    </header>
            <div className="booking-page">
            <main className="booking-layout">
                
                {/* LEFT COLUMN – steps */}
                <section className="booking-left">
                    <button
                        type="button"
                        className="back-button"
                        onClick={() => router.back("/book")}
                    >
                        ← Back to services
                    </button>
                <div className="step-card">
                    <h2 className="step-card-title">Selected service</h2>
                    <p className="step-card-text">
                    {selectedService ? selectedService.name : "No service selected"}
                    {selectedService && (
                        <>
                        <br />
                        <span className="step-card-sub">
                            Duration: {selectedService.duration}
                        </span>
                        </>
                    )}
                    </p>
                </div>

          <div className="step-card step-card--active">
            <div className="step-card-header">
              <h2 className="step-card-title">Appointment time</h2>
              <span className="step-card-status">Current step</span>
            </div>
            <p className="step-card-text">
              Pick a date and an available time slot.
            </p>
          </div>

          <div className="step-card">
            <h2 className="step-card-title">Enter your details</h2>
            <p className="step-card-text">
              Next, you’ll add your contact info and project address.
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN – day of month and time slots */}
        <section className="booking-right">
          {/* Calendar */}
          <div className="calendar-card">
            <div className="calendar-header">
              <div>
                <div className="calendar-month">October 2026</div>
                <div className="calendar-sub">
                  Choose any day in the next month.
                </div>
              </div>
            </div>

            <div className="calendar-grid">
              {/* weekday */}
              <div className="calendar-weekday">Su</div>
              <div className="calendar-weekday">Mo</div>
              <div className="calendar-weekday">Tu</div>
              <div className="calendar-weekday">We</div>
              <div className="calendar-weekday">Th</div>
              <div className="calendar-weekday">Fr</div>
              <div className="calendar-weekday">Sa</div>

              {days.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    className={
                      "calendar-day" + (isSelected ? " calendar-day--selected" : "")
                    }
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="times-card">
            <h2 className="times-title">Available Times</h2>
            <p className="times-sub">
                You can schedule an appointment between 4 hours and 30 days ahead
                of time.
            </p>

            {/* must select date */}
            {!selectedDay ? (
                <p className="times-hint">
                Select a date on the calendar to see available time slots.
                </p>
            ) : (
                <>
                <div className="times-grid">
                    {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                        <button
                        key={slot}
                        type="button"
                        className={
                            "time-slot" + (isSelected ? " time-slot--selected" : "")
                        }
                        onClick={() => setSelectedTime(slot)}
                        >
                        {slot}
                        </button>
                    );
                    })}
                </div>

                <div className="times-footer">
                    <button className="times-confirm" type="button" onClick={onConfirm}>
                    Continue
                    </button>
                </div>
                </>
            )}
            </div>

        </section>
      </main>
    </div>
    </div>
  );
}
