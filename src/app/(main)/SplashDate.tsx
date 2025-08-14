"use client";

import { useEffect, useState } from "react";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import Text from "@/framework/Text";

export default function SplashDate() {
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const jamData = await getCurrentJam();

      setActiveJamResponse(jamData);
    };

    fetchData();
  }, []);

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
    <Text color="textLightFaded">
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
