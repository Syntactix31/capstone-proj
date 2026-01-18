import Link from "next/link";

export default function Contact() {
  return (
    <main className="bg-white flex flex-col min-h-screen">

      {/* Header / Nav */}
        <header className="w-full bg-[#477A40] text-white space-y-2 py-6 mb-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-3xl font-bold">Landscape Craftsmen</h1>

          <nav className="hidden md:flex gap-8 text-lg font-semibold">
            <Link href="#">About</Link>
            <Link href="#">Services</Link>
            <Link href="#">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Intro Section */}
      <section className="max-w-5xl mx-auto text-center space-y-6">
        <div className="border-8 border-[#477A40] rounded-3xl p-8">
          <p className="text-2xl md:text-3xl text-black">
            Thinking about the next big step in achieving your remodeling needs?
            Get in touch today and allow licensed experts to get the job done
            professionally.
          </p>
      

      {/* Contact Title */}
      <section className="text-center max-w-6xl mx-auto text-black space-y-4 p-11">
        <h2 className="text-5xl md:text-6xl font-bold">Contact Us!</h2>
      </section>

      {/* CTA Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <a
          href="tel:5874386672"
          className="text-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white hover:bg-gray-200 hover:text-black transition"
        >
          Call / Text
        </a>

        <a
          href="mailto:landscapecraftsmen@yahoo.com"
          className="text-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white hover:bg-gray-200 hover:text-black transition"
        >
          Email
        </a>

        <Link
          href="https://www.instagram.com/landscape.craftsmen"
          target="_blank"
          className="text-center text-3xl font-bold py-10 rounded-2xl bg-[#477A40] text-white hover:bg-gray-200 hover:text-black transition"
        >
          See Our Projects
        </Link>
      </section>

      {/* Contact Details */}
      <section className="max-w-5xl mx-auto space-y-6 text-center text-black p-10">
        <p className="text-3xl">(587) 438-6672</p>

        <div className="bg-white border rounded-3xl p-6">
          <p className="text-2xl">
            landscapecraftsmen@yahoo.com
          </p>
        </div>

        <p className="text-2xl">
          Calgary, AB, Canada
        </p>
      </section>

      {/* Social Links */}
      <section className="flex justify-center gap-10 text-xl font-semibold text-black">
        <Link
          href="https://www.instagram.com/landscape.craftsmen"
          target="_blank"
          className="underline"
        >
          Instagram
        </Link>

        <Link
          href="https://www.facebook.com/p/Landscape-Craftsmen-61575247719417/"
          target="_blank"
          className="underline"
        >
          Facebook
        </Link>
      </section>
        </div>
        </section>

      {/* Footer */}
      <footer className="w-full bg-[#31270C] text-white text-center space-y-2 py-6 mt-12">
        <p className="text-xl font-bold">Landscape Craftsmen</p>
        <p>(403) 123-1234</p>
        <p>LandscapeCraftsmen@gmail.com</p>
        <p className="text-sm opacity-70">[ License Accreditables ]</p>
      </footer>

    </main>
  );
}
