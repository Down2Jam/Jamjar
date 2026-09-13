"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useState, type ReactNode } from "react";
import {
  fromDate,
  getLocalTimeZone,
} from "@internationalized/date";
import {
  Calendar,
  CalendarClock,
  Code,
  FileCode,
  Gamepad2,
  Link2,
  Palette,
  Trophy,
} from "lucide-react";
import Editor from "@/components/editor";
import { redirect } from "@/compat/next-navigation";
import { hasCookie } from "@/helpers/cookie";
import { sanitize } from "@/helpers/sanitize";
import { useSelf } from "@/hooks/queries";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useTheme } from "@/providers/useSiteTheme";
import { postEvent } from "@/requests/event";
import type { EventIcon } from "@/types/EventIcon";
import {
  addToast,
  Button,
  Card,
  Dropdown,
  Form,
  Hstack,
  Input,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import type { IconName } from "bioloom-ui";

const EVENT_TYPES: Record<
  EventIcon,
  { name: string; description: string; icon: ReactNode }
> = {
  calendar: {
    name: "AppStrings.CommunityEvent",
    description: "AppStrings.AMeetupAnnouncementOrOtherGeneralEvent",
    icon: <Calendar size={18} />,
  },
  palette: {
    name: "AppStrings.ArtStream",
    description: "AppStrings.DrawingArtForAGameInTheJam",
    icon: <Palette size={18} />,
  },
  code: {
    name: "AppStrings.GameDevelopmentStream",
    description: "AppStrings.BuildingAGameForTheJam",
    icon: <Code size={18} />,
  },
  gamepad2: {
    name: "AppStrings.GameShowcaseStream",
    description: "AppStrings.PlayingOrShowcasingGamesFromTheCommunity",
    icon: <Gamepad2 size={18} />,
  },
  trophy: {
    name: "AppStrings.TournamentStream",
    description: "AppStrings.ATournamentChallengeOrScoreCompetition",
    icon: <Trophy size={18} />,
  },
  filecode: {
    name: "AppStrings.WebDevelopmentStream",
    description: "AppStrings.WorkingOnTheDown2JamSiteOrOtherWebContent",
    icon: <FileCode size={18} />,
  },
};

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSchedule() {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return {
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
  };
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Text size="sm" weight="semibold" color="text">
        {children}
      </Text>
      {hint && (
        <Text size="xs" color="textFaded">
          {hint}
        </Text>
      )}
    </div>
  );
}

export default function CreateEventPage() {
  const uiText = useUiTranslations();
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const hasToken = hasCookie("token");
  const { data: user, isLoading } = useSelf(hasToken);
  const initialSchedule = defaultSchedule();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [icon, setIcon] = useState<EventIcon>("calendar");
  const [content, setContent] = useState("");
  const [start, setStart] = useState(initialSchedule.start);
  const [end, setEnd] = useState(initialSchedule.end);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  usePageMetadata({
    title: uiText("AppStrings.CreateEvent"),
    description: uiText("AppStrings.AddACommunityEventToTheDown2JamCalendar"),
    canonical: "/create-event",
    robots: "noindex,nofollow",
  });

  const canCreateEvent = Boolean(user?.twitch || user?.mod);
  const selectedType = EVENT_TYPES[icon];

  const submitEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError("Give your event a title before publishing it.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      !start ||
      !end ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setFormError("Choose a valid start and end time.");
      return;
    }

    if (endDate <= startDate) {
      setFormError("The event must end after it starts.");
      return;
    }

    if (!hasCookie("token")) {
      setFormError("Your session has expired. Sign in again to create an event.");
      return;
    }

    setSubmitting(true);
    try {
      const timeZone = getLocalTimeZone();
      const response = await postEvent(
        trimmedTitle,
        sanitize(content),
        fromDate(startDate, timeZone).toString(),
        fromDate(endDate, timeZone).toString(),
        link.trim(),
        icon,
      );

      if (response.ok) {
        addToast({ title: uiText("AppStrings.EventCreated") });
        redirect("/events");
        return;
      }

      const payload = await response.json().catch(() => null);
      setFormError(
        response.status === 401
          ? "Your session has expired. Sign in again to create an event."
          : payload?.message ?? "The event could not be created. Please try again.",
      );
    } catch {
      setFormError("The event could not be created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl pb-10">
      <Vstack align="stretch" gap={5}>
        <header className="relative py-2 text-center">
          <h1
            className="text-3xl font-semibold"
            style={{
              color: headerColor,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 5px rgba(0, 0, 0, 0.75)",
            }}
          >
             {uiText("AppStrings.CreateAnEvent")} </h1>
          <p
            className="mt-1 text-sm"
            style={{
              color: headerColor,
              opacity: 0.82,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
             {uiText("AppStrings.AddAStreamTournamentShowcaseOrCommunityGetTogether")} </p>
          <div className="mt-3 flex justify-center sm:absolute sm:left-0 sm:top-2 sm:mt-0">
            <Button href="/events" icon="arrowleft" variant="ghost">
               {uiText("Navbar.Events.Title")} </Button>
          </div>
        </header>

        {isLoading ? (
          <Card radius="lg">
            <Hstack justify="center" className="py-14">
              <Spinner />
              <Text color="textFaded">{uiText("AppStrings.CheckingEventAccess")}</Text>
            </Hstack>
          </Card>
        ) : !hasToken ? (
          <Card radius="lg">
            <Vstack gap={3} className="py-10 text-center">
              <CalendarClock size={34} style={{ color: colors["textFaded"] }} />
              <Text size="xl" weight="semibold">{uiText("AppStrings.SignInToCreateAnEvent")}</Text>
              <Text color="textFaded" className="max-w-md">
                 {uiText("AppStrings.EventCreationIsAvailableToDown2JamCommunityMembersWithAConnectedTwitchAccount")} </Text>
              <Hstack>
                <Button href="/login" color="blue">{uiText("AppStrings.SignIn")}</Button>
                <Button href="/events" variant="ghost">{uiText("AppStrings.BackToEvents")}</Button>
              </Hstack>
            </Vstack>
          </Card>
        ) : !canCreateEvent ? (
          <Card radius="lg">
            <Vstack gap={3} className="py-10 text-center">
              <CalendarClock size={34} style={{ color: colors["textFaded"] }} />
              <Text size="xl" weight="semibold">{uiText("AppStrings.ConnectTwitchToCreateEvents")}</Text>
              <Text color="textFaded" className="max-w-md">
                 {uiText("AppStrings.ConnectYourTwitchAccountInSettingsSoCommunityMembersKnowWhereToWatchYourEvents")} </Text>
              <Hstack>
                <Button href="/settings" color="blue">{uiText("AppStrings.OpenSettings")}</Button>
                <Button href="/events" variant="ghost">{uiText("AppStrings.BackToEvents")}</Button>
              </Hstack>
            </Vstack>
          </Card>
        ) : (
          <Form onSubmit={submitEvent}>
            <Card padding={0} radius="lg" className="overflow-hidden">
              <Vstack align="stretch" gap={0}>
                <section className="space-y-5 p-5 sm:p-7">
                  <Vstack align="start" gap={0}>
                    <Text size="xl" weight="semibold">{uiText("AppStrings.EventDetails")}</Text>
                  </Vstack>

                  <Vstack align="stretch" gap={2}>
                    <FieldLabel>{uiText("AppStrings.Title")}</FieldLabel>
                    <Input
                      required
                      fullWidth
                      name="title"
                      placeholder={uiText("AppStrings.WhatSHappening")}
                      value={title}
                      onValueChange={setTitle}
                      disabled={submitting}
                      aria-invalid={Boolean(formError && !title.trim())}
                    />
                  </Vstack>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Vstack align="stretch" gap={2}>
                      <FieldLabel>{uiText("AppStrings.EventType")}</FieldLabel>
                      <Dropdown
                        backdrop
                        onSelect={(key) => setIcon(key as EventIcon)}
                        trigger={
                          <Button
                            fullWidth
                            leftSlot={selectedType.icon}
                            className="justify-start"
                            disabled={submitting}
                          >
                            {uiText(selectedType.name)}
                          </Button>
                        }
                      >
                        {Object.entries(EVENT_TYPES).map(([key, type]) => (
                          <Dropdown.Item
                            key={key}
                            value={key}
                            icon={key as IconName}
                            description={uiText(type.description)}
                          >
                            {uiText(type.name)}
                          </Dropdown.Item>
                        ))}
                      </Dropdown>
                    </Vstack>

                    <Vstack align="stretch" gap={2}>
                      <FieldLabel hint="Optional">{uiText("AppStrings.StreamOrEventLink")}</FieldLabel>
                      <Input
                        fullWidth
                        name="link"
                        type="url"
                        placeholder="https://twitch.tv/..."
                        value={link}
                        onValueChange={setLink}
                        disabled={submitting}
                        leftIcon={<Link2 size={15} />}
                      />
                    </Vstack>
                  </div>
                </section>

                <section
                  className="space-y-5 border-y p-5 sm:p-7"
                  style={{ borderColor: `color-mix(in srgb, ${colors["text"]} 7%, transparent)` }}
                >
                  <Vstack align="start" gap={0}>
                    <Text size="xl" weight="semibold">{uiText("AppStrings.Schedule")}</Text>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.TimesAreShownInYourLocalTimezone")} {Intl.DateTimeFormat().resolvedOptions().timeZone}.
                    </Text>
                  </Vstack>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      required
                      fullWidth
                      label={uiText("AppStrings.Starts")}
                      labelPlacement="outside"
                      type="datetime-local"
                      value={start}
                      onValueChange={setStart}
                      disabled={submitting}
                    />
                    <Input
                      required
                      fullWidth
                      label={uiText("AppStrings.Ends")}
                      labelPlacement="outside"
                      type="datetime-local"
                      min={start}
                      value={end}
                      onValueChange={setEnd}
                      disabled={submitting}
                    />
                  </div>
                </section>

                <section className="space-y-3 p-5 sm:p-7">
                  <Vstack align="start" gap={0}>
                    <Text size="xl" weight="semibold">{uiText("About.Title")}</Text>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.ShareWhatYouLlBeDoingAndAnythingAttendeesShouldKnow")} </Text>
                  </Vstack>
                  <Editor content={content} setContent={setContent} />
                </section>

                <footer
                  className="flex flex-col-reverse items-stretch justify-between gap-3 border-t p-5 sm:flex-row sm:items-center sm:p-7"
                  style={{ borderColor: `color-mix(in srgb, ${colors["text"]} 7%, transparent)` }}
                >
                  <div className="min-h-5">
                    {formError && (
                      <Text size="sm" color="red" role="alert">
                        {formError}
                      </Text>
                    )}
                  </div>
                  <Hstack className="justify-end">
                    <Button href="/events" variant="ghost" disabled={submitting}>
                       {uiText("AppStrings.Cancel")} </Button>
                    <Button type="submit" icon="calendarplus" color="blue" loading={submitting}>
                       {uiText("AppStrings.CreateEvent2")} </Button>
                  </Hstack>
                </footer>
              </Vstack>
            </Card>
          </Form>
        )}
      </Vstack>
    </main>
  );
}
