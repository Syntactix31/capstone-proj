"use client"

import Link from "next/link";
import Image from "next/image";

import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";


export default function ClientPage() {


  return (
    <div className="overflow-hidden bg-white min-h-screen">
        <main>

        <header>
          <NavBar />
        </header>

              






          <Footer />
        </main>

    </div>

  );
}

