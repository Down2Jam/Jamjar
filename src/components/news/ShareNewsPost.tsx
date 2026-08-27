"use client";

import { addToast, Button } from "bioloom-ui";
import { Share2 } from "lucide-react";
import { newsPostPath } from "./news";

export default function ShareNewsPost({ slug }: { slug: string }) {
  const path = newsPostPath(slug);
  const url =
    typeof window === "undefined"
      ? `https://d2jam.com${path}`
      : new URL(path, window.location.origin).toString();
  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    addToast({ title: "News link copied" });
  };

  return (
    <Button
      className="post-action-button"
      variant="ghost"
      size="sm"
      leftSlot={<Share2 aria-hidden="true" size={16} />}
      onClick={copyLink}
    >
      Share
    </Button>
  );
}
