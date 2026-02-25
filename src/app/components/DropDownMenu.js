import Link from "next/link";

export default function DropDownMenu ({ onClose, isAnimatingOut }) {


  return (
    <div className={`absolute top-30 right-0 z-999 pointer-events-none animate-slideIn ${isAnimatingOut ? 'animate-slideOut' : 'animate-slideIn'
    }`}>
      <div className="bg-[#477A40] w-80 h-fit lg:h-100  flex flex-col gap-10 text-white text-center font-semibold p-10 *:hover:scale-105 *:transition-transform *:duration-200 *:active:opacity-50 pointer-events-auto *:active:scale-100 top-outline shadow-2xl z-100">

        
        <Link href="/about" className="hidden max-lg:inline" onClick={onClose}>About</Link>
        <Link href="/services" className="hidden max-lg:inline" onClick={onClose}>Services</Link>
        <Link href="/contact" className="hidden max-lg:inline" onClick={onClose}>Contact</Link>


        <Link href="/projects" onClick={onClose}>Projects</Link>
        <Link href="/quote" onClick={onClose}>Get A Quote</Link>
        <Link href="/book" onClick={onClose}>Book An Appointment</Link>
        <Link href="/dashboard" onClick={onClose}>Admin</Link>
        <Link href="/login" onClick={onClose}>Login</Link>

      </div>
    </div>
  );
}



// Check to see why shadow on drop down is not working it has a weird bevel on the left, right, and bottom sides

// DROP DOWN FOR MOBILE SHOULD FIT FULLSCREEN AND ANIMATE FROM TOP DOWN

// DROP DOWN FOR MEDIUM VIEWPORTS AND SMALLER SHOULD INCLUDE THE ABOUT SERVICES AND CONTACT PAGES





