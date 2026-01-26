import Link from "next/link";

export default function DropDownMenu () {


  return (
      <div className="bg-[#477A40] w-80 h-100  flex flex-col gap-10 text-white text-center font-semibold p-10 *:hover:scale-105 *:transition-transform *:duration-200 *:active:opacity-50 *:active:scale-100 top-outline shadow z-100">
        <Link href="/projects">Projects</Link>
        <Link href="/quote">Get A Quote</Link>
        <Link href="/appointments">Book An Appointment</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/login">Login</Link>

      </div>

  );
}







