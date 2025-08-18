"use client";

import { getCurrentJam } from "@/helpers/jam";
import { JamType } from "@/types/JamType";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Accordion, AccordionItem } from "@/framework/Accordion";
import Text from "@/framework/Text";
import { Card } from "@/framework/Card";
import { Hstack, Stack, Vstack } from "@/framework/Stack";
import Icon from "@/framework/Icon";
import AboutLogo from "../AboutLogo";

export default function AboutPage() {
  const [jam, setJam] = useState<JamType | null>();
  const { colors } = useTheme();

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
    <Vstack>
      <div className="p-8">
        <AboutLogo />
      </div>
      <Stack direction="flex-col lg:flex-row" align="stretch">
        <Card className="lg:min-w-96">
          <Vstack align="start">
            <Text size="2xl">Splash.Title</Text>
            <Text size="sm" color="textFaded">
              Splash.Description
            </Text>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <div
                  className="flex-none border-1 rounded-small text-center w-11 overflow-hidden"
                  style={{
                    borderColor: colors["textFaded"],
                  }}
                >
                  <div
                    className="text-tiny py-0.5"
                    style={{
                      color: colors["mantle"],
                      backgroundColor: colors["textFaded"],
                    }}
                  >
                    {jam ? format(new Date(jam.startTime), "MMM") : ""}
                  </div>
                  <div
                    className="flex items-center justify-center font-semibold text-medium h-6"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    {jam ? format(new Date(jam.startTime), "dd") : ""}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p
                    className="text-medium font-medium"
                    style={{
                      color: colors["text"],
                    }}
                  >
                    {jam
                      ? format(new Date(jam.startTime), "EEEE, MMMM do")
                      : ""}
                  </p>
                  <p
                    className="text-small"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
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
                <div
                  className="flex items-center justify-center border-1 rounded-small w-11 h-11"
                  style={{
                    borderColor: colors["textFaded"],
                  }}
                >
                  <Users
                    style={{
                      color: colors["textFaded"],
                    }}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p
                    className="text-medium font-medium"
                    style={{
                      color: colors["text"],
                    }}
                  >
                    Entrants
                  </p>
                  <p
                    className="text-small"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    {jam?.users.length ?? "..."} and counting
                  </p>
                </div>
              </div>
            </div>
          </Vstack>
        </Card>

        <Card>
          <Vstack align="start">
            <Hstack>
              <Icon name="circlehelp" />
              <Text size="xl">About the event</Text>
            </Hstack>
            <Text color="textFaded" size="sm">
              About.Description
            </Text>
          </Vstack>
        </Card>
      </Stack>
      <Card>
        <Vstack align="start">
          <Hstack>
            <Icon name="gamepad2" color="red" />
            <Text size="xl" color="red">
              GameFAQ.Title
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            GameFAQ.Description
          </Text>
          <Accordion>
            <AccordionItem
              title="GameFAQ.Q1.Number"
              subtitle="GameFAQ.Q1.Question"
            >
              <Text color="textFaded">GameFAQ.Q1.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q2.Number"
              subtitle="GameFAQ.Q2.Question"
            >
              <Text color="textFaded">GameFAQ.Q2.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q3.Number"
              subtitle="GameFAQ.Q3.Question"
            >
              <Text color="textFaded">GameFAQ.Q3.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q4.Number"
              subtitle="GameFAQ.Q4.Question"
            >
              <Text color="textFaded">GameFAQ.Q4.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q5.Number"
              subtitle="GameFAQ.Q5.Question"
            >
              <Text color="textFaded">GameFAQ.Q5.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q6.Number"
              subtitle="GameFAQ.Q6.Question"
            >
              <Text color="textFaded">GameFAQ.Q6.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q7.Number"
              subtitle="GameFAQ.Q7.Question"
            >
              <Text color="textFaded">GameFAQ.Q7.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q8.Number"
              subtitle="GameFAQ.Q8.Question"
            >
              <Text color="textFaded">GameFAQ.Q8.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q9.Number"
              subtitle="GameFAQ.Q9.Question"
            >
              <Text color="textFaded">GameFAQ.Q9.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="GameFAQ.Q10.Number"
              subtitle="GameFAQ.Q10.Question"
            >
              <Text color="textFaded">GameFAQ.Q10.Answer</Text>
            </AccordionItem>
          </Accordion>
        </Vstack>
      </Card>
      <Card>
        <Vstack align="start">
          <Hstack>
            <Icon name="users" color="orange" />
            <Text size="xl" color="orange">
              TeamFAQ.Title
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            TeamFAQ.Description
          </Text>
          <Accordion>
            <AccordionItem
              title="TeamFAQ.Q1.Number"
              subtitle="TeamFAQ.Q1.Question"
            >
              <Text color="textFaded">TeamFAQ.Q1.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="TeamFAQ.Q2.Number"
              subtitle="TeamFAQ.Q2.Question"
            >
              <Text color="textFaded">TeamFAQ.Q2.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="TeamFAQ.Q3.Number"
              subtitle="TeamFAQ.Q3.Question"
            >
              <Text color="textFaded">TeamFAQ.Q3.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="TeamFAQ.Q4.Number"
              subtitle="TeamFAQ.Q4.Question"
            >
              <Text color="textFaded">TeamFAQ.Q4.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="TeamFAQ.Q5.Number"
              subtitle="TeamFAQ.Q5.Question"
            >
              <Text color="textFaded">TeamFAQ.Q5.Answer</Text>
            </AccordionItem>
          </Accordion>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="start">
          <Hstack>
            <Icon name="star" color="yellow" />
            <Text size="xl" color="yellow">
              RatingsFAQ.Title
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            RatingsFAQ.Description
          </Text>
          <Accordion>
            <AccordionItem
              title="RatingsFAQ.Q1.Number"
              subtitle="RatingsFAQ.Q1.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q1.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="RatingsFAQ.Q2.Number"
              subtitle="RatingsFAQ.Q2.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q2.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="RatingsFAQ.Q3.Number"
              subtitle="RatingsFAQ.Q3.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q3.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="RatingsFAQ.Q4.Number"
              subtitle="RatingsFAQ.Q4.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q4.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="RatingsFAQ.Q5.Number"
              subtitle="RatingsFAQ.Q5.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q5.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="RatingsFAQ.Q6.Number"
              subtitle="RatingsFAQ.Q6.Question"
            >
              <Text color="textFaded">RatingsFAQ.Q6.Answer</Text>
            </AccordionItem>
          </Accordion>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="start">
          <Hstack>
            <Icon name="broadcast" color="green" />
            <Text size="xl" color="green">
              StreamsFAQ.Title
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            StreamsFAQ.Description
          </Text>
          <Accordion>
            <AccordionItem
              title="StreamsFAQ.Q1.Number"
              subtitle="StreamsFAQ.Q1.Question"
            >
              <Text color="textFaded">StreamsFAQ.Q1.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="StreamsFAQ.Q2.Number"
              subtitle="StreamsFAQ.Q2.Question"
            >
              <Text color="textFaded">StreamsFAQ.Q2.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="StreamsFAQ.Q3.Number"
              subtitle="StreamsFAQ.Q3.Question"
            >
              <Text color="textFaded">StreamsFAQ.Q3.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="StreamsFAQ.Q4.Number"
              subtitle="StreamsFAQ.Q4.Question"
            >
              <Text color="textFaded">StreamsFAQ.Q4.Answer</Text>
            </AccordionItem>
          </Accordion>
        </Vstack>
      </Card>

      <Card>
        <Vstack align="start">
          <Hstack>
            <Icon name="linechart" color="blue" />
            <Text size="xl" color="blue">
              MetaFAQ.Title
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            MetaFAQ.Description
          </Text>
          <Accordion>
            <AccordionItem
              title="MetaFAQ.Q1.Number"
              subtitle="MetaFAQ.Q1.Question"
            >
              <Text color="textFaded">MetaFAQ.Q1.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="MetaFAQ.Q2.Number"
              subtitle="MetaFAQ.Q2.Question"
            >
              <Text color="textFaded">MetaFAQ.Q2.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="MetaFAQ.Q3.Number"
              subtitle="MetaFAQ.Q3.Question"
            >
              <Text color="textFaded">MetaFAQ.Q3.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="MetaFAQ.Q4.Number"
              subtitle="MetaFAQ.Q4.Question"
            >
              <Text color="textFaded">MetaFAQ.Q4.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="MetaFAQ.Q5.Number"
              subtitle="MetaFAQ.Q5.Question"
            >
              <Text color="textFaded">MetaFAQ.Q5.Answer</Text>
            </AccordionItem>
            <AccordionItem
              title="MetaFAQ.Q6.Number"
              subtitle="MetaFAQ.Q6.Question"
            >
              <Text color="textFaded">MetaFAQ.Q6.Answer</Text>
            </AccordionItem>
          </Accordion>
        </Vstack>
      </Card>
    </Vstack>
  );
}
