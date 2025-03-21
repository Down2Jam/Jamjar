"use client";

import { getCurrentJam } from "@/helpers/jam";
import { JamType } from "@/types/JamType";
import { Accordion, AccordionItem, Image } from "@nextui-org/react";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";

export default function AboutPage() {
  const [jam, setJam] = useState<JamType | null>();

  useEffect(() => {
    loadUser();
    async function loadUser() {
      try {
        const jamResponse = await getCurrentJam();
        const currentJam = jamResponse?.jam;
        setJam(currentJam);
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
      <div className="flex flex-col gap-2 py-4 text-[#333] dark:text-white">
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
                {jam ? format(new Date(jam.startTime), "EEEE, MMMM do") : ""}
              </p>
              <p className="text-small text-default-500">
                {jam
                  ? format(
                      toZonedTime(
                        new Date(jam.startTime),
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      ),
                      "p zzz"
                    )
                  : ""}
              </p>
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
              ends. After the jam there is a 2 week rating period to play, rate,
              and give feedback to other entries in the jam. In addition any
              post jam events such as the Score Chasers tournament will be run
              in the post jam period.
            </p>
            <p>
              We have 2 categories: Regular and O.D.A (One Dev Army). Both
              happen at the same time.
            </p>
          </div>
          <p>Game FAQ</p>
          <Accordion>
            <AccordionItem
              title="Q1"
              subtitle="How long do I have to make the game?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>3 Days. From Friday to Monday (depending on the time zone).</p>
            </AccordionItem>
            <AccordionItem
              title="Q2"
              subtitle="Can I use premade code and assets (art, graphics, music, SFX, etc)?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                <b>Regular</b>: Yes! Anything goes, as long as the game&apos;s
                core experience is crafted during the allowed time.
              </p>
              <p>
                <b>O.D.A</b>: In general, no. This category focuses on creating
                a game from scratch. However, it&apos;s OK to use pre-existing
                assets from the following categories: fonts, code (engine,
                shaders, etc.) and logos. This means you cannot use any premade
                art, music, or SFX. Additionally, the game&apos;s core
                experience must be crafted during the allowed time.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q3"
              subtitle="Can I use Generative AI to make aspects of the game?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                <b>Regular</b>: Yes. However, you cannot opt in to be rated on
                the categories related to what it was used for: If you use it
                for art/graphics, you must not opt in to Graphics. If you use it
                for any form of audio (music, SFX, voice acting, etc), you must
                not opt in to Audio. If you use it for writing dialogue and/or
                jokes, you must not opt in to Emotional Delivery.
              </p>
              <p>
                <b>O.D.A</b>: No. Any use of generative AI is explicitly
                prohibited.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q4"
              subtitle="How do I submit a game?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                You will need to upload your game to a site such as{" "}
                <a href="https://itch.io">Itch.io</a> to host the game files.
                Then you can make a game page on the d2jam site and create a
                link on that page to where you hosted the game files.
              </p>
              <p>
                A page on the d2jam site is required to let people browse games
                in the jam easily and to let you be rated. Eventually we may
                support game hosting directly on the d2jam site in a future jam
                but it would require the jam being supported by donations due to
                storage costs.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q5"
              subtitle="Can I update the game after submission?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                You cannot make edits to the jam build of the game during the
                rating period apart from game breaking bug fixes and porting.
                (For example if you want to make a mac build during the rating
                period without changing anything about the game thats fine. If
                you have a bug that prevents someone from playing your game due
                to a crash that would be a game breaking bug and can be fixed).
              </p>
              <p>
                You can make and post a post-jam version of the game during the
                rating period but the jam version of the game must be more
                prominent and you cannot trick people into playing the post-jam
                version of the game. You can use{" "}
                <a href="https://badcop.games/jampack/" className="underline">
                  jampack
                </a>{" "}
                to have 2 web builds on the same page.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q6"
              subtitle="What happens if I don't submit before the end of the jam?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                There is a 2 hour window after the jam ends that you can still
                upload a game within in order to catch any people that might be
                having last minute issues with builds. This is meant to be a
                period to upload within rather than work on the game more within
                and attempts to submit after the 2 hour submission window will
                not be accepted.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q7"
              subtitle="Can I edit the game page during the rating period?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Yes you can edit the game page and make marketing materials
                (e.g. a game trailer, advertising for your game) within the
                rating period. The sooner you make it the more people would end
                up seeing your game page changes though.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q8"
              subtitle="Are there restrictions on game content (NSFW, extreme violence, etc.)?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                If you include things such as NSFW content you must mark your
                game as containing it so anybody who does not want to see that
                content can filter it out.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q9"
              subtitle="What operating systems do I need to make my game for?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Any operating systems you want. Note however that the more you
                support the more people are able to play your game. In addition
                supporting windows or having a web build is recommended as that
                allows the vast majority of people to play your game.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q10"
              subtitle="Is there limitations on what game engine, etc. I can use?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                You can use whatever you want to make the game as long as it
                does not require the people playing the game to download
                something other than the game itself. For example games on
                roblox would not be allowed as that requires people to download
                roblox instead of downloading the game itself.
              </p>
            </AccordionItem>
          </Accordion>
          <p>Team FAQ</p>
          <Accordion>
            <AccordionItem
              title="Q1"
              subtitle="How many people can make the game?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                <b>Regular</b>: Any number of people.
              </p>
              <p>
                <b>O.D.A</b>: Only one developer.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q2"
              subtitle="Can I be a part of multiple teams / make multiple games?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Yes. It is typically better to focus on one game though so you
                can give it a higher level of polish within the limited
                timeframe.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q3"
              subtitle="How can I find a team?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                We have a{" "}
                <a href="/team-finder" className="underline">
                  team finder
                </a>{" "}
                built into the site you can use to find a team on. In the site
                settings you can set what roles you have on a team and then in
                the team finder you can limit results to only show teams that
                need your role.
              </p>
              <p>
                In addition you can use other locations such as on social media
                or in the team finding channel on our{" "}
                <a href="https://discord.d2jam.com" className="underline">
                  discord server
                </a>
                .
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q4"
              subtitle="Can I edit a team during the jam / after submission?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Yes you can edit teams at any time before the rating period
                ends. So if you forgot to add a teammate before the jam ended
                and they want to be able to contribute to the rankings you can
                invite them into the team during the rating period.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q5"
              subtitle="Does every team member need an account on the site?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                No but they cannot rate games or be credited directly in the
                site UI without an account.
              </p>
            </AccordionItem>
          </Accordion>
          <p>Ratings FAQ</p>
          <Accordion>
            <AccordionItem
              title="Q1"
              subtitle="How are games rated?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Games are rated by other participants in the following
                categories:
              </p>
              <ul className="list-disc pl-6">
                <li>
                  <b>OVERALL:</b> Your overall opinion of the game, how well all
                  the categories are sticking together.
                </li>
                <li>
                  <b>GAMEPLAY:</b> How much you enjoy playing the game, and how
                  satisfying the mechanics are.
                </li>
                <li>
                  <b>AUDIO:</b> How good the game sounds, or how effective the
                  sound design is.
                </li>
                <li>
                  <b>GRAPHICS:</b> How good the game looks, and how effective
                  the visual style is.
                </li>
                <li>
                  <b>CREATIVITY:</b> Uniqueness, Originality, Innovation, and
                  the surprise element.
                </li>
                <li>
                  <b>EMOTIONAL DELIVERY:</b> How effectively the emotional or
                  humorous elements are delivered.
                </li>
                <li>
                  <b>THEME:</b> The game’s take on the theme, and how well it
                  was used and executed.
                </li>
              </ul>
            </AccordionItem>
            <AccordionItem
              title="Q2"
              subtitle="Can I opt out of receiving ratings for any category?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Only the Overall and Theme ratings will be initially opted in
                and cannot be opted out. You must select and opt-in to any other
                rating category you wish to be rated and/or compete in.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q3"
              subtitle="Can people who did not participate rate games?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Yes but any ratings they give do not contribute to the rankings.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q4"
              subtitle="What are the rankings?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                After the rating period games will be ranked in each category
                based on their average rating in that category. For example the
                game with the highest average theme score will be rank #1 in the
                theme category.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q5"
              subtitle="How many ratings do I need to give/receive to be included in the rankings?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                For the current edition of the jam you need to both rate 5 games
                and receive 5 ratings. This prevents a game with only 1 5 star
                rating from instantly winning the jam.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q6"
              subtitle="Does this jam have a prize?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The prize is having a game that youve managed to build and
                release. Theres nothing like a cash prize so the jam has more of
                a community feel instead of becoming competitive.
              </p>
            </AccordionItem>
          </Accordion>
          <p>Streams FAQ</p>
          <Accordion>
            <AccordionItem
              title="Q1"
              subtitle="Can I livestream the jam?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                Yes you can stream anything relating to the jam you want. e.g.
                making progress on your game, playing games made by other
                people, etc.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q2"
              subtitle="How do I show up in the featured streamers section on the sidebar?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                There is 3 priority tiers in the featured streamers section. The
                higher priority you are the further ahead in the featured
                streamers you show. Streams with the same priority are ordered
                by viewers with some randomness. Only livestreams from twitch
                show due to youtube not providing an equivalent api.
              </p>
              <p>
                The lowest priority (that only ever has 3 streams show from) is
                just randomly pulling any gamedev stream on twitch. The medium
                priority is being someone that has been marked as a streamer on
                the site (a.k.a streamers who have an account on the d2jam
                site). The highest priority is streams that use the d2jam tag
                (to show that they are streaming something related to the jam).
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q3"
              subtitle="How can I be marked as a streamer on the site?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                For now just let Ategon know your d2jam username and your twitch
                account.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q4"
              subtitle="How can I let people know about my stream?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The site has a built in event system that shows upcoming and
                active events. If you are marked as a streamer you can go to the
                events page and then add a new event for your stream to make it
                show there. The events are located in the sidebar.
              </p>
            </AccordionItem>
          </Accordion>
          <p>Meta FAQ</p>
          <Accordion>
            <AccordionItem
              title="Q1"
              subtitle="Who is organizing the jam?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The jam is organized primarily by a group of 13 people who make
                sure things run smoothly and who run things like the social
                media accounts for the jam for marketing. Decisions however are
                typically voted on by the community to let the community control
                how the jam is run and anybody is free to start running
                something related to the jam such as a tournament, community
                keynote, or other event.
              </p>
              <p>
                The 13 core organizers are Ategon, Badcop, FunBaseAlpha, Pomo,
                Rincs, Aeron, itsBoats, Brainoid, FlyingKaida,
                BluishGreenProductions, HonestDan, Kuviman, and Tobugis.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q2"
              subtitle="Where are the servers hosted?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The server that hosts the jam is in Canada. In the future
                various things such as the email service, DNS, etc. will be
                swapped to have as many Canadian-based technologies as possible.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q3"
              subtitle="How can I donate to the jam?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                There is currently no way to donate to the jam but it will be
                made in the future once it gets popular enough that it makes
                sense to spend the funds to make a non-profit for the jam.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q4"
              subtitle="How can I help code the site?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The site is currently open source with the repositories
                available in our{" "}
                <a href="https://github.com/Down2Jam" className="underline">
                  github organization
                </a>
                . Jamcore is the backend of the site while jamjar is the
                frontend. Each repository has instructions on how to set it up
                locally and a project board with tasks that need to be made for
                the site. If you have any questions relating to contributing
                feel free to chat in the site development channel in our
                discord.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q5"
              subtitle="Where can I report a bug?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                You can currently reports bugs in our{" "}
                <a href="https://github.com/Down2Jam" className="underline">
                  code repositories
                </a>{" "}
                until a bug report feature is built into the site itself. You
                click on the relevant repository (e.g. if its a frontend issue
                you would go to Jamjar), go to the issues tab, and then create a
                new issue.
              </p>
            </AccordionItem>
            <AccordionItem
              title="Q6"
              subtitle="How often does the jam happen?"
              className="text-medium text-default-500 flex flex-col gap-2"
            >
              <p>
                The jam happens twice a year, typically around 6 months apart.
              </p>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
}
