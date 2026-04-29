"use client";

import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import {
  fromDate,
  getLocalTimeZone,
  now,
  ZonedDateTime,
} from "@internationalized/date";
import { addToast, Dropdown, Form, Input } from "bioloom-ui";
import {
  Calendar,
  Code,
  FileCode,
  Gamepad2,
  Palette,
  Trophy,
} from "lucide-react";
import { redirect } from "@/compat/next-navigation";
import { useEffect, useState } from "react";
import Timers from "@/components/timers";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";
import SidebarStreams from "@/components/sidebar/SidebarStreams";
import { postEvent } from "@/requests/event";
import { EventIcon } from "@/types/EventIcon";
import { Button, Spinner } from "bioloom-ui";
import { readItem } from "@/requests/helpers";

const icons = {
  palette: {
    description: "Streams where you make art content for the jam",
    icon: <Palette />,
    name: "Art",
  },
  calendar: {
    description: "A generic event icon",
    icon: <Calendar />,
    name: "Event",
  },
  code: {
    description: "Streams where you make games for the jam",
    icon: <Code />,
    name: "Gamedev",
  },
  gamepad2: {
    description: "Streams where you play games from the jam",
    icon: <Gamepad2 />,
    name: "Games",
  },
  trophy: {
    description:
      "Streams where you run a tournament (e.g. a score chasing tournament)",
    icon: <Trophy />,
    name: "Tournament",
  },
  filecode: {
    description:
      "Streams where you make web content (e.g. work on the d2jam site)",
    icon: <FileCode />,
    name: "Webdev",
  },
};

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [icon, setIcon] = useState<EventIcon>("calendar");
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
    start: now(getLocalTimeZone()),
    end: now(getLocalTimeZone()).add({ hours: 3 }),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getSelf();

        const localuser = await readItem<UserType>(response);
        if (!localuser) {
          setLoading(false);
          return;
        }
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

  const toLocalInputValue = (value?: ZonedDateTime) => {
    if (!value) return "";
    const date = value.toDate();
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const parseLocalInputValue = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return fromDate(parsed, getLocalTimeZone());
  };

  return (
    <div className="static flex items-top mt-10 justify-center top-0 left-0 gap-16">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        validationErrors={errors}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title) {
            setErrors({ title: "Please enter a valid title" });
            return;
          }

          if (!date || !date.end || !date.start) {
            setErrors({ content: "Please enter valid dates" });
            addToast({
              title: "Please enter valid dates",
            });
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
            date.end.toString(),
            link,
            icon
          );

          if (response.status == 401) {
            setErrors({ content: "Invalid user" });
            setWaitingPost(false);
            return;
          }

          if (response.ok) {
            addToast({
              title: "Successfully created event",
            });
            setWaitingPost(false);
            redirect("/events");
          } else {
            addToast({
              title: "An error occured",
            });
            setWaitingPost(false);
          }
        }}
      >
        <Input
          required
          label="Title"
          labelPlacement="outside"
          name="title"
          placeholder="Enter a title"
          type="text"
          value={title}
          onValueChange={setTitle}
        />

        <Input
          label="Link"
          labelPlacement="outside"
          name="link"
          placeholder="Enter a link"
          type="text"
          value={link}
          onValueChange={setLink}
        />

        <Editor content={content} setContent={setContent} />

        <p className="mt-1">Icon</p>
        <Dropdown
          backdrop
          trigger={<Button size="sm">{icons[icon]?.name}</Button>}
          onSelect={(key) => {
            setIcon(key as EventIcon);
          }}
        >
          {Object.entries(icons).map(([key, icon]) => (
            <Dropdown.Item key={key} value={key} description={icon.description}>
              {icon.name}
            </Dropdown.Item>
          ))}
        </Dropdown>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              fullWidth
              label="Start"
              labelPlacement="outside"
              type="datetime-local"
              value={toLocalInputValue(date.start)}
              onValueChange={(value) =>
                setDate((prev) => ({
                  ...prev,
                  start: parseLocalInputValue(value),
                }))
              }
            />
          </div>
          <div className="flex-1">
            <Input
              fullWidth
              label="End"
              labelPlacement="outside"
              type="datetime-local"
              value={toLocalInputValue(date.end)}
              onValueChange={(value) =>
                setDate((prev) => ({
                  ...prev,
                  end: parseLocalInputValue(value),
                }))
              }
            />
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          {waitingPost ? (
            <Spinner />
          ) : (
            <Button color="blue" type="submit">
              Create
            </Button>
          )}
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
