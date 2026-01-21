import Link from "next/link";
import Image from "next/image";

import NavBar from "./components/Navbar.js";
import Footer from "./components/Footer.js";

export default function Home() {
  return (
    <div className="overflow-hidden">
        <header className="flex w-full bg-white">
          <NavBar />         
        </header>

      <main className="flex min-h-screen w-full bg-white">
        <div className="border-[#477a40] border-4 w-100 h-100 mt-10 ml-4">
          <h2 className="text-3xl font-extrabold">The Contracting Company You Can Trust</h2>
          <h3>All your landscaping needs done by professionals.</h3>
          <p></p>
        </div>


      </main>

      <Footer />

    </div>
  );
}




