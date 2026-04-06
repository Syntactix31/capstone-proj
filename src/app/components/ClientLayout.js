"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "./Navbar.js";

const CLIENT_MENU = [
  { id: "projects", label: "Projects", href: "/client/projects" },
  { id: "estimates", label: "Estimates", href: "/client/estimates" },
  { id: "payments", label: "Payments", href: "/client/payments" },
  { id: "appointments", label: "Appointments", href: "/client/appointments" },
  { id: "settings", label: "Settings", href: "/client/settings" },
];

export default function ClientLayout({ children, sidebarHidden = false }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("LC"); //default which is safe

  const [isSidebarHidden, setIsSidebarHidden] = useState(sidebarHidden);
  const [hasSidebarOverride, setHasSidebarOverride] = useState(false);

  const shellClassName = isSidebarHidden
    ? "admin-shell admin-shell--sidebar-hidden"
    : "admin-shell admin-shell--sidebar-open";

  const getInitials = (fullName) => {
    if (!fullName) return "LC";
    
    const names = fullName.trim().split(/\s+/);
    if (names.length === 0) return "LC";
    
    const firstInitial = names[0][0]?.toUpperCase() || "L";
    const lastInitial = names[names.length - 1][0]?.toUpperCase() || "C";
    
    return firstInitial + lastInitial;
  };

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        // added ,next: { revalidate: 0 } to fix an issue with db stale caching
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (data?.user?.name) {
          setUserName(data.user.name);
          setUserInitials(getInitials(data.user.name));
        }
      } catch {
        // ignore
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  // auto hide on mobile – same as admin
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 980px)");

    const syncSidebar = () => {
      if (!media.matches) {
        setIsSidebarHidden(false);
        return;
      }
      if (!hasSidebarOverride) setIsSidebarHidden(true);
    };

    syncSidebar();

    if (media.addEventListener) {
      media.addEventListener("change", syncSidebar);
      return () => media.removeEventListener("change", syncSidebar);
    }

    media.addListener(syncSidebar);
    return () => media.removeListener(syncSidebar);
  }, [hasSidebarOverride]);

  const toggleSidebar = () => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(max-width: 980px)");
      if (!media.matches) return;
    }
    setHasSidebarOverride(true);
    setIsSidebarHidden((prev) => !prev);
  };

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
            {/* Change the following to allow profile photo uploads */}
            {/* <span className="admin-sidebar-logo">LC</span> */}
            <span className="admin-sidebar-logo">{userInitials}</span>

            <div>
              <div className="admin-sidebar-title">{userName}</div>
              <div className="admin-sidebar-subtitle">Client Portal</div>
            </div>
          </div>

          <Link
            href="/client"
            className="admin-menu-link mb-5"
            onClick={handleNavClick}
          >
            <span>Dashboard</span>
            <span className="admin-menu-arrow">&gt;</span>
          </Link>

          <div className="admin-sidebar-section">Menu</div>

          <nav className="admin-menu">
            {CLIENT_MENU.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="admin-menu-link"
                onClick={handleNavClick}
              >
                <span>{item.label}</span>
                <span className="admin-menu-arrow">&gt;</span>
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-divider" />
            {userName ? (
              <div className="admin-user">Signed in as {userName}</div>
            ) : null}
            <button
              className="admin-btn admin-btn--ghost admin-btn--small"
              type="button"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>

    </div>
  );
}




