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

const VISIT_TYPES = ["Estimate", "Design Consultation", "Installation"];


const STATUS_CLASS = {
  Confirmed: "admin-badge admin-badge--active",
};


function prettyServiceName(serviceIdOrName) {
  const hit =
    SERVICES.find((s) => s.id === serviceIdOrName) ||
    SERVICES.find((s) => s.name === serviceIdOrName);
  return hit?.name || String(serviceIdOrName || "Appointment");
}

// Convert 12-hour times into 24-hour times for comparisons/layout math.
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

// Convert 24-hour times back into 12-hour display labels.
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

function splitClientName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function getClientFormFields(client) {
  return {
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
  };
}

// Main admin scheduling page for viewing, creating, cancelling, and rescheduling bookings.
export default function AdminAppointmentsPage() {
  // Core page state: fetched appointments plus loading/error flags.
  const [appointments, setAppointments] = useState([]); // from Google Calendar
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Detail modal state for the currently selected appointment.
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [detailSource, setDetailSource] = useState(null);

  // Calendar navigation state shared by day/week/month views.
  const [viewMode, setViewMode] = useState("week");
  const [now, setNow] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Form modal state used for both creating and rescheduling appointments.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({
    clientId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    service: "fence",
    visitType: "Estimate",
    durationHours: "1",
    date: "",
    time: "09:00 AM",
    address: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSource, setCancelSource] = useState(null);

  /* mobile layout
  - detects narrow screens for compact week view
  - keeps JS layout values in sync with CSS
  */
  const [isNarrow, setIsNarrow] = useState(false);

  const calendarScrollRef = useRef(null);

  // jiro
  // Load the current booking list for the calendar and booked-appointments views.
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

      // checks if the appointments data is an array, if not then use empty array
      const appts = Array.isArray(data.appointments) ? data.appointments : [];

      // Map into the shape the UI expects
      const mapped = appts.map((a) => ({
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

  // Keep "now" up to date so the calendar can show the current time position.
  useEffect(() => {
    refreshAppointments();
  }, []);

  // Load client records for the add-appointment form.
  useEffect(() => {
    let alive = true;

    async function refreshClients() {
      setClientsLoading(true);
      try {
        const res = await fetch("/api/admin/clients", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok) {
          setClients([]);
          setError((current) => current || data?.error || "Failed to load clients.");
          return;
        }

        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setClients([]);
        setError((current) => current || "Failed to load clients.");
      } finally {
        if (alive) setClientsLoading(false);
      }
    }

    refreshClients();
    return () => {
      alive = false;
    };
  }, []);

  // Check screen size so the calendar can switch to tighter mobile behavior.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* matchMedia hook
  - updates isNarrow for mobile layout logic
  checks if sceen width is smaller or larger than 640px
  */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)") ; // checks if screen size has a width less than 640px
    const syncMedia = () => setIsNarrow(media.matches); 
    syncMedia(); // setIsNarrow becomes true, since media.matches = true
    if (media.addEventListener) {
       // when theres a change in the media query result, run the syncMedia func depending on whether media.matches = true/false
      media.addEventListener("change", syncMedia);
      return () => media.removeEventListener("change", syncMedia);
    }
    // for older browsers
    media.addListener(syncMedia);
    return () => media.removeListener(syncMedia);
  }, []);


  const upcoming = appointments.filter((appt) => appt.status === "Confirmed").length;

  // Since Google events are real bookings, treat them as Confirmed
  const bookedAppointments = appointments.filter((appt) => appt.status === "Confirmed");
  const confirmed = bookedAppointments.length;

  const activeServices = useMemo(() => SERVICES.filter((s) => s.active), []);
  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
          sensitivity: "base",
        })
      ),
    [clients]
  );
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === formState.clientId) || null,
    [clients, formState.clientId]
  );

  // Hour boundaries define the visible scheduling grid for the calendar.
  const calendarStartHour = 7;
  const calendarEndHour = 19;
  /* calendar sizing
  - keeps day view taller for readability
  - matches mobile and desktop CSS values
  */
  const calendarSizing = useMemo(() => {
    if (viewMode === "day") {
      return isNarrow
        ? { rowHeight: 56, rowGap: 10, padding: 12 }
        : { rowHeight: 64, rowGap: 14, padding: 12 };
    }
    return isNarrow
      ? { rowHeight: 46, rowGap: 8, padding: 12 }
      : { rowHeight: 54, rowGap: 12, padding: 12 };
  }, [isNarrow, viewMode]);

  const calendarSlots = useMemo(() => {
    const hours = [];
    for (let hour = calendarStartHour; hour <= calendarEndHour; hour += 1) hours.push(hour);
    return hours;
  }, [calendarStartHour, calendarEndHour]);

  // 24 to 12 hour clock formatting
  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? "PM" : "AM";
    const normalized = hour % 12 === 0 ? 12 : hour % 12; // checks if hour modulus 12 is = to 0, then it stays 12. Elsewise hour % 12 = (the hour in 12hr format)
    return `${normalized}${period}`;
  };

  // time slot intervals - used for when user wants to create a new appointment and has to choose a timeslot
  const timeSlots = useMemo(() => {
    const slots = [];
    const durationHours = Number.parseInt(formState.durationHours || "1", 10) || 1;
    const latestEndMinutes = calendarEndHour * 60;
    for (let hour = calendarStartHour; hour <= calendarEndHour; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStartMinutes = hour * 60 + minute;
        const slotEndMinutes = slotStartMinutes + durationHours * 60;
        if (slotEndMinutes > latestEndMinutes) continue;
        const period = hour >= 12 ? "PM" : "AM";
        const normalized = hour % 12 === 0 ? 12 : hour % 12;
        const minuteLabel = minute.toString().padStart(2, "0");
        slots.push(`${normalized}:${minuteLabel} ${period}`);
      }
    }
    return slots;
  }, [calendarEndHour, calendarStartHour, formState.durationHours]);

  const weekDays = useMemo(() => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], []);

  // splits the ISOString fomratted date and takes the date segment only
  const formatDateKey = (date) => date.toISOString().split("T")[0];

  /* gets the day that starts off the week (sundays)
  getDay() returns the day of the week as a number (0-6)
  Example : March 16 Monday (current day) - jsDay (Monday would be [1]) = March 15 Sunday 

  getWeekStart is to get the current week of whichever day is currently selected
  */
  const getWeekStart = (date) => {
    const jsDay = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - jsDay);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  /*
  builds an array of 7 elements representing the day of the week
  */
  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, idx) => { // '_' unused element, idx - current index
      const next = new Date(start);
      next.setDate(start.getDate() + idx); // adds the current index (0–6) to the starting Sunday date to generate each day of the week
      return next;
    });
  }, [currentDate]);

  /* compact week view
  - shows two days on mobile for readability
  - aligns with the current date
  */
  const weekViewDates = useMemo(() => {
    if (!(isNarrow && viewMode === "week")) return weekDates;
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0); // reset time h,m,s,ms - to ensure consistency between comparing days
    const next = new Date(start);
    next.setDate(start.getDate() + 1); // moves forward 1 day
    return [start, next]; // returns an array of the 2 days
  }, [currentDate, isNarrow, viewMode, weekDates]); // if any of these changes, recompute

  const dayDate = useMemo(() => {
    const next = new Date(currentDate);
    next.setHours(0, 0, 0, 0); // reset the time on the day again to ensure that we are representing the start of the day
    return next;
  }, [currentDate]);

  /*
  in a calendar we always want to start off the month on a sunday
  same way a week does, so we include some days from the previous
  month to the current month to ensure of this.
  */
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1); // gets year, month, and first day of the month
    const last = new Date(year, month + 1, 0); // gets the next month but then uses '0' to get the last day of the previous month
    // copy of the previous objects
    const start = new Date(first);
    const end = new Date(last);

    // how many days to go backwards to start the month with a sunday
    start.setDate(first.getDate() - first.getDay());
    // amount of days needed to get to saturday to complete the full week
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

  // Convert fetched appointments into positioned calendar events for grid rendering.
  const calendarEvents = useMemo(() => {
    return appointments
      .filter((appt) => appt.status === "Confirmed")
      .map((appt) => {
        const time24 = to24h(appt.time); 
        const hour = Number(time24.split(":")[0] || 0);
        if (hour < calendarStartHour || hour > calendarEndHour) return null;

        const gridRowStart = Math.max(hour - calendarStartHour + 1, 1); // which row the event is positioned from, +1 so calendar starts at row 1
        const startAt = new Date(appt.startIso || "");
        const endAt = new Date(appt.endIso || "");
        const durationMs =
          !Number.isNaN(startAt.getTime()) &&
          !Number.isNaN(endAt.getTime()) &&
          endAt.getTime() > startAt.getTime()
            ? endAt.getTime() - startAt.getTime()
            : 60 * 60 * 1000;
        const span = Math.max(1, Math.round(durationMs / (60 * 60 * 1000)));

        const dateObj = new Date(`${appt.date}T00:00:00`);
        const dayIndex = dateObj.getDay();
        return {
          ...appt,
          gridRow: gridRowStart,
          gridCol: dayIndex + 1,
          span,
          timeLabel: appt.time,
        };
      })
      .filter(Boolean);
  }, [appointments, calendarEndHour, calendarStartHour]);

  /* day
- useMemo hook
- key: variable for the current date
- checks calendarevents for appointments that matches the current date
  */
  const visibleEvents = useMemo(() => {
    if (viewMode === "day") {
      const key = formatDateKey(dayDate);
      return calendarEvents.filter((appt) => appt.date === key);
    }
    if (viewMode === "week") {
      const keys = new Set(weekViewDates.map(formatDateKey));
      return calendarEvents.filter((appt) => keys.has(appt.date));
    }
    return calendarEvents;
  }, [calendarEvents, dayDate, viewMode, weekViewDates]);

  // Keep grid overlays in sync with the number of visible day columns.
  const calendarColumnCount = useMemo(() => {
    if (viewMode === "day") return 1;
    return weekViewDates.length;
  }, [viewMode, weekViewDates]);

  // Only render the live time marker when today's date is actually visible in the current view.
  const currentDayColumn = useMemo(() => {
    const todayKey = formatDateKey(now);

    if (viewMode === "day") {
      return formatDateKey(dayDate) === todayKey ? 1 : null;
    }

    if (viewMode === "week") {
      const idx = weekViewDates.findIndex((date) => formatDateKey(date) === todayKey);
      return idx === -1 ? null : idx + 1;
    }

    return null;
  }, [dayDate, now, viewMode, weekViewDates]);

  // Compute the live "current time" indicator position inside the calendar grid.
  /*line indicator
  - checks the current hour, mnutes
  - then checks if the current hours is less than the calendar start time
  and current hour is more than calendar end time >> returns null
  */
  const nowIndicator = useMemo(() => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour < calendarStartHour || currentHour > calendarEndHour) return null;

    /* nowindicator positioning
    - hoursFromStart represents how many hours into the calendar we currently are
    - offset vertical postioning of the nowindicator
    positioning calculation:
    hoursFromStart - hour since calendar start
    calendarRowHeight - height of one hour row
    calendarRowGap - space between rows

    (currentMinute / 60) * calendarRowHeight
    >> Represents how far we are into the hour
    - current minute within the hour / 60 * calendarRowHeight
    */
    const hoursFromStart = currentHour - calendarStartHour;
    const offset =
      calendarSizing.padding +
      hoursFromStart * (calendarSizing.rowHeight + calendarSizing.rowGap) +
      (currentMinute / 60) * calendarSizing.rowHeight;

      /* current time formatted to 00:00
      Gets the current time from "now" then converts the date to
      formatted time string with toLocaleTimeString

      { hour: "2-digit", minute: "2-digit" }),
       show the hour and minute with 2 digits
       24hour clock
      */
    return {
      label: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      offset,
    };

    /* 
    dependency array
    - compares previous values to current values
    then reruns the callback
    */
  }, [
    now,
    calendarStartHour,
    calendarEndHour,
    calendarSizing,
  ]);
  
/* Upon rendering the page this is to scroll the calendar to
  where the nowIndicator is*/
  useEffect(() => {
    if (!calendarScrollRef.current || !nowIndicator) return;
    const container = calendarScrollRef.current;
    const target = Math.max(nowIndicator.offset - 120, 0);
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [nowIndicator]);

  // Admin actions that actually change Google Calendar
  // functions implemented by jiro
  // Cancel an appointment through the backend and refresh the page data.
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

  // Reschedule an existing appointment through the backend.
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

  // Create a brand-new appointment through the backend.
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

    /* appointment details modal
    appt - the appointment selected
    source - the source from where handleDetails is called upon
    (booked component, or from the calendar
  */
  const handleDetails = (appt, source = null) => {
    setActiveAppointment(appt);
    setDetailSource(source);
  };
    /* if the user selected an appointment through the booked component
  instead of the calendar then closing that modal ensures that the "booked" appointments
  modal is shown again 
  
  setActivateAppointment to null closes the modal
  setShowBookedModal(true) - restores the previous modal*/
  const closeDetails = (returnToBooked = true) => {
    setActiveAppointment(null);
    if (returnToBooked && detailSource === "booked") setShowBookedModal(true);
    setDetailSource(null);
  };
  /* add appointment modal
  setEditingId - null ensures that the form behaves in an "Add appointment" mode
  setFormState - updates the form with default values
  service: activeServices[0]?.id ?? "fence", >> checks the first service of the array '?' only if it exists
  and if it does exists, returns the id. If it doesn't then return as undefined.
  if the value is null or undefined then '??' uses fallback "fence"
  ^^ prevents crashing
  */
  const openAddForm = () => {
    const defaultClient = sortedClients[0] || null;
    setEditingId(null);
    setFormState({
      clientId: defaultClient?.id ?? "",
      ...getClientFormFields(defaultClient),
      firstName: "",
      lastName: "",
      service: activeServices[0]?.id ?? "fence",
      visitType: "Estimate",
      durationHours: "1",
      date: formatDateKey(new Date()),
      time: "09:00 AM",
      notes: "",
    });
    setIsFormOpen(true);
  };

  /* Form editing mode
  sets the editingid to the appointment eventid
  splits the name between first name and last name
  (trim > removes extra spaces beginning or end, split > splits the string into an array)
  firstName gets the first part of the array > if array is empty then it uses "" as the fallback
  lastName uses slice to remove the first part, or starting at the first (1) index which is the second part of the name
  */
 
  const openEditForm = (appt) => {
    setEditingId(appt.eventId);
    const { firstName, lastName } = splitClientName(appt.client);
    setFormState({
      clientId: "",
      firstName,
      lastName,
      phone: "",
      email: appt.email || "",
      service: appt.serviceId || "fence",
      visitType: "Estimate",
      durationHours: "1",
      date: appt.date,
      time: appt.time,
      address: appt.address || "",
      notes: appt.notes || "",
    });
    setIsFormOpen(true);
  };

  /* closes the appointment form modal
  prev - copies everything from the previous form original state,
  then update the field that has been changed */
  const closeForm = () => setIsFormOpen(false);

  // Update the controlled form fields as the admin types/selects values.
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    if (name === "clientId") {
      const nextClient = clients.find((client) => client.id === value) || null;
      setFormState((prev) => ({
        ...prev,
        clientId: value,
        ...getClientFormFields(nextClient),
      }));
      return;
    }
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Shared submit handler: creates a new booking or reschedules an existing one.
  // runs when the form is submitted
  // preventDefault - preventing the page from refreshing when form is submitted
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    //backend
    if (!formState.date || !formState.time) return;

    // If editing, reschedule on server (delete+create in your reschedule route)
    // backend
    if (editingId) {
      const ok = window.confirm("Reschedule this appointment to the new date/time?");
      if (!ok) return;

      const success = await rescheduleOnServer(editingId, formState.date, formState.time);
      if (success) setIsFormOpen(false);
      return;
    }
    // backend
    // If adding, create on server
    if (!formState.clientId) {
      alert("Please select a client.");
      return;
    }

    const { firstName, lastName } = splitClientName(selectedClient?.name);
    // backend
    const payload = {
      service: formState.service, // service id (fence, pergola, etc)
      visitType: formState.visitType,
      durationHours: formState.durationHours,
      date: formState.date,
      time: formState.time,
      firstName: firstName || selectedClient?.name || "Client",
      lastName: lastName || "",
      email: formState.email,
      phone: formState.phone,
      address: formState.address || "",
      notes: formState.notes,
    };
    // backend
    const success = await createOnServer(payload);
    if (success) setIsFormOpen(false);
  };

  /* calendar view mode
  mode - being the parameter that is called upon depending on the view mode
  the user selects
  */
  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (mode === "day") setCurrentDate(new Date());
  };

  /* When the user clicks on "today" button
  this is ran which gets the current date with "new Date"
  then checks if viewMode isn't "day" and then sets view mode to "day"
  */
  const handleToday = () => {
    setCurrentDate(new Date());
    if (viewMode !== "day") setViewMode("day");
  };

  /* navigation between calendar days
  creates a copy of the current date with "next"
  then checks what viewmode the calendar is in.
  direction is the parameter in which the user is asking the calendar to navigate to.
  so (+1) parameter would add +1 from today's date (next.setDate(currentdate+1))
  vise versa
  same for week but this time we multiply the direction (1*7) because a week is 7 days
  on mobile week view we use 2-day steps for a compact layout
  month is similar to "day" except we are using getMonth() and then adding either +1 or -1
  */
  const shiftDate = (direction) => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(currentDate.getDate() + direction);
    else if (viewMode === "week") {
      const step = isNarrow ? 2 : 7;
      next.setDate(currentDate.getDate() + direction * step);
    }
    else next.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(next);
  };

  useEffect(() => {
    if (!isFormOpen || editingId || formState.clientId || !sortedClients.length) return;
    const defaultClient = sortedClients[0];
    setFormState((prev) => ({
      ...prev,
      clientId: defaultClient.id,
      ...getClientFormFields(defaultClient),
    }));
  }, [editingId, formState.clientId, isFormOpen, sortedClients]);

  useEffect(() => {
    if (!isFormOpen || editingId || !timeSlots.length) return;
    if (timeSlots.includes(formState.time)) return;
    setFormState((prev) => ({
      ...prev,
      time: timeSlots[0],
    }));
  }, [editingId, formState.time, isFormOpen, timeSlots]);

return (
    <AdminLayout>
      {/* Main wrapper for the appointments page content */}
      <div className="admin-appointments">

      {/* Hero / page header section showing title, subtitle, and refresh button */}
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Schedule overview</h1>
          <p className="admin-subtitle">Synced with Google Calendar bookings.</p>

          {/* Displays an error message if the appointments failed to load */}
          {error ? <p className="admin-subtitle" style={{ color: "#b91c1c" }}>{error}</p> : null}
        </div>

        {/* Button to manually refresh appointments from the backend / Google Calendar */}
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


      {/* Summary cards showing appointment statistics */}
      <section className="admin-summary-grid">

        {/* Card showing total upcoming appointments */}
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Upcoming</div>
          <div className="admin-stat-value">{upcoming}</div>
          <div className="admin-muted">Next 180 days</div>
        </article>

        {/* Card showing confirmed appointments and button to open booked list modal */}
        <article className="admin-card admin-card--stat">
          <div className="admin-stat-title">Confirmed</div>
          <div className="admin-stat-value">{confirmed}</div>

          {/* Opens modal listing all booked appointments */}
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


      {/* Main calendar container (changes layout depending on day/week/month view and screen size) */}
      <section
        className={`admin-calendar ${viewMode === "day" ? "admin-calendar--day" : ""} ${
          isNarrow && viewMode === "week" ? "admin-calendar--compact-week" : ""
        }`}
      >

        {/* Calendar header with title, view mode buttons, navigation, and add appointment button */}
        <div className="admin-calendar__header">

          {/* Displays the current month and year */}
          <div className="admin-calendar__title-stack">
            <h2 className="admin-calendar__title">
              {currentDate.toLocaleString([], { month: "long", year: "numeric" })}
            </h2>

            {/* Shows large day label when the calendar is in day view */}
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


          {/* Buttons that allow switching between Day / Week / Month views */}
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


          {/* Navigation controls for moving through the calendar and adding appointments */}
          <div className="admin-calendar__actions">

            {/* Previous / Today / Next navigation buttons */}
            <div className="admin-calendar__nav">
              <button
                className="admin-calendar__nav-btn"
                onClick={() => shiftDate(-1)}
                type="button"
                aria-label="Previous"
              >
                ‹
              </button>

              {/* Resets calendar to today's date */}
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

            {/* Opens modal form for creating a new appointment */}
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


        {/* Conditional rendering of the calendar body.
            Shows either the time-grid calendar (day/week) or the month grid view */}
        {viewMode !== "month" ? (

          /* Day / Week calendar layout */
          <div className="admin-calendar__body">
            <div className="admin-calendar__week">

              {/* Weekday header row shown only in week view */}
              {viewMode === "week" && (
                <div className="admin-calendar__days">
                  {weekViewDates.map((date) => {
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


              {/* Scrollable calendar grid that holds the hour slots and events */}
              <div className="admin-calendar__scroll" ref={calendarScrollRef}>
                <div
                  className="admin-calendar__scroll-grid"
                  style={{ "--calendar-row-count": calendarSlots.length }}
                >

                  {/* Left column showing hour labels */}
                  <div className="admin-calendar__times">
                    {calendarSlots.map((hour) => (
                      <div key={hour} className="admin-calendar__time">
                        {formatHourLabel(hour)}
                      </div>
                    ))}
                  </div>


                  {/* Main grid where appointment events are positioned */}
                  <div
                    className="admin-calendar__grid"
                    style={{
                      "--calendar-visible-columns": calendarColumnCount,
                      "--calendar-grid-padding": `${calendarSizing.padding}px`,
                    }}
                  >
                    {/* Vertical guides keep day columns visually separated. */}
                    <div className="admin-calendar__column-guides" aria-hidden="true">
                      {Array.from({ length: calendarColumnCount }, (_, index) => (
                        <div
                          key={`calendar-guide-${index + 1}`}
                          className={`admin-calendar__column-guide ${
                            index === 0 ? "is-first" : ""
                          }`}
                        />
                      ))}
                    </div>

                    {/* Empty rows representing hourly time slots */}
                    {calendarSlots.map((hour) => (
                      <div key={hour} className="admin-calendar__row" />
                    ))}


                    {/* Keep the time line full-width, but pin the dot to the boundary before today's visible day column. */}
                    {nowIndicator && currentDayColumn ? (
                      <div
                        className="admin-calendar__now-layer"
                        style={{ top: `${nowIndicator.offset}px` }}
                        aria-hidden="true"
                      >
                        <div className="admin-calendar__now">
                          <span
                            className="admin-calendar__now-dot"
                            style={{
                              left: `calc(((100% - (var(--calendar-visible-columns, 7) - 1) * var(--calendar-row-gap)) / var(--calendar-visible-columns, 7) + var(--calendar-row-gap)) * ${Math.max(currentDayColumn - 1, 0)})`,
                            }}
                          />
                          <span className="admin-calendar__now-line" />
                          <span className="admin-calendar__now-label">{nowIndicator.label}</span>
                        </div>
                      </div>
                    ) : null}


                    {/* Render appointment events inside the grid */}
                    {visibleEvents.map((appt) => (
                      <div
                        key={appt.eventId}
                        className={`admin-calendar__event ${
                          appt.status === "Confirmed"
                            ? "admin-calendar__event--confirmed"
                            : "admin-calendar__event--neutral"
                        }`}

                        /* Grid positioning logic determines which row/time and day column the event appears in */
                        style={{
                          gridRow: `${appt.gridRow} / span ${appt.span}`, // determines appt positioning vertically (time)
                          gridColumn: // determines appts positioning horizontally (day)
                            viewMode === "day"
                              ? "1 / span 1" // start at column 1, span across column 1
                              : isNarrow && viewMode === "week"
                                ? (() => {
                                    const idx = weekViewDates.findIndex(
                                      (date) => formatDateKey(date) === appt.date
                                    );
                                    return idx === -1 ? "1 / span 1" : `${idx + 1} / span 1`;
                                  })()
                                : `${appt.gridCol} / span 1`,
                        }}

                        role="button"
                        tabIndex={0}

                        /* Opens the appointment details modal when clicked */
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

          /* Month calendar layout */
          <div className="admin-calendar__month">

            {/* Weekday labels for month view */}
            <div className="admin-calendar__month-head">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="admin-calendar__month-day">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid of days for the month */}
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

                    /* Clicking a day switches to day view and shows that specific date */
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
{/* modal for appointments on the grid */}
      {activeAppointment && (
        <div className="admin-modal">
            {/*for when user clicks outside the form to close it*/}
          <button 
            className="admin-modal__backdrop"
            onClick={closeDetails}
            aria-label="Close appointment details"
            type="button"
          />
          <div className="admin-modal__content" role="dialog" aria-modal="true">
            <div className="admin-modal__header">
              <div>
                <h2 className="admin-title">{activeAppointment.client}</h2>
                <p className="admin-subtitle">{activeAppointment.eventId}</p>
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
{/* modal corresponding to add appointment form */}
      {isFormOpen && (
        <div className="admin-modal admin-modal--scrollable">
          {/*for when user clicks outside the form to close it*/}
          <button
            className="admin-modal__backdrop"
            onClick={closeForm}
            aria-label="Close appointment form"
            type="button"
          />
          <form
            className="admin-modal__content admin-modal__content--scrollable"
            role="dialog"
            aria-modal="true"
            onSubmit={handleFormSubmit}
          >
            <div className="admin-modal__header">
              <div>
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
                  <div className="admin-modal__full">
                    <label className="admin-label" htmlFor="clientId">Client</label>
                    <select
                      id="clientId"
                      name="clientId"
                      className="admin-input"
                      value={formState.clientId}
                      onChange={handleFormChange}
                      required
                      disabled={clientsLoading || !clients.length}
                    >
                      {!clients.length ? (
                        <option value="">
                          {clientsLoading ? "Loading clients..." : "No clients available"}
                        </option>
                      ) : null}
                      {sortedClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-label" htmlFor="clientPhone">Phone</label>
                    <input
                      id="clientPhone"
                      name="phone"
                      className="admin-input"
                      value={formState.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className="admin-label" htmlFor="clientEmail">Email</label>
                    <input
                      id="clientEmail"
                      name="email"
                      type="email"
                      className="admin-input"
                      value={formState.email}
                      onChange={handleFormChange}
                    />
                  </div>
                </>
              ) : null}

              <div className="admin-modal__full">
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

              {!editingId ? (
                <>
                  <div>
                    <label className="admin-label" htmlFor="visitType">Visit type</label>
                    <select
                      id="visitType"
                      name="visitType"
                      className="admin-input"
                      value={formState.visitType}
                      onChange={handleFormChange}
                      required
                    >
                      {VISIT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-label" htmlFor="durationHours">Duration</label>
                    <select
                      id="durationHours"
                      name="durationHours"
                      className="admin-input"
                      value={formState.durationHours}
                      onChange={handleFormChange}
                      required
                    >
                      {Array.from({ length: 8 }, (_, idx) => {
                        const hours = String(idx + 1);
                        return (
                          <option key={hours} value={hours}>
                            {hours} {hours === "1" ? "hour" : "hours"}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              ) : null}

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
              <button
                className="admin-btn admin-btn--primary"
                type="submit"
                disabled={busy}
              >
                {busy ? "Saving…" : editingId ? "Reschedule" : "Add Appointment"}
              </button>
              <button className="admin-btn admin-btn--ghost" type="button" onClick={closeForm} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
{/* modal for when user clicks on "booked" button*/}
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

            <div className="admin-booked-list admin-booked-list--booked">
              {bookedAppointments.length === 0 ? (
                <div className="admin-muted">No booked appointments.</div>
              ) : (
                bookedAppointments.map((appt) => (
                  <div key={appt.eventId} className="admin-booked-row">
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
{/* confirmation modal for canceling an appointment */}
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
                  const ok = await cancelOnServer(cancelTarget.eventId);
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
      </div>
    </AdminLayout>
  );
}
