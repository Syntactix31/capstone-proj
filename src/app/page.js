import Link from "next/link";
import Image from "next/image";
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
         {/* HERE */}
        {/* <DropDownMenu /> */}




      <main className="flex flex-col min-h-screen w-full bg-white gap-15">


        <div className="w-full mx-auto max-w-8xl px-4">
          <section className="max-w-350 relative mt-10 overflow-hidden rounded-xl border border-[#477a40]/20 bg-linear-to-br from-[#477a40]/10 via-white to-white p-8 shadow-lg md:p-12 mx-auto flex gap-x-25 gap-y-0 scale-85 md:scale-100">
            <div className="flex  flex-col">
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
              
              {/* ml-138 for learn more positioning */}
              <Link href="/about" className="font-bold active:text-[15px] text-right h-6 mr-4"><span className="hover:underline hover:underline-offset-4 ">Learn More</span> &rarr;</Link>
          
            </div>

            <div className="justify-center gap-x-10 items-center w-130 z-200 hidden lg:flex lg:flex-wrap *:hover:scale-102 *:text-center *:items-center *:align-center *:flex *:justify-center *:text-4xl *:font-black *:cursor-default *:transition-all">
              <div className="h-25 w-60 bg- rounded-2xl shadow-xl fence-bg">
                <p className="fence-mask">Fence</p>

              </div>
              <div className="h-25 w-60 bg-white rounded-2xl shadow-xl">
                <p className="deck-mask text-transparent">Deck & Railing</p>

              </div>     
              <div className="h-25 w-60 bg-white rounded-2xl shadow-xl">
                <p className="pergola-mask text-transparent">Pergola</p>

              </div>
              <div className="h-25 w-60 bg-white rounded-2xl shadow-xl ">
                <p className="sod-mask text-transparent">Sod</p>

              </div> 

              <div className="h-25 w-60 bg-white rounded-2xl shadow-xl">
                <p className="trees-mask text-transparent">Trees & Shrubs</p>

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
              <Image src={images[4]} alt="Project 5" fill sizes="400px" className="object-cover hover:brightness-110 transition-all" />
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








// About page: Maybe have text and paragraphing centered for clarity