import Editor from "../editor";
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";
import { useState } from "react";
import { Button } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Spinner } from "bioloom-ui";

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
      <Editor
        content={content}
        setContent={setContent}
        size={size}
        format="markdown"
      />
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

            setWaitingPost(true);

            const response = await postComment(content, null, null, gameId);

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
          {size == "sm" ? "Create Comment" : "Submit Feedback"}
        </Button>
      )}
    </>
  );
}
