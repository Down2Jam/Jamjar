import Results from "@/components/results";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Results />
    </Suspense>
  );
}
