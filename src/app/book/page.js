import { BookContent } from "./BookContent";
import NavBar from "../components/Navbar";
import Footer from "../components/Footer";
import { Suspense } from "react";

export default function BookPage() {
  return (
    <>
      <NavBar />
      <Suspense fallback="Loading services...">
        <BookContent />
      </Suspense>
      <Footer />
    </>
  );
}



