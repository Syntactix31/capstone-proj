"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/AdminLayout.js";

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
    status: "Confirmed",
  },
  {
    id: "A-1003",
    client: "Taylor Singh",
    service: "Pergola",
    date: "2026-03-06",
    time: "9:00 AM",
    address: "912 10 St NW, Calgary",
    status: "Canceled",
  },
  {
    id: "A-1004",
    client: "Morgan Park",
    service: "Sod Installation",
    date: "2026-03-08",
    time: "2:00 PM",
    address: "80 17 Ave NE, Calgary",
    status: "Confirmed",
  },
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
    
    /*useEffect(() => {
        if (typeof window === "undefined") return;
        const role = localStorage.getItem("auth_role");
        if (role !== "admin") {
            router.replace("/auth");
        }
    }, [router]);*/

  const upcoming = appointments.filter((appt) => appt.status !== "Canceled").length;
  const pending = appointments.filter((appt) => appt.status === "Pending").length;
  const confirmed = appointments.filter((appt) => appt.status === "Confirmed").length;

    return (
        <AdminLayout>
            {/*hero card*/}
            <section className="admin-hero">
                <div>
                <p className="admin-kicker">Appointments</p>
                <h1 className="admin-title">Schedule overview</h1>
                <p className="admin-subtitle">
                    Manage appointments, and track upcoming visits.
                </p>
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
                <span className={STATUS_CLASS.Pending}>Needs review</span>
                </article>
                <article className="admin-card admin-card--stat">
                    <div className="admin-stat-title">Confirmed</div>
                    <div className="admin-stat-value">{confirmed}</div>
                <span className={STATUS_CLASS.Confirmed}>Locked in</span>
                </article>
            </section>
        </AdminLayout>
    )
}

