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

export default function AdminLayout({ children, sidebarHidden = false }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  /* sidebar state
  - hides navigation by default on smaller screens
  - tracks when the user manually overrides the state
  */
  const [isSidebarHidden, setIsSidebarHidden] = useState(sidebarHidden);
  const [hasSidebarOverride, setHasSidebarOverride] = useState(false);
  const shellClassName = isSidebarHidden
    ? "admin-shell admin-shell--sidebar-hidden"
    : "admin-shell admin-shell--sidebar-open";

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

  /* sidebar auto hide on mobile
  - uses matchMedia for responsive defaults
  - avoids overriding user choice
  */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 980px)");
    const syncSidebar = () => {
      if (!hasSidebarOverride) setIsSidebarHidden(media.matches);
    };
    syncSidebar();
    if (media.addEventListener) {
      media.addEventListener("change", syncSidebar);
      return () => media.removeEventListener("change", syncSidebar);
    }
    media.addListener(syncSidebar);
    return () => media.removeListener(syncSidebar);
  }, [hasSidebarOverride]);

  /* sidebar toggle action
  - flips the nav drawer state
  - sets manual override flag
  */
  const toggleSidebar = () => {
    setHasSidebarOverride(true);
    setIsSidebarHidden((prev) => !prev);
  };

  /* close nav after selection
  - keeps mobile workflow simple after picking a page
  */
  const handleNavClick = () => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 980px)");
    if (!media.matches) return;
    setHasSidebarOverride(true);
    setIsSidebarHidden(true);
  };

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

      <div className={shellClassName}>
        <button
          className="admin-sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarHidden ? "Open navigation" : "Close navigation"}
          aria-pressed={!isSidebarHidden}
        >
          {isSidebarHidden ? "›" : "‹"}
        </button>
        <button
          className="admin-sidebar-backdrop"
          type="button"
          onClick={toggleSidebar}
          aria-hidden={isSidebarHidden}
          tabIndex={isSidebarHidden ? -1 : 0}
        />
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-logo">LC</span>
            <div>
              <div className="admin-sidebar-title">Landscape Craftsmen</div>
              <div className="admin-sidebar-subtitle">Admin</div>
            </div>
          </div>
          <Link href="/dashboard" className="admin-menu-link" onClick={handleNavClick}>
            <span>Dashboard</span>
            <span className="admin-menu-arrow">&gt;</span>
          </Link>
          <div className="admin-sidebar-divider" />
          <div className="admin-sidebar-section">Menu</div>
          <nav className="admin-menu">
            {MENU_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className="admin-menu-link" onClick={handleNavClick}>
                <span>{item.label}</span>
                <span className="admin-menu-arrow">&gt;</span>
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-divider" />
            {userName ? <div className="admin-user">Signed in as {userName}</div> : null}
            <button className="admin-btn admin-btn--ghost admin-btn--small" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
