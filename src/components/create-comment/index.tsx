import { Spacer } from "@heroui/react";
import Editor from "../editor";
import ButtonAction from "../link-components/ButtonAction";
import { toast } from "react-toastify";
import { hasCookie } from "@/helpers/cookie";
import { sanitize } from "@/helpers/sanitize";
import { postComment } from "@/requests/comment";
import { useState } from "react";

// CreateComment.tsx
export default function CreateComment({ gameId }: { gameId: number }) {
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);

  return (
    <>
      <Editor content={content} setContent={setContent} />
      <Spacer y={5} />
      <ButtonAction
        onPress={async () => {
          if (!content) {
            toast.error("Please enter valid content");
            return;
          }

          if (!hasCookie("token")) {
            toast.error("You are not logged in");
            return;
          }

          const sanitizedHtml = sanitize(content);
          setWaitingPost(true);

          const response = await postComment(sanitizedHtml, null, null, gameId);

          if (response.status === 401) {
            toast.error("Invalid User");
            setWaitingPost(false);
            return;
          }

          if (response.ok) {
            toast.success("Successfully created comment");
            setWaitingPost(false);
            window.location.reload(); // Consider improving this too
          } else {
            toast.error("An error occurred");
            setWaitingPost(false);
          }
        }}
        name={waitingPost ? "Loading..." : "Create Comment"}
      />
    </>
  );
}
