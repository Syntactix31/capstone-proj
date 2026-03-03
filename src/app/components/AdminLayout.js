"use client";

import Link from "next/link";
import NavBar from "./Navbar.js";

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

export default function AdminLayout({ children }) {
  return (
    <div className="admin-page">
      <header className="admin-header">
        <NavBar />
      </header>

      <div className="admin-shell">
        <aside className="admin-sidebar border-t-8 border-[#31270c] ">
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
                <span className="admin-menu-arrow">&gt;</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
