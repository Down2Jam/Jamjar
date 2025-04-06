import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import Events from "@/components/events";

export default async function EventPage() {
  return (
    <div className="flex justify-between flex-col md:flex-row">
      <div className="w-full md:w-2/3">
        <h2 className="text-2xl">Events</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <Events />
        </Suspense>
      </div>
      <Sidebar />
    </div>
  );
}
