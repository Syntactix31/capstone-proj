import Link from "next/link";
import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <NavBar />

      <div className="flex-grow">
        {/* Top Image Placeholder*/}
        <section className="flex h-48 w-full items-center justify-center bg-[#D3D3D3] border-b-8 border-[#477A40] sm:h-64 md:h-96">
          <p className="text-lg font-bold text-gray-500">
            Main Team Image
          </p>
        </section>

        {/* Mission Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#477a40]/20 bg-gradient-to-br from-[#477a40]/10 via-white to-white p-6 shadow-lg sm:p-10">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#477a40]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#477a40]/10 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-block rounded-full bg-[#477a40]/10 px-3 py-1 text-sm font-semibold text-[#2f5a29]">
                Licensed • Insured • Free Estimates
              </span>

              <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                The Contracting Company You Can Trust
              </h1>

              <h2 className="mt-4 max-w-2xl text-base font-bold text-black sm:text-lg">
                All your landscaping needs done by professionals—clean work,
                clear communication, and results that last.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy text
                ever since the 1500s, when an unknown printer took a galley of
                type and scrambled it to make a type specimen book.
                <br /><br />
                It has survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
                <br /><br />
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h2 className="mx-auto mb-12 max-w-fit border-b-2 border-[#477A40] pb-4 text-center text-3xl font-extrabold sm:text-4xl md:text-6xl">
            Meet the Team
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 md:gap-12">
            {[1, 2, 3, 4].map((member) => (
              <div key={member} className="flex flex-col items-center">
                {/* Photo Frame*/}
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-3xl border-4 border-[#477A40] bg-white shadow-xl transition-transform duration-300 md:hover:scale-105">
                  <span className="text-sm font-bold italic text-gray-400">
                    Team Member Photo
                  </span>
                </div>

                {/* Bio Box*/}
                <div className="mt-6 rounded-2xl border-2 border-[#477A40] bg-white p-5 text-center shadow-sm">
                  <p className="text-sm leading-snug text-black sm:text-base">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                    sed do eiusmod tempor incididunt ut labore.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final Tagline */}
        <section className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-24">
          <p className="text-2xl font-light italic leading-tight text-gray-700 sm:text-3xl md:text-5xl">
            Committed to{" "}
            <span className="font-bold not-italic text-[#477A40]">
              quality
            </span>{" "}
            and{" "}
            <span className="font-bold not-italic text-[#477A40]">
              excellence
            </span>{" "}
            in every project.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
