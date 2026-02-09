"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";


import DropDownMenu from "./DropDownMenu.js";

export default function NavBar () {

  const [navClicked, setNavClicked] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleNavClick = () => {
    if (!navClicked) {
      setNavClicked(true);
      setIsAnimatingOut(false);

    } else {
      setIsAnimatingOut(true);

    }
  }

  const closeMenu = () => {
    setIsAnimatingOut(true);
  };

  // timeout delay should be 300 to match animation duration but ti glitches due to rendering issues n browser limitations used 280
  useEffect(() => {
    if (isAnimatingOut) {
      const timer = setTimeout(() => {
        setNavClicked(false);
        setIsAnimatingOut(false);
      },280);

      return () => clearTimeout(timer);
    }
  }, [isAnimatingOut]);

  useEffect(() => {
    if (navClicked && !isAnimatingOut) {
      document.body.style.overflow = 'hidden';

    } else {
      document.body.style.overflow = 'unset';

    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [navClicked, isAnimatingOut]);


  return (
      <>
        {/* Find a good bg-black/# thats not too dark or light for background dim */}
        {(navClicked || isAnimatingOut) && (
          <div 
            className="fixed inset-0 bg-black/35 z-998 animate-fadeIn pointer-events-auto"
            onClick={closeMenu}
          />
        )}
          <nav className="bg-[#477a40] h-30 w-full p-4 flex text-white items-center justify-between">

            <div className="flex gap-5 items-center">
              <Link href="/">
                <Image src="/icons/Landscapecraftsmen_logo.jpg" alt="Company Logo" height="400" width="400" className="h-20 w-20" priority/>  
                
                {/* PLacehodler image logo */}
                {/* <div className="w-20 bg-white h-20 text-black font-bold text-2xl text-center pt-5">Logo</div> */}
              </Link>

              <Link href="/">
                <h1 className="text-2xl font-bold flex flex-col">
                  <span>Landscape</span>
                  <span>Craftsmen</span>
                </h1>              
              </Link>

            </div>

            {/* Prefer the thinner font on static nav items (semibold should be used) */}
            <div className="flex justify-center items-center lg:gap-20 md:mr-10 lg:mr-10">
              <ul className="hidden lg:flex gap-10 ml-20 font-medium">
                <li><Link href="/about" className="hover:opacity-60">About</Link></li>
                <li><Link href="/services" className="hover:opacity-60">Services</Link></li>
                <li><Link href="/contact" className="hover:opacity-60">Contact</Link></li>
              </ul>

              <div className="relative z-10 p-2 hover:opacity-50 hover:cursor-pointer flex flex-col gap-2" onClick={handleNavClick}>
                <hr className="w-10 border-white"/>
                <hr className="w-10 border-white"/>
                <hr className="w-10 border-white"/>
              </div>
            </div>


          </nav>
          
          {/* NOTE: Cant render here! */}
          {(navClicked || isAnimatingOut) && (<DropDownMenu onClose={closeMenu} isAnimatingOut={isAnimatingOut} />) }
      </>

  );

}



// Theo's Logo

              // <div className="justify-self-center">
              //   <Link href="/" className="block">
              //     <div className="w-40 h-20 flex items-center justify-center">
              //       <Image
              //         src="/icons/logo0.png"
              //         alt="Company logo"
              //         width={400}
              //         height={400}
              //         className="object-contain"
              //         priority
              //       />
              //     </div>
              //   </Link>
              // </div>

