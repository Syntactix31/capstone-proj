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

export default function DashboardPage() {
  return (
    <div>
      <NavBar />
      <main>Dashboard</main>
      <Footer />
    </div>
  );
}