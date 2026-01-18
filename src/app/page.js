import Link from "next/link";
import Image from "next/image";

import NavBar from "./components/Navbar.js";
import Footer from "./components/Footer.js";

export default function Home() {
  return (
    <div className="overflow-hidden ">
        <header className="flex min-h-screen w-full bg-white">
          <NavBar />         
        </header>

      <main className="flex min-h-screen w-full bg-white">
      </main>

      <Footer />

    </div>
  );
}




