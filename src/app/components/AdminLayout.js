"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "./Navbar.js";

const MENU_ITEMS = [
  { id: "appointments", label: "Appointments", href: "/dashboard/appointments" },
  { id: "services", label: "Services", href: "/dashboard/services" },
  { id: "clients", label: "Clients", href: "/dashboard/clients" },
  { id: "invoices", label: "Invoices", href: "/dashboard/invoices" },
  { id: "estimates", label: "Estimates", href: "/dashboard/estimates" },
  { id: "payments", label: "Payments", href: "/dashboard/payments" },
  { id: "gallery", label: "Gallery", href: "/dashboard/gallery" },  
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (data?.user?.name) setUserName(data.user.name);
      } catch {
      }
    }

    loadMe();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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
          <Link href="/dashboard" className="admin-menu-link">
            <span>Dashboard</span>
            <span className="admin-menu-arrow">&gt;</span>
          </Link>
          <div className="admin-sidebar-divider" />
          <div className="admin-sidebar-section">Menu</div>
          <nav className="admin-menu">
            {MENU_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className="admin-menu-link">
                <span>{item.label}</span>
                <span className="admin-menu-arrow">&gt;</span>
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-divider" />
          {userName ? <div className="admin-muted">Signed in as {userName}</div> : null}
          <button className="admin-btn admin-btn--ghost admin-btn--small" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
