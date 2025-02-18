"use client";

import ButtonAction from "@/components/link-components/ButtonAction";
import ButtonLink from "@/components/link-components/ButtonLink";
import { hasCookie } from "@/helpers/cookie";
import { getCurrentJam, joinJam } from "@/helpers/jam";
import { getSelf } from "@/requests/user";
import { JamType } from "@/types/JamType";
import { UserType } from "@/types/UserType";
import { Image } from "@nextui-org/react";
import { CalendarPlus, LogInIcon, NotebookPen, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AboutPage() {
  const [jam, setJam] = useState<JamType | null>();
  const [isInJam, setIsInJam] = useState<boolean>();
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
        const jamResponse = await getCurrentJam();
        const currentJam = jamResponse?.jam;
        setJam(currentJam);

        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }

        const response = await getSelf();

        const user = await response.json();

        if (
          currentJam &&
          user.jams.filter((jam: JamType) => jam.id == currentJam.id).length > 0
        ) {
          setIsInJam(true);
        } else {
          setIsInJam(false);
        }

        if (response.status == 200) {
          setUser(user);
        } else {
          setUser(undefined);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  return (
    <>
      <div className="flex w-full justify-center items-center pt-4">
        <Image
          isBlurred
          isZoomed
          alt="Event image"
          className="aspect-square w-full hover:scale-110"
          height={300}
          src="/images/D2J_Icon.png"
        />
      </div>
      <div className="flex flex-col gap-2 py-4">
        <h1 className="text-2xl fint-bold leading-7">{jam?.name}</h1>
        <p className="text-sm text-default-500">
          The community centered game jam
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <div className="flex-none border-1 border-default-200/50 rounded-small text-center w-11 overflow-hidden">
              <div className="text-tiny bg-default-100 py-0.5 text-default-500">
                Mar
              </div>
              <div className="flex items-center justify-center font-semibold text-medium h-6 text-default-500">
                21
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-medium text-foreground font-medium">
                Friday, March 21st
              </p>
              <p className="text-small text-default-500">5:00 PM EST</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center justify-center border-1 border-default-200/50 rounded-small w-11 h-11">
              <Users className="text-[#999]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-medium text-foreground font-medium">
                Entrants
              </p>
              <p className="text-small text-default-500">
                {jam?.users.length || "..."} and counting
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-4 gap-3 items-start">
          <span className="text-medium font-medium">About the event</span>
          <div className="text-medium text-default-500 flex flex-col gap-2">
            <p>
              D2Jam is a community centered game jam with a emphasis on
              supporting things constructed by the community! We wanted a jam
              which celebrated post-submission events, encouraged discourse and
              reflection, and provided tools for developers to find and share
              games.
            </p>
            <p>
              D2Jam is an online game jam that anyone is free to join and that
              lasts for 3 days (Somewhere between Friday and Monday depending on
              timezones). There is a 2 hour submission window at the end as a
              time to make sure you get your game submitted before the jam fully
              ends. After the jam there is a 2-3 week rating period to play,
              rate, and give feedback to other entries in the jam. In addition
              any post jam events such as the Score Chasers tournament will be
              run in the post jam period.
            </p>
          </div>
          <span className="text-medium font-medium">
            Games will be rated on:
          </span>
          <div className="text-medium text-default-500 flex flex-col gap-2">
            <ul className="list-disc pl-6">
              <li>
                <b>OVERALL:</b> Your overall opinion of the game, how well all
                the categories are sticking together.
              </li>
              <li>
                <b>GAMEPLAY:</b> How much you enjoy playing the game, how
                satisfying the mechanics are.
              </li>
              <li>
                <b>AUDIO:</b> How good the game sounds, or how effective the
                sound design is.
              </li>
              <li>
                <b>GRAPHICS:</b> How good the game looks, or how effective the
                visual style is.
              </li>
              <li>
                <b>CREATIVITY:</b> Uniqueness, Originality, Innovation, the
                surprise element.
              </li>
              <li>
                <b>EMOTIONAL DELIVERY:</b> How effectively the emotional or
                humorous elements are delivered.
              </li>
            </ul>
            <p>
              Ratings will be done in a 5 star rating system with half stars.
            </p>
            <p>
              All ratings except for OVERALL will initially be opt out and you
              must choose to opt in on every category you wish to be rated on.
            </p>
            <p>
              Entrants using generative AI to produce art or audio must not
              aop-in on the respective categories.
            </p>
          </div>
          <span className="text-medium font-medium">
            O.D.A Format: ONE DEV ARMY
          </span>
          <div className="text-medium text-default-500 flex flex-col gap-2">
            <p>A harder format for solo devs who want a challenge</p>
            <ul className="list-disc pl-6">
              <li>You must work alone</li>
              <li>You must make all code, art and music from scratch.</li>
              <li>Any use of generative AI is prohibited.</li>
            </ul>
          </div>
          {user && jam && !isInJam && (
            <ButtonAction
              icon={<CalendarPlus />}
              name="Join jam"
              onPress={async () => {
                const currentJamResponse = await getCurrentJam();
                const currentJam = currentJamResponse?.jam;

                if (!currentJam) {
                  toast.error("There is no jam to join");
                  return;
                }
                if (await joinJam(currentJam.id)) {
                  setIsInJam(true);
                }
              }}
            />
          )}
          {!user && (
            <div className="flex gap-2">
              <ButtonLink icon={<LogInIcon />} name="Log In" href="/login" />
              <ButtonLink
                icon={<NotebookPen />}
                name="Sign Up"
                href="/signup"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
