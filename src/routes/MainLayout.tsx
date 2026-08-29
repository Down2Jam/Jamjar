import { Outlet } from "react-router";
import PageBackground from "@/app/(main)/PageBackground";
import Navbar from "@/components/navbar";

export default function MainLayout() {
  return (
    <PageBackground>
      <Navbar />
      <div className="z-10 mx-auto mt-4 w-full max-w-6xl grow px-2 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-4 xl:max-w-7xl 2xl:max-w-[96em]">
        <Outlet />
      </div>
    </PageBackground>
  );
}
