 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DropDownMenu ({ onClose, isAnimatingOut }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadAuthState() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        setUser(data?.user || null);
      } catch {
        if (!active) return;
        setUser(null);
      }
    }

    loadAuthState();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onClose?.();
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    // Changed from absolute to fixed to prevent horizontal scroll and see it it works properly for mobile viewports
    <div className={`fixed top-30 right-0 z-999 pointer-events-none animate-slideIn ${isAnimatingOut ? 'animate-slideOut' : 'animate-slideIn'
    }`}>
      
      {/* original width sm:w-80 and mobile w-75 */}
      <div className="bg-[#477A40] w-74 sm:w-72 h-fit flex flex-col gap-10 text-white text-center font-semibold p-10 *:hover:scale-105 *:transition-transform *:duration-200 *:active:opacity-50 pointer-events-auto *:active:scale-100 top-outline shadow-2xl z-100">

        
        <Link href="/about" className="hidden max-lg:inline" onClick={onClose}>About</Link>
        <Link href="/services" className="hidden max-lg:inline" onClick={onClose}>Services</Link>
        <Link href="/contact" className="hidden max-lg:inline" onClick={onClose}>Contact</Link>


        <Link href="/projects" onClick={onClose}>Projects</Link>
        <Link href="/quote" onClick={onClose}>Get A Quote</Link>
        <Link href="/book" onClick={onClose}>Book An Appointment</Link>
        {user?.role === "client" && <Link href="/client-dashboard" onClick={onClose}>Your Dashboard</Link>}
        {user?.role === "admin" && <Link href="/dashboard" onClick={onClose}>Admin</Link>}
        {user ? (
          <button type="button" onClick={handleLogout} disabled={busy}>
            {busy ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <Link href="/login" onClick={onClose} className="">Login</Link>
        )}

      </div>
    </div>
  );
}



// Check to see why shadow on drop down is not working it has a weird bevel on the left, right, and bottom sides - DONE

// DROP DOWN FOR MOBILE SHOULD FIT FULLSCREEN AND ANIMATE FROM TOP DOWN

// DROP DOWN FOR MEDIUM VIEWPORTS AND SMALLER SHOULD INCLUDE THE ABOUT SERVICES AND CONTACT PAGES - DONE






