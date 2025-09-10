import Editor from "../editor";
import { hasCookie } from "@/helpers/cookie";
import { sanitize } from "@/helpers/sanitize";
import { postComment } from "@/requests/comment";
import { useState } from "react";
import { Button } from "@/framework/Button";
import { addToast } from "@heroui/react";
import { Spinner } from "@/framework/Spinner";

// CreateComment.tsx
export default function CreateComment({
  gameId,
  size = "sm",
}: {
  gameId: number;
  size?: "xs" | "sm";
}) {
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);

  return (
    <>
      <Editor content={content} setContent={setContent} size={size} />
      {size == "sm" && <div className="p-4" />}
      {waitingPost ? (
        <Spinner />
      ) : (
        <Button
          size={size}
          icon="plus"
          onClick={async () => {
            if (!content) {
              addToast({
                title: "Please enter valid content",
              });
              return;
            }

            if (!hasCookie("token")) {
              addToast({
                title: "You are not logged in",
              });
              return;
            }

            const sanitizedHtml = sanitize(content);
            setWaitingPost(true);

            const response = await postComment(
              sanitizedHtml,
              null,
              null,
              gameId
            );

            if (response.status === 401) {
              addToast({
                title: "Invalid User",
              });
              setWaitingPost(false);
              return;
            }

            if (response.ok) {
              addToast({
                title: "Successfully created comment",
              });
              setWaitingPost(false);
              window.location.reload(); // Consider improving this too
            } else {
              addToast({
                title: "An error occurred",
              });
              setWaitingPost(false);
            }
          }}
        >
          {size == "sm" ? "Create Comment" : "Submit"}
        </Button>
      )}
    </>
  );
}
