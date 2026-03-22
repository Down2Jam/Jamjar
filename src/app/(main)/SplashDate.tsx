"use client";

import { Text } from "bioloom-ui";
import { useCurrentJam } from "@/hooks/queries";

export default function SplashDate() {
  const { data: activeJamResponse } = useCurrentJam();

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

  if (!activeJamResponse?.jam) {
    return <></>;
  }

  return (
    <Text color="textLightFaded" className="mx-auto sm:mx-0">
      {new Date(activeJamResponse.jam.startTime).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(activeJamResponse.jam.startTime).getDate()}
      {getOrdinalSuffix(new Date(activeJamResponse.jam.startTime).getDate())}
      {" - "}
      {new Date(
        new Date(activeJamResponse.jam.startTime).getTime() +
          activeJamResponse.jam.jammingHours * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        month: "long",
      })}{" "}
      {new Date(
        new Date(activeJamResponse.jam.startTime).getTime() +
          activeJamResponse.jam.jammingHours * 60 * 60 * 1000
      ).getDate()}
      {getOrdinalSuffix(
        new Date(
          new Date(activeJamResponse.jam.startTime).getTime() +
            activeJamResponse.jam.jammingHours * 60 * 60 * 1000
        ).getDate()
      )}
    </Text>
  );
}
