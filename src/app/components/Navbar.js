"use client"

import Link from "next/link";
import { useState } from "react";

import DropDownMenu from "./DropDownMenu.js";

export default function NavBar () {

  const [navClicked, setNavClicked] = useState(false);

  const handleNavClick = () => {
    setNavClicked(!navClicked);
  }

  const closeMenu = () => {
    setNavClicked(false);
  };



  return (
      <>
          <nav className="bg-[#477a40] h-30 w-full p-4 flex text-white items-center justify-between">

            <div className="flex gap-5 items-center">

              {/* Theo replace this with logo */}
              <Link href="/">              
                <div className="w-20 bg-white h-20 text-black font-bold text-2xl text-center pt-5">Logo</div>
              </Link>

              <Link href="/">
                <h1 className="text-2xl font-bold flex flex-col">
                  <span>Landscape</span>
                  <span>Craftsmen</span>
                </h1>              
              </Link>

            </div>

            <div className="flex justify-center items-center lg:gap-20 md:mr-10 lg:mr-10">
              <ul className="hidden lg:flex gap-10 ml-20 ">
                <li><Link href="/about" className="hover:opacity-60">About</Link></li>
                <li><Link href="/services" className="hover:opacity-60">Services</Link></li>
                <li><Link href="/contact" className="hover:opacity-60">Contact</Link></li>
              </ul>

              <div className="relative z-10 p-2 hover:opacity-50 hover:cursor-pointer flex flex-col gap-2" onClick={handleNavClick}>
                <hr className="w-10 "/>
                <hr className="w-10 "/>
                <hr className="w-10 "/>
              </div>
            </div>


          </nav>
          
          {/* NOTE: Cant render here! */}
          {navClicked && <DropDownMenu onClose={closeMenu} /> }
      </>

  );
}

