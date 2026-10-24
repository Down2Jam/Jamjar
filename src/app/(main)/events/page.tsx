import { Suspense } from "react";
import Events from "@/components/events";

export default function EventsPage() {
  return (
    <main className="w-full">
      <Suspense fallback={<div className="min-h-48" />}>
        <Events />
      </Suspense>
    </main>
  );
}
