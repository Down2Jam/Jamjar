import { Outlet } from "react-router";
import PageBackground from "@/app/(main)/PageBackground";
import Navbar from "@/components/navbar";

export default function MainLayout() {
  return (
    <PageBackground>
      <Navbar />
      <div className="mt-4 max-w-6xl xl:max-w-7xl 2xl:max-w-[96em] mx-auto grow w-full px-2 sm:px-8 z-10">
        <Outlet />
      </div>
    </PageBackground>
  );
}
