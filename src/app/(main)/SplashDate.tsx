"use client";

import { Text } from "bioloom-ui";
import { useCurrentJam } from "@/hooks/queries";
import { isPostJamPhase } from "@/helpers/jamDisplay";

export default function SplashDate() {
  const { data: activeJamResponse } = useCurrentJam();
  const currentJam = activeJamResponse?.jam ?? null;
  const nextJam = activeJamResponse?.nextJam ?? null;

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formatJamRange = (startTime: string, hours: number) => (
    <>
      {new Date(startTime).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(startTime).getDate()}
      {getOrdinalSuffix(new Date(startTime).getDate())}
      {" - "}
      {new Date(
        new Date(startTime).getTime() + hours * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(
        new Date(startTime).getTime() + hours * 60 * 60 * 1000,
      ).getDate()}
      {getOrdinalSuffix(
        new Date(
          new Date(startTime).getTime() + hours * 60 * 60 * 1000,
        ).getDate(),
      )}{" "}
      {new Date(
        new Date(startTime).getTime() + hours * 60 * 60 * 1000,
      ).getFullYear()}
    </>
  );

  const getPostJamLabel = () => {
    switch (activeJamResponse?.phase) {
      case "Rating":
        return "currently in the rating period";
      case "Post-Jam Refinement":
        return "currently in the post-jam refinement period";
      case "Post-Jam Rating":
        return "currently in the post-jam rating period";
      default:
        return null;
    }
  };

  const postJamLabel = getPostJamLabel();

  if (!currentJam) {
    return <></>;
  }

  return (
    <Text color="textLightFaded" className="mx-auto sm:mx-0">
      {formatJamRange(currentJam.startTime, currentJam.jammingHours)}
      {postJamLabel ? ` (${postJamLabel})` : null}
      {isPostJamPhase(activeJamResponse?.phase) && nextJam && (
        <>
          <br />
          {`Next edition: `}
          {formatJamRange(nextJam.startTime, nextJam.jammingHours)}
        </>
      )}
    </Text>
  );
}
