"use client";

import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import { fromDate, ZonedDateTime } from "@internationalized/date";
import {
  Button,
  DateRangePicker,
  DateValue,
  Form,
  Input,
  Spacer,
  Spinner,
} from "@nextui-org/react";
import { LoaderCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Timers from "@/components/timers";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";
import SidebarStreams from "@/components/sidebar/SidebarStreams";
import { postEvent } from "@/requests/event";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [waitingPost, setWaitingPost] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState<{
    start: ZonedDateTime | undefined;
    end: ZonedDateTime | undefined;
  }>({
    start: fromDate(new Date(), "America/Los_Angeles"),
    end: fromDate(new Date(), "America/Los_Angeles").add({ hours: 3 }),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getSelf();

        const localuser = await response.json();
        setUser(localuser);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <Spinner />;

  if (!user?.twitch && !user?.mod) return <p>You cannot create events</p>;

  return (
    <div className="static flex items-top mt-10 justify-center top-0 left-0 gap-16">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        validationErrors={errors}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title && !content) {
            setErrors({
              title: "Please enter a valid title",
              content: "Please enter valid content",
            });
            toast.error("Please enter valid content");
            return;
          }

          if (!title) {
            setErrors({ title: "Please enter a valid title" });
            return;
          }

          if (!content) {
            setErrors({ content: "Please enter valid content" });
            toast.error("Please enter valid content");
            return;
          }

          if (!date || !date.end || !date.start) {
            setErrors({ content: "Please enter valid dates" });
            toast.error("Please enter valid dates");
            return;
          }

          if (!hasCookie("token")) {
            setErrors({ content: "You are not logged in" });
            return;
          }

          const sanitizedHtml = sanitize(content);
          setWaitingPost(true);

          const response = await postEvent(
            title,
            sanitizedHtml,
            date.start.toString(),
            date.end.toString()
          );

          if (response.status == 401) {
            setErrors({ content: "Invalid user" });
            setWaitingPost(false);
            return;
          }

          if (response.ok) {
            toast.success("Successfully created event");
            setWaitingPost(false);
            redirect("/events");
          } else {
            toast.error("An error occured");
            setWaitingPost(false);
          }
        }}
      >
        <Input
          isRequired
          label="Title"
          labelPlacement="outside"
          name="title"
          placeholder="Enter a title"
          type="text"
          value={title}
          onValueChange={setTitle}
        />

        <Editor content={content} setContent={setContent} />

        <Spacer />

        <DateRangePicker
          defaultValue={{
            start: fromDate(new Date(), "America/Los_Angeles"),
            end: fromDate(new Date(), "America/Los_Angeles").add({ hours: 3 }),
          }}
          value={{ start: date.start as DateValue, end: date.end as DateValue }}
          onChange={(value) =>
            setDate({
              start: value?.start
                ? fromDate(
                    value?.start.toDate("America/Los_Angeles"),
                    "America/Los_Angeles"
                  )
                : undefined,
              end: value?.end
                ? fromDate(
                    value?.end.toDate("America/Los_Angeles"),
                    "America/Los_Angeles"
                  )
                : undefined,
            })
          }
          label="Stay duration"
          labelPlacement="outside"
        />

        <Spacer />

        <div className="flex gap-2">
          <Button color="primary" type="submit">
            {waitingPost ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <p>Create</p>
            )}
          </Button>
        </div>
      </Form>
      {!isMobile && (
        <div className="flex flex-col gap-4 px-8 items-end">
          <Timers />
          <SidebarStreams />
        </div>
      )}
    </div>
  );
}
