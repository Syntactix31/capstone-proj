import Image from "next/image";


export default function Footer() {

  return (
      <footer className="bg-[#31270C] w-full h-56 text-white items-center text-center justify-center flex mt-20">

        <a href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/" target="_blank">
          <Image src="/icons/facebook.png" alt="Facebook icon" height={15} width={15} className="mr-10 scale-200"></Image>        
        </a>


        <div className="justify-center flex flex-col gap-2">
          <p>LandscapeCraftsmen@gmail.com</p>
          <p>(587)-438-6672</p>
          <p>Calgary, AB, Canada</p>          
        </div>

        <a href="https://www.instagram.com/landscape.craftsmen" target="_blank">
          <Image src="/icons/instagram.png" alt="Instagram icon" height={15} width={15} className="ml-10 scale-250"></Image>
        </a>

      </footer>
  
  );
}


