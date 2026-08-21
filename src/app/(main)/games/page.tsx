import GamesClient from "./GamesClient";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamesClient />
    </Suspense>
  );
}
