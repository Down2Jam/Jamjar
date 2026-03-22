import Recap from "@/components/recap";
import { Suspense } from "react";

export default function RecapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Recap />
    </Suspense>
  );
}
