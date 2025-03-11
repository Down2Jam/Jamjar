import TeamFinder from "@/components/team-finder";
import { Divider } from "@nextui-org/react";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <main className="pl-4 pr-4">
      <section className="mb-4">
        <h1 className="text-3xl mb-4">Team Finder</h1>
        <p className="text-sm text-default-500">
          This is a spot to find teammates to make games with for the jam!
        </p>
      </section>
      <Divider />

      <Suspense fallback={<div>Loading...</div>}>
        <TeamFinder />
      </Suspense>
    </main>
  );
}
