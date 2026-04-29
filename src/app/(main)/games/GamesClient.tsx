"use client";

import dynamic from "@/compat/next-dynamic";

const Games = dynamic(() => import("@/components/games"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function GamesClient() {
  return <Games />;
}
