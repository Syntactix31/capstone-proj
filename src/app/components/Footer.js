import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#31270C] w-full h-56 text-center text-white flex flex-col items-center justify-center gap-4 sm:flex-row lg:gap-12 mt-20 min-h-50">

      <div className="hidden sm:block">
        <a href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Image 
            src="/icons/facebook.png" 
            alt="Facebook" 
            height={24} 
            width={24} 
            className="w-8 h-8 hover:scale-110 transition-transform duration-200"
          />
        </a>
      </div>

      <div className="flex flex-col items-center gap-2 text-sm lg:text-base max-w-xs text-center">
        <p>landscapecraftsmen@yahoo.com</p>
        <p>(587)-438-6672</p>
        <p>Calgary, AB, Canada</p>
      </div>

      <div className="hidden sm:block">
        <a href="https://www.instagram.com/landscape.craftsmen" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Image 
            src="/icons/instagram.png" 
            alt="Instagram" 
            height={24} 
            width={24} 
            className="w-10 h-10 hover:scale-110 transition-transform duration-200"
          />
        </a>
      </div>


        <div className="flex sm:hidden justify-center items-center gap-6 mt-3">
          <a
            href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/icons/facebook.png"
              alt="Facebook"
              height={24}
              width={24}
              className="w-8 h-8 hover:scale-110 transition-transform duration-200"
            />
          </a>

          <a
            href="https://www.instagram.com/landscape.craftsmen"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/icons/instagram.png"
              alt="Instagram"
              height={24}
              width={24}
              className="w-10 h-10 hover:scale-110 transition-transform duration-200"
            />
          </a>
        </div>


    </footer>
  );
}






// import Image from "next/image";


// export default function Footer() {

//   return (
//       <footer className="bg-[#31270C] w-full h-56 text-white items-center text-center justify-center flex mt-20">

//         <a href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/" target="_blank">
//          <Image src="/icons/facebook.png" alt="Facebook icon" height={24} width={24} className="mr-5 lg:mr-10 w-8 h-8 hover:scale-110 transition-transform duration-200"></Image>        
//         </a>


//         <div className="justify-center flex flex-col gap-2">
//           <p>landscapecraftsmen@yahoo.com</p>
//           <p>(587)-438-6672</p>
//           <p>Calgary, AB, Canada</p>          
//         </div>

//         <a href="https://www.instagram.com/landscape.craftsmen" target="_blank">
//           <Image src="/icons/instagram.png" alt="Instagram icon" height={24} width={24} className="ml-5 lg:ml-10 w-10 h-10 hover:scale-110 transition-transform duration-200"></Image>
//         </a>

//       </footer>
  
//   );
// }
