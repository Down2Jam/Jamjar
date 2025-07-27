"use client";

import { Button } from "@heroui/react";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import { getCookie } from "@/helpers/cookie";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { postLike } from "@/requests/like";

const theme = "dark";

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
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [likeEffect, setLikeEffect] = useState<boolean>(false);
  const [updatedLikes, setUpdatedLikes] = useState<number>(likes);
  const [updatedLiked, setUpdatedLiked] = useState<boolean>(liked);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <Button
      size="sm"
      variant="bordered"
      style={{
        color: updatedLiked ? (theme == "dark" ? "#5ed4f7" : "#05b7eb") : "",
        borderColor: updatedLiked
          ? theme == "dark"
            ? "#5ed4f744"
            : "#05b7eb44"
          : "",
      }}
      onPress={async () => {
        if (!getCookie("token")) {
          redirect("/login");
        }

        const response = await postLike(parentId, isComment);

        if (!updatedLiked) {
          setLikeEffect(true);
          setTimeout(() => setLikeEffect(false), 1000);
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
            toast.error("An error occurred");
            return;
          }
        }
      }}
    >
      <div className="flex gap-2 items-center" style={{ position: "relative" }}>
        <Heart size={16} />
        <Heart
          size={16}
          className={
            likeEffect && !reduceMotion
              ? "animate-ping absolute top-0 left-0"
              : "absolute top-0 left-0"
          }
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: "10",
          }}
        />
        <p>{updatedLikes}</p>
      </div>
    </Button>
  );
}
