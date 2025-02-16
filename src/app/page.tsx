import Posts from "@/components/posts";
import Timers from "@/components/timers";
import Streams from "@/components/streams";
import JamHeader from "@/components/jam-header";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="flex justify-between flex-wrap">
      <div className="md:w-2/3">
        <JamHeader />
        <Suspense fallback={<div>Loading...</div>}>
          <Posts />
        </Suspense>
      </div>
      <div>
        <Timers />
        <Streams />
      </div>
    </div>
  );
}

{
  /* <div>
<div className="absolute left-0 top-0 w-full h-full z-0">
  <Image
    src="/images/bg.jpg"
    alt="Home background"
    className="object-cover w-full h-full"
    radius="none"
    loading="eager"
    removeWrapper
  />
  <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-black/50 to-transparent z-10" />
</div>
<div className="relative left-0 top-0 z-10 px-8">
  <div className="flex gap-20">
    <div className="flex flex-col gap-4 py-16 sm:py-36 md:py-72">
      <h1 className="text-3xl sm:text-4xl md:text-5xl">Dare2Jam</h1>
      <p className="text-lg sm:text-xl">April 4th - 7th</p>
      <div className="flex gap-2">
        <Link href="https://discord.gg/rfmKzM6ASw" target="_blank">
          <Button
            variant="bordered"
            className="border-white/50 text-white"
            startContent={<SiDiscord />}
          >
            Join the Discord
          </Button>
        </Link>
      </div>
    </div>
  </div>
</div>
</div> */
}
