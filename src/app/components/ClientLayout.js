"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "./Navbar.js";
import Footer from "./Footer.js";

const CLIENT_MENU = [
  { id: "home", label: "Dashboard", href: "/client" },
  { id: "projects", label: "Projects", href: "/client/projects" },
  { id: "estimates", label: "Estimates", href: "/client/estimates" },
  { id: "payments", label: "Payments", href: "/client/payments" },
  { id: "settings", label: "Settings", href: "/client/settings" },
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.user?.name) setUserName(data.user.name);
    }
    loadUser();
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="client-page">
      <header className="client-header">
        <NavBar />
      </header>

      <div className="client-shell">
        <aside className="client-sidebar">
          <div className="client-sidebar-header">
            <span className="client-logo">LC</span>
            <div className="client-title-text">Landscape Craftsmen</div>
            <div className="client-subtitle">Client Portal</div>
          </div>
          <nav className="client-menu">
            {CLIENT_MENU.map((item) => (
              <Link key={item.id} href={item.href} className="client-menu-link">
                <span>{item.label}</span>
                <span className="client-menu-arrow">›</span>
              </Link>
            ))}
          </nav>
          <div className="client-sidebar-footer">
            {userName && <div className="client-user">Hi, {userName}</div>}
            <button className="client-btn client-btn--logout" onClick={handleSignOut}>
              Log out
            </button>
          </div>
        </aside>
        <main className="client-main">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
