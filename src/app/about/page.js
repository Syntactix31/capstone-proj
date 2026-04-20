  import Link from "next/link";
  import NavBar from "../components/Navbar.js";
  import Footer from "../components/Footer.js";
  import Image from "next/image";

  const teamMembers = [
  {
    id: 1,
    image: "/team/member1.png",
    description: "Founder & lead contractor with years of hands-on experience delivering high-quality outdoor builds."
  },
  {
    id: 2,
    image: "/team/member5.jpg",
    description: "Specialist in custom decks and railings, focused on precision, durability, and clean finishes."
  },
  {
    id: 3,
    image: "/team/member5.jpg",
    description: "Landscape expert dedicated to transforming yards with thoughtful design and plant selection."
  },
  {
    id: 4,
    image: "/team/member5.jpg",
    description: "Project coordinator ensuring smooth timelines, clear communication, and satisfied clients."
  }
];

  export default function About() {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <NavBar />

        <div className="grow">
          {/* Top Image Placeholder*/}
<section className="relative h-48 w-full overflow-hidden border-b-8 border-[#477A40] bg-[#D3D3D3] sm:h-64 md:h-96">
  <Image
    src="/team/background3.jpg"
    alt="Main Team Image"
    fill
    priority
    className="object-cover object-[65%_25%]"
    sizes="100vw"
  />
</section>

          {/* Mission Section */}
          <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <div className="relative overflow-hidden rounded-2xl border border-[#477a40]/20 bg-linear-to-br from-[#477a40]/10 via-white to-white p-6 shadow-lg sm:p-10">
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
                  Built from the ground up with a passion for quality craftsmanship, our company has grown from small local projects into a trusted name in landscaping and outdoor construction. What started as a commitment to doing honest, detail-driven work has evolved into a reputation for delivering clean designs, durable builds, and dependable service. From custom fences and decks to full yard transformations, we take pride in every project and every client relationship. Years of hands-on experience, consistent results, and word-of-mouth referrals have shaped who we are today—a team dedicated to bringing outdoor visions to life with precision and care.
                  <br /><br />
                    We believe your outdoor space should be more than just functional—it should feel like an extension of your home. That’s why we take the time to understand your vision, offer expert guidance, and execute every detail with intention. Our process is transparent from start to finish, with clear communication, accurate timelines, and no shortcuts. Clients choose us not just for the final result, but for the confidence and peace of mind that comes with working with professionals who genuinely care.
                  <br /><br />
                    Today, our success is built on more than just completed projects—it’s built on trust, long-term relationships, and a standard of work that speaks for itself. Whether you’re upgrading a single feature or transforming your entire property, we’re here to deliver results that last, add value, and make your space something you’re proud of every day.
          
                </p>
              </div>
            </div>
          </section>


          {/* Team Section*/}
          <section className="py-10 px-6 max-w-6xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center mb-16 border-b-2 p-2 border-[#477A40] w-full max-w-2xl mx-auto">
              Meet the Team
            </h2>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 md:gap-12">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col items-center">
                    
                    {/* Photo Frame */}
                    <div className="flex aspect-3/4 w-full items-center justify-center overflow-hidden rounded-3xl border-4 border-[#477A40] bg-white shadow-xl transition-transform duration-300 md:hover:scale-105">
                      <Image
                        src={member.image}
                        alt="Team member"
                        width={300}
                        height={500}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Bio Box */}
                    <div className="mt-6 rounded-2xl border-2 border-[#477A40] bg-white p-5 text-center shadow-sm">
                      <p className="text-sm leading-snug text-black sm:text-base">
                        {member.description}
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

  