"use client";

import { getCookie } from "@/helpers/cookie";
import { redirect } from "@/compat/next-navigation";
import { useEffect, useState } from "react";
import { postLike } from "@/requests/like";
import { Button } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Heart } from "lucide-react";

export default function LikeButton({
  likes,
  liked,
  parentId,
  isComment = false,
}: {
  likes: number;
  liked: boolean;
  parentId: number;
  isComment?: boolean;
}) {
  const [likeEffect, setLikeEffect] = useState<boolean>(false);
  const [updatedLikes, setUpdatedLikes] = useState<number>(likes);
  const [updatedLiked, setUpdatedLiked] = useState<boolean>(liked);

  useEffect(() => {
    setUpdatedLikes(likes);
    setUpdatedLiked(liked);
  }, [likes, liked, parentId]);

  // useEffect(() => {
  //   const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  //   setReduceMotion(mediaQuery.matches);

  //   const handleChange = (event: MediaQueryListEvent) => {
  //     setReduceMotion(event.matches);
  //   };
  //   mediaQuery.addEventListener("change", handleChange);

  //   return () => {
  //     mediaQuery.removeEventListener("change", handleChange);
  //   };
  // }, []);

  return (
    <Button
      className="post-action-button min-w-12"
      size="sm"
      variant={updatedLiked ? "standard" : "ghost"}
      color={updatedLiked ? "red" : "default"}
      data-reaction-color={updatedLiked ? "red" : undefined}
      leftSlot={
        <span
          className={
            likeEffect ? "post-like-heart--pulse inline-flex" : "inline-flex"
          }
          onAnimationEnd={() => setLikeEffect(false)}
        >
          <Heart
            size={16}
            fill={updatedLiked ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </span>
      }
      onClick={async () => {
        if (!getCookie("token")) {
          redirect("/login");
        }

        const response = await postLike(parentId, isComment);

        if (!updatedLiked) {
          setLikeEffect(true);
          setUpdatedLikes(updatedLikes + 1);
        } else {
          setLikeEffect(false);
          setUpdatedLikes(updatedLikes - 1);
        }

        setUpdatedLiked(!updatedLiked);

        if (!response.ok) {
          if (response.status == 401) {
            redirect("/login");
          } else {
            setUpdatedLiked(!updatedLiked);
            addToast({
              title: "An error occurred",
            });
            return;
          }
        }
      }}
    >
      {updatedLikes}
    </Button>
  );
}
