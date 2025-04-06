"use client";

import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import {
  fromDate,
  getLocalTimeZone,
  now,
  ZonedDateTime,
} from "@internationalized/date";
import {
  Button,
  DateRangePicker,
  DateValue,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Input,
  Spacer,
  Spinner,
} from "@heroui/react";
import {
  Calendar,
  Code,
  FileCode,
  Gamepad2,
  LoaderCircle,
  Palette,
  Trophy,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Timers from "@/components/timers";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { sanitize } from "@/helpers/sanitize";
import SidebarStreams from "@/components/sidebar/SidebarStreams";
import { postEvent } from "@/requests/event";
import { EventIcon } from "@/types/EventIcon";

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

          if (!title) {
            setErrors({ title: "Please enter a valid title" });
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

        <Spacer />

        <p>Icon</p>
        <Dropdown backdrop="opaque">
          <DropdownTrigger>
            <Button
              size="sm"
              className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
              variant="faded"
            >
              {icons[icon]?.name}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            onAction={(key) => {
              setIcon(key as EventIcon);
            }}
            className="text-[#333] dark:text-white"
          >
            {Object.entries(icons).map(([key, icon]) => (
              <DropdownItem
                key={key}
                startContent={icon.icon}
                description={icon.description}
              >
                {icon.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <DateRangePicker
          defaultValue={{
            start: now(getLocalTimeZone()),
            end: now(getLocalTimeZone()).add({ hours: 3 }),
          }}
          value={{ start: date.start as DateValue, end: date.end as DateValue }}
          onChange={(value) =>
            setDate({
              start: value?.start
                ? fromDate(
                    value?.start.toDate(getLocalTimeZone()),
                    getLocalTimeZone()
                  )
                : undefined,
              end: value?.end
                ? fromDate(
                    value?.end.toDate(getLocalTimeZone()),
                    getLocalTimeZone()
                  )
                : undefined,
            })
          }
          label="Event duration"
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
