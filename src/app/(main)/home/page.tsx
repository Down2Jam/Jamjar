import Posts from "@/components/posts";
import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import JamHeader from "@/components/jam-header";
import { PostListSkeleton } from "@/components/skeletons";

export default function Home() {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div className="w-full min-w-0 flex-1">
        <JamHeader />
        <Suspense fallback={<PostListSkeleton />}>
          <Posts />
        </Suspense>
      </div>
      <Sidebar />
    </div>
  );
}

{
  /*
<div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/sitebg.png"
          alt="Community mural"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e16]/90 via-[#0b0e16]/55 to-[#070910]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(25,40,72,0.55),transparent_60%)]" />
      </div>

      <div className="flex justify-between flex-col md:flex-row gap-6 px-3 md:px-4 py-4">
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src="/images/D2J_Banner.png"
                alt="Down2Jam banner art"
                fill
                className="object-cover opacity-70"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d111d]/95 via-[#0d111d]/65 to-transparent" />
            </div>
            <div className="relative z-10 p-6 flex flex-col gap-3">
              <Vstack align="start" gap={1}>
                <Text size="3xl" weight="bold">
                  Down2Jam Community Hub
                </Text>
                <Text size="sm" color="textFaded">
                  Share devlogs, trade feedback, and celebrate jam games built
                  by the community.
                </Text>
              </Vstack>
              <Hstack wrap>
                <Button href="/create-post" icon="squarepen" color="yellow">
                  Start a Thread
                </Button>
                <Button href="/games" icon="gamepad2" color="blue">
                  Browse Games
                </Button>
                <Button href="/theme-suggestions" icon="sparkles">
                  Theme Ideas
                </Button>
              </Hstack>
            </div>
          </Card>

          <JamHeader />
          <Suspense fallback={<div>Loading...</div>}>
            <Posts />
          </Suspense>
        </div>

        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <Card>
            <Vstack align="start" gap={2}>
              <Text size="lg" weight="semibold">
                Jam Crew Energy
              </Text>
              <Text size="sm" color="textFaded">
                Follow the latest jam chatter, playlists, and experiments from
                the forum. Drop a post or check out the newest builds.
              </Text>
              <Hstack wrap>
                <Button href="/home" icon="messagecircle" variant="ghost">
                  Forum Feed
                </Button>
                <Button href="/music" icon="music" variant="ghost">
                  Listen
                </Button>
                <Button href="/results" icon="trophy" variant="ghost">
                  Past Winners
                </Button>
              </Hstack>
            </Vstack>
          </Card>
          <Sidebar />
        </div>
      </div>
  */
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
