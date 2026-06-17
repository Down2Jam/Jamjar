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
