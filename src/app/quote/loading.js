import NavBar from "../components/Navbar.js";
import Footer from "../components/Footer.js";

export default function QuoteLoading() {
  return (
    <div className="overflow-hidden bg-white min-h-screen flex flex-col">
      <header className="shrink-0">
        <NavBar />
        <div className="h-16 bg-white border-b border-gray-200" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 space-y-8">
        <div className="w-full mx-auto max-w-6xl px-4">
          <div className="mx-auto w-fit p-2 text-3xl font-extrabold bg-gray-100 rounded-lg animate-pulse h-12 w-64" />
        </div>
        <div className="w-full mx-auto max-w-2xl px-4 space-y-8">
          <div className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#477a40]/20 p-8 bg-white/50 shadow-lg animate-pulse h-64" />
          <div className="h-16 bg-gray-200 rounded-2xl" />
        </div>
      </main>
      <Footer />
    </div>
  );
}





