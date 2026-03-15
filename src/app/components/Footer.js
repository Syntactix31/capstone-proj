import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#31270C] w-full text-white py-12 px-6 md:px-12 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Top Section - Logo/Contact + Social + Nav */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center mb-8 pb-8 border-b border-[#31270C]/30">
          
          {/* Logo/Contact Info */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white tracking-tight">
              Landscape Craftsmen
            </h2>
            <div className="space-y-2 text-sm md:text-base">
              <a 
                href="mailto:landscapecraftsmen@yahoo.com" 
                className="block hover:text-[#F4A261] transition-colors duration-200 font-medium"
              >
                landscapecraftsmen@yahoo.com
              </a>
              <a 
                href="tel:+15874386672" 
                className="block hover:text-[#F4A261] transition-colors duration-200 font-medium"
              >
                (587) 438-6672
              </a>
              <p className="text-[#D9D9D9]">Calgary, AB, Canada</p>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="hidden md:block text-center">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/services" className="hover:text-[#F4A261] transition-colors duration-200">
                Services
              </Link>
              <Link href="/quote" className="hover:text-[#F4A261] transition-colors duration-200">
                Get Quote
              </Link>
              <Link href="/about" className="hover:text-[#F4A261] transition-colors duration-200">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-[#F4A261] transition-colors duration-200">
                Contact
              </Link>
            </div>
          </nav>

          {/* Social Media - Desktop */}
          <div className="flex justify-center md:justify-end space-x-6">
            <a
              href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group"
            >
              <Image 
                src="/icons/facebook.png" 
                alt="Facebook" 
                height={28} 
                width={28} 
                className="w-7 h-7 group-hover:scale-110 transition-all duration-200 filter brightness-0 invert"
              />
            </a>
            <a
              href="https://www.instagram.com/landscape.craftsmen"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group"
            >
              <Image 
                src="/icons/instagram.png" 
                alt="Instagram" 
                height={28} 
                width={28} 
                className="w-7 h-7 group-hover:scale-110 transition-all duration-200 filter brightness-0 invert"
              />
            </a>
          </div>
        </div>

        {/* Bottom Section - Mobile Nav + Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-[#31270C]/20">
          
          {/* Mobile Quick Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm md:hidden">
            <Link href="/services" className="hover:text-[#F4A261] transition-colors duration-200 font-medium">
              Services
            </Link>
            <Link href="/quote" className="hover:text-[#F4A261] transition-colors duration-200 font-medium">
              Get Quote
            </Link>
            <Link href="/about" className="hover:text-[#F4A261] transition-colors duration-200 font-medium">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-[#F4A261] transition-colors duration-200 font-medium">
              Contact
            </Link>
          </nav>

          {/* Social Media - Mobile */}
          <div className="flex justify-center sm:justify-end space-x-6 flex-shrink-0 md:hidden">
            <a
              href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group"
            >
              <Image 
                src="/icons/facebook.png" 
                alt="Facebook" 
                height={24} 
                width={24} 
                className="w-6 h-6 group-hover:scale-110 transition-all duration-200 filter brightness-0 invert"
              />
            </a>
            <a
              href="https://www.instagram.com/landscape.craftsmen"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group"
            >
              <Image 
                src="/icons/instagram.png" 
                alt="Instagram" 
                height={24} 
                width={24} 
                className="w-6 h-6 group-hover:scale-110 transition-all duration-200 filter brightness-0 invert"
              />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-[#D9D9D9] mt-4 sm:mt-0">
            <p>&copy; 2026 Landscape Craftsmen. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
