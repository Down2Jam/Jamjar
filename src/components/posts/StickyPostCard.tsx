"use client";

import { Avatar, Card, CardBody } from "@heroui/react";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { PostType } from "@/types/PostType";
import { Megaphone, NotebookText } from "lucide-react";

export default function StickyPostCard({ post }: { post: PostType }) {
  return (
    <Card className="bg-opacity-60 !duration-250 !ease-linear !transition-all flex">
      <CardBody className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-4 items-center text-blue-600 dark:text-blue-400 transition-all duration-250 ease-linear">
              {post.tags.filter((tag) => tag.name === "Changelog").length >
              0 ? (
                <NotebookText />
              ) : (
                <Megaphone />
              )}
              <Link href={`/p/${post.slug}`}>
                <p>{post.title}</p>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
              <p>By</p>
              <Link
                href={`/u/${post.author.slug}`}
                className="flex items-center gap-2"
              >
                <Avatar
                  size="sm"
                  className="w-6 h-6"
                  src={post.author.profilePicture}
                  classNames={{
                    base: "bg-transparent",
                  }}
                />
                <p>{post.author.name}</p>
              </Link>
              <p>
                {formatDistance(new Date(post.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
