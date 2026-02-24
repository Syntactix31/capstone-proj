"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

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
];

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

const CLIENTS = [
  {
    id: "C-201",
    name: "Jordan Lee",
    email: "jordan@example.com",
    phone: "(587) 555-0142",
    lastVisit: "2026-02-01",
    lifetimeValue: "$8,400",
  },
  {
    id: "C-202",
    name: "Avery Chen",
    email: "avery@example.com",
    phone: "(403) 555-0101",
    lastVisit: "2026-01-28",
    lifetimeValue: "$3,200",
  },
  {
    id: "C-203",
    name: "Taylor Singh",
    email: "taylor@example.com",
    phone: "(587) 555-0199",
    lastVisit: "2025-12-20",
    lifetimeValue: "$1,600",
  },
];

const STATUS_CLASS = {
  Pending: "admin-badge admin-badge--pending",
  Confirmed: "admin-badge admin-badge--active",
  Canceled: "admin-badge admin-badge--muted",
  Active: "admin-badge admin-badge--active",
  Inactive: "admin-badge admin-badge--muted",
};

const MENU_ITEMS = [
  { id: "appointments", label: "Appointments", href: "/dashboard/appointments" },
  { id: "services", label: "Services", href: "/dashboard/services" },
  { id: "estimates", label: "Estimates", href: "/dashboard/estimates" },
  { id: "clients", label: "Clients", href: "/dashboard/clients" },
  { id: "invoices", label: "Invoices", href: "/dashboard/invoices" },
  { id: "payments", label: "Payments", href: "/dashboard/payments" },
  { id: "reports", label: "Reports", href: "/dashboard/reports" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
  { id: "gallery", label: "Gallery", href: "/dashboard/gallery" },
];

export default function DashboardPage() {
    const router = useRouter();
    
    /*useEffect(() => {
        if (typeof window === "undefined") return;
        const role = localStorage.getItem("auth_role");
        if (role !== "admin") {
            router.replace("/auth");
        }
    }, [router]);*/

    const pendingCount = APPOINTMENTS.filter(
        (appt) => appt.status === "Pending"
    ).length;
    const confirmedCount = APPOINTMENTS.filter(
        (appt) => appt.status === "Confirmed"
    ).length;
    const canceledCount = APPOINTMENTS.filter(
        (appt) => appt.status === "Canceled"
    ).length;
    const activeServices = SERVICES.filter((service) => service.active).length;
    const inactiveServices = SERVICES.length - activeServices;
    const activeClients = CLIENTS.filter((client) => client.status === "Active")
    .length;
    const inactiveClients = CLIENTS.length - activeClients;
    const nextAppointment = APPOINTMENTS.filter(
        (appt) => appt.status !== "Canceled"
    ).sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <NavBar />
      </header>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-logo">LC</span>
            <div>
              <div className="admin-sidebar-title">Landscape Craftsmen</div>
              <div className="admin-sidebar-subtitle">Admin</div>
            </div>
          </div>
          <div className="admin-sidebar-section">Menu</div>
          <nav className="admin-menu">
            {MENU_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className="admin-menu-link">
                <span>{item.label}</span>
                <span className="admin-menu-arrow">›</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
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
            </div>
            <div className="admin-hero-actions">
              <button className="admin-btn admin-btn--primary">
                New Appointment
              </button>
              <button className="admin-btn admin-btn--ghost">
                Create Estimate
              </button>
              <button className="admin-btn admin-btn--ghost">Add Client</button>
            </div>
          </section>
          
          <section className="admin-summary-grid">
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Total appointments</div>
              <div className="admin-stat-value">{APPOINTMENTS.length}</div>
              <span className={STATUS_CLASS.Confirmed}>
                {confirmedCount} Confirmed
              </span>
            </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Pending approvals</div>
              <div className="admin-stat-value">{pendingCount}</div>
              <span className={STATUS_CLASS.Pending}>Needs review</span>
            </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Active services</div>
              <div className="admin-stat-value">{activeServices}</div>
              <div className="admin-muted">{inactiveServices} inactive</div>
            </article>
            <article className="admin-card admin-card--stat">
              <div className="admin-stat-title">Active clients</div>
              <div className="admin-stat-value">{activeClients}</div>
              <div className="admin-muted">{inactiveClients} inactive</div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}