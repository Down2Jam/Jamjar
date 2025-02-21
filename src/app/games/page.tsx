import Games from "@/components/games";
import { Divider } from "@nextui-org/react";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <main className="pl-4 pr-4">
      <section className="mb-4">
        <h1 className="text-3xl mb-4">Games</h1>
        <p className="text-sm text-default-500">
          Here you have an overview of all the submitted games. More filters
          will be added in the near future.
        </p>
      </section>
      <Divider />

      <Suspense fallback={<div>Loading...</div>}>
        <Games />
      </Suspense>
    </main>
  );
}
