import Posts from "@/components/posts";
import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import JamHeader from "@/components/jam-header";
import { PostListSkeleton } from "@/components/skeletons";

export default function Home() {
  return (
    <div className="flex flex-col gap-0">
      <JamHeader />
      <div className="flex flex-col justify-between gap-4 md:-mt-[max(0px,calc(clamp(86.667px,10vw,160px)_-_86px))] md:flex-row md:items-start">
        <div className="w-full min-w-0 flex-1">
          <Suspense fallback={<PostListSkeleton />}>
            <Posts />
          </Suspense>
        </div>
        <div className="shrink-0 md:mt-[max(0px,calc(clamp(86.667px,10vw,160px)_-_86px))] md:pt-3">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
