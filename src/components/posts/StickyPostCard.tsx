"use client";

import { Avatar } from "bioloom-ui";
import { formatDistance } from "date-fns";
import Link from "@/compat/next-link";
import { PostType } from "@/types/PostType";
import { Megaphone, NotebookText } from "lucide-react";
import { useTheme } from "@/providers/useSiteTheme";
import { Card } from "bioloom-ui";
import { CSSProperties } from "react";

export default function StickyPostCard({ post }: { post: PostType }) {
  const { colors, siteTheme } = useTheme();

  return (
    <Card
      className="post-card-shell"
      style={{
        "--post-card-border": `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
        "--post-hover-brightness": siteTheme.type === "Light" ? 0.78 : 1.22,
      } as CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div
            className="flex gap-4 items-center transition-all duration-250 ease-linear"
            style={{
              color: colors["blue"],
            }}
          >
            {post.tags.some((tag) => tag.name === "SiteChangelog") ? (
              <NotebookText />
            ) : (
              <Megaphone />
            )}
            <Link href={`/p/${post.slug}`} className="post-title-link">
              <p className="font-medium leading-tight">{post.title}</p>
            </Link>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
            style={{
              color: colors["textFaded"],
            }}
          >
            <Link
              href={`/u/${post.author.slug}`}
              className="post-author-link flex items-center gap-2"
            >
              <Avatar
                className="post-author-avatar"
                size={24}
                src={post.author.profilePicture}
                style={{ backgroundColor: "transparent" }}
              />
              <p>{post.author.name}</p>
            </Link>
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
            <p>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
