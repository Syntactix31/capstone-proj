"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "../../components/Navbar.js";

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

const MENU_ITEMS = [
  { id: "appointments", label: "Appointments", href: "/dashboard/appointments" },
  { id: "services", label: "Services", href: "/dashboard/services" },
  { id: "estimates", label: "Estimates", href: "/dashboard/estimates" },
  { id: "gallery", label: "Gallery", href: "/dashboard/gallery" },
  { id: "clients", label: "Clientele", href: "/dashboard/clients" },
  { id: "invoices", label: "Invoices", href: "/dashboard/invoices" },
  { id: "payments", label: "Payments", href: "/dashboard/payments" },
  { id: "reports", label: "Reports", href: "/dashboard/reports" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

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
        </div>
    </div>
    )
}

