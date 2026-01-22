import Link from "next/link";
import Image from "next/image";

import NavBar from "./components/Navbar.js";
import Footer from "./components/Footer.js";

export default function Home() {

  const images = [
  "/projects/0ca9cee4-984b-4379-9e97-339140fcc257.JPG",
  "/projects/2e084da0-0d96-44f0-a943-3f9080bd1191.JPG",
  "/projects/9a8bb317-ee87-4071-bcd1-9d7ac9690ccc.JPG",
  "/projects/9e2d7e4d-d537-4324-8291-a7169bd60fe9.JPG",
  "/projects/43a2614c-3692-429f-bf0a-bcd1c4ee4ce6.JPG",
  "/projects/53a7773d-92c1-47ee-a7cd-573065ba01eb.JPG"
];




  return (
    
    <div className="overflow-hidden">
        <header className="flex w-full bg-white">
          <NavBar />         
        </header>

      <main className="flex flex-col min-h-screen w-full bg-white gap-20">


        <div className="w-full mx-auto max-w-6xl px-4">
          <section className="w-200 relative mt-10 overflow-hidden rounded-xl border border-[#477a40]/20 bg-gradient-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12 mx-auto">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded- bg-[#477a40]/10 blur-3xl" />
 
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#477a40]/10 px-3 py-1 text-sm font-semibold text-[#2f5a29]">
                Licensed • Insured • Free Estimates
              </p>
 
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900  w-160 sm:text-5xl">
                The Contracting Company You Can Trust
              </h1>
 
              <h2 className="mt-4 max-w-2xl text-lg leading-relaxed text-black font-bold">
                All your landscaping needs done by professionals—clean work, clear
                communication, and results that last.
              </h2>
 
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
              </p>
            </div>  

            <Link href="/about" className="font-bold ml-138 active:text-[15px]"><span className="hover:underline hover:underline-offset-4 ">Learn More</span> &rarr;</Link>
          </section>

        </div>

        <div>
          <h2 className="mx-auto w-85 text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">Our Projects</h2>
        </div>


        <div className="w-full mx-auto max-w-6xl px-4 relative">
          <div className="flex flex-col justify-self-auto gap-3 h-[500px] md:h-[600px] relative">
            {/* Top middle */}
            <div className="relative col-span-2 row-span-2 rounded-xl overflow-hidden shadow-lg w-120 h-80">
              <Image src={images[0]} alt="Project 1" fill sizes="550px" className="object-cover hover:brightness-110 transition-all" />
            </div>
            
            {/* Top right */}
            <div className="relative row-span-1 rounded-xl overflow-hidden shadow-lg w-40 h-80">
              <Image src={images[1]} alt="Project 2" fill sizes="350px" className="object-cover hover:brightness-110 transition-all" />
            </div>

            {/* Top left tall */}
            <div className="relative col-span-2 row-span-3 rounded-xl overflow-hidden shadow-lg w-80 h-100">
              <Image src={images[4]} alt="Project 5" fill sizes="400px" className="object-cover hover:brightness-110 transition-all" />
            </div>       


            {/* Bottom Middle */}
            <div className="relative row-span-2 rounded-xl overflow-hidden shadow-lg w-110 h-90">
              <Image src={images[2]} alt="Project 3" fill sizes="500px" className="object-cover hover:brightness-110 transition-all" />
            </div>

            {/* Bottom right */}
            <div className="relative rounded-xl overflow-hidden shadow-lg w-70 h-90">
              <Image src={images[5]} alt="Project 6" fill sizes="300px" className="object-cover hover:brightness-110 transition-all" />
            </div>  

            {/* Bottom left */}
            <div className="relative col-span-1 row-span-1 rounded-xl overflow-hidden shadow-lg w-70 h-70">
              <Image src={images[3]} alt="Project 4" fill sizes="200px" className="object-cover hover:brightness-110 transition-all" />
            </div>

                        

            


            <div className=" inset-0 flex items-center justify-center">
              <div className="p-4 mx-auto text-white rounded-2xl bg-[#477a40] text-2xl font-normal w-70 text-center hover:cursor-pointer border-2 border-transparent hover:bg-[#f3fff3] hover:border-[#477A40] hover:text-[#477A40] transition-all duration-200 hover:scale-105 active:scale-95 ">
                Request a Quote
              </div>
            </div>
          </div> 


        </div>


      </main>

      <Footer />

    </div>
  );
}


