import { Suspense } from "react";
import Events from "@/components/events";

export default function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl pb-10">
      <Suspense fallback={<div className="min-h-48" />}>
        <Events />
      </Suspense>
    </main>
  );
}
