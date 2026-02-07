import Link from "next/link";
import Image from "next/image";

import NavBar from "./components/Navbar.js";
import Footer from "./components/Footer.js";
import DropDownMenu from "./components/DropDownMenu.js";

import CommentCarousel from "./components/CommentsCarousel.js";

export default function Home() {

  const images = [
    "/projects/Img5.JPG",
    "/projects/Img1.JPG",
    "/projects/Img2.JPG",
    "/projects/Img4.JPG",
    "/projects/Img3.JPG",
    "/projects/Img6.JPG"
  ];




  return (
    
    <div className="overflow-hidden bg-white">
        <header className="flex w-full bg-white">
          <NavBar />         
        </header> 

         {/* HERE */}
        {/* <DropDownMenu /> */}




      <main className="flex flex-col min-h-screen w-full bg-white gap-15">


        <div className="w-full mx-auto max-w-8xl px-4">
          <section className="max-w-350 relative mt-10 overflow-hidden rounded-xl border border-[#477a40]/20 bg-linear-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12 mx-auto flex flex-col lg:flex-row gap-x-25 gap-y-8 lg:gap-y-0">
            <div className="flex  flex-col w-full lg:w-auto lg:flex-1">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#477a40]/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded- bg-[#477a40]/10 blur-3xl" />
  
              <div className="relative z-10">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#477a40]/10 px-3 py-1 text-sm font-semibold text-[#2f5a29]">
                  Licensed • Insured • Free Estimates
                </p>
                
                {/* Use the following for reference to fix title not resizing properly:
                
                mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 break-words hyphens-auto leading-tight w-full max-w-none overflow-visible */}
                <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 w-full sm:160">
                  The Contracting Company You Can Trust
                </h1>
  
                <h2 className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-black sm:font-bold">
                  All your landscaping needs done by professionals—clean work, clear
                  communication, and results that last.
                </h2>
  
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 hidden sm:block">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
                </p>
              </div>  
              
              {/* ml-138 for learn more positioning */}
              <Link href="/about" className="font-bold active:text-[15px] text-right h-6 mr-0 min-[1219px]:mr-6 max-[1220px]:mt-5  min-[1221px]:mt-0"><span className="hover:underline hover:underline-offset-4 ">Learn More</span> &rarr;</Link>
          
            </div>

            <div className="flex flex-col gap-10 items-center">
              <h3 className="w-85 text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">What We Offer</h3>
              <div className="justify-center gap-y-5 gap-x-10 items-center w-130 z-200 flex flex-col 
                min-[640px]:flex-row 
                max-[1024px]:flex-wrap
                min-[1024px]:max-[1149px]:flex-col 
                min-[1150px]:flex-row 
                min-[1024px]:flex-wrap  *:hover:scale-102 *:text-center *:items-center *:align-center *:flex *:justify-center *:sm:text-4xl *:text-2xl *:font-black *:cursor-pointer *:transition-all">
                <div className="h-25 w-60 rounded-2xl shadow-xl fence-bg">
                  <p className="fence-mask">Fence</p>

                </div>
                <div className="h-25 w-60 rounded-2xl shadow-xl deck-bg">
                  <p className="deck-mask">Deck & Railing</p>

                </div>     
                <div className="h-25 w-60 rounded-2xl shadow-xl pergola-bg">
                  <p className="pergola-mask ">Pergola</p>

                </div>
                <div className="h-25 w-60 rounded-2xl shadow-xl sod-bg">
                  <p className="sod-mask text-transparent">Sod</p>

                </div> 

                <div className="h-25 w-60 rounded-2xl shadow-xl trees-bg">
                  <p className="trees-mask text-transparent">Trees & Shrubs</p>

                </div>           
                


              </div>
            </div>
          </section>
        </div>

        <div>
          <h2 className="mx-auto w-85 text-center p-2 text-3xl font-extrabold border-b-2 border-[#477a40] text-black">Our Projects</h2>
        </div>


        <div className="w-full mx-auto max-w-6xl px-4 relative">
          <div className="flex flex-wrap justify-center items-center gap-4 relative w-full">

            {/* Top Left */}
            <div className="relative rounded-xl overflow-hidden shadow-lg shrink-0 w-80 h-80">
              <Image src={images[4]} alt="Project 5" fill sizes="400px" className="object-cover hover:brightness-110 transition-all" loading="eager" />
            </div>

            {/* Top Center */}
            <div className="relative rounded-xl overflow-hidden shadow-lg shrink-0 w-80 h-60">
              <Image src={images[0]} alt="Project 1" fill sizes="550px" className="object-cover hover:brightness-110 transition-all" />
            </div>

            {/* Top Right */}
            <div className="relative rounded-xl overflow-hidden shadow-lg shrink-0 lg:w-48 w-80 h-72">
              <Image src={images[1]} alt="Project 2" fill sizes="350px" className="object-cover hover:brightness-110 transition-all" />
            </div>

            {/* Center Button */}

            {/* hover:bg-[#f3fff3] */}
            <div className="flex justify-center items-center w-full my-4">
              <div className="p-4 mx-auto text-white rounded-2xl bg-[#477a40] text-2xl font-normal w-72 text-center hover:cursor-pointer border-2 border-transparent hover:bg-white hover:border-[#477A40] hover:text-[#477A40] transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-sm">
                <Link href="/quote">Request a Quote</Link>
              </div>
            </div>

            {/* Bottom Left */}
            <div className="relative rounded-xl overflow-hidden shrink-0 lg:w-56 w-80 h-72 transparent-gradient">
              <Image src={images[3]} alt="Project 4" fill sizes="200px" className="object-cover hover:brightness-110 transition-all " />
            </div>

            {/* Bottom Middle */}
            <div className="relative rounded-xl overflow-hidden shrink-0 w-80 h-64">
              <Image src={images[2]} alt="Project 3" fill sizes="500px" className="object-cover hover:brightness-110 transition-all transparent-gradient" />
            </div>

            {/* Bottom Right */}
            <div className="relative rounded-xl overflow-hidden shrink-0 lg:w-64 w-80 h-72">
              <Image src={images[5]} alt="Project 6" fill sizes="300px" className="object-cover hover:brightness-110 transition-all transparent-gradient-special-needs" />
            </div>
          </div>

          <div className="mt-4 border-t-4 border-[#477a40] md:w-full max-w-md md:max-w-2xl mx-auto p-4 text-xl md:text-2xl text-center flex justify-center">
            <Link href="/projects" className="font-bold text-black">
              <span className="hover:underline hover:underline-offset-4 active:underline active:underline-offset-4  active:text-[19px] lg:active:text-[23px]">See More Projects</span> →
            </Link>
          </div>


        </div>

        <CommentCarousel />




      </main>

      <Footer />

    </div>
  );
}

// Force push from Levisbranch to origin


// TODO:  Adjust button position from z-index to flex boundaries
// text masking on services bubbles on main page when hover they expand and reverse the mask


// write a review button under client reviews for users logged in

// ✅ text or full bubble shimmer effect on delay each time and arrow is pressed

// clicking on the comment in focus shows a pop up modal of full customer review

// add animation to hamburger menu click

// FIX DROPDOWN NOT WORKING  IT SHOULD DISPLAY INFTONT OF EVERYTHING

// ADD easy slide to comments

// ADD wood grain background to team members page and ccomments section

// NAVBAR TURNS INTO x on menu click if page shadow doesnt work

// IMPORTANT: Drop down menu should show about services and contact on medium n small viewports

// ABOUT PAGE DOES NOT FORMAT PROPERLY ON MOBILE SCREENS






// About page: Maybe have text and paragraphing centered for clarity
//fixing merge