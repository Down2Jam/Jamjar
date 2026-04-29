"use client";

import { use } from "react";
import { RadioStationPage } from "../page";
import type { RadioStation } from "@/requests/radio";

export default function RadioStationRoute({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station } = use(params);
  const normalizedStation: RadioStation = station === "safe" ? "safe" : "all";
  return <RadioStationPage station={normalizedStation} />;
}
