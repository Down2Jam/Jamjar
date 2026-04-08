"use client";

import { Text } from "bioloom-ui";
import { useCurrentJam } from "@/hooks/queries";
import { getDisplayJamForPublicView } from "@/helpers/jamDisplay";

export default function SplashDate() {
  const { data: activeJamResponse } = useCurrentJam();
  const displayJam = getDisplayJamForPublicView(activeJamResponse);

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

  if (!displayJam) {
    return <></>;
  }

  return (
    <Text color="textLightFaded" className="mx-auto sm:mx-0">
      {new Date(displayJam.startTime).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(displayJam.startTime).getDate()}
      {getOrdinalSuffix(new Date(displayJam.startTime).getDate())}
      {" - "}
      {new Date(
        new Date(displayJam.startTime).getTime() +
          displayJam.jammingHours * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(
        new Date(displayJam.startTime).getTime() +
          displayJam.jammingHours * 60 * 60 * 1000
      ).getDate()}
      {getOrdinalSuffix(
        new Date(
          new Date(displayJam.startTime).getTime() +
            displayJam.jammingHours * 60 * 60 * 1000
        ).getDate()
      )}
    </Text>
  );
}
