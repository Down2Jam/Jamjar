import { Spacer } from "@heroui/react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SplashBackground from "./SplashBackground";
import SplashClient from "./SplashClient";

export default async function Home() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("user");

  // If the user is logged in they should be on the forum instead
  if (token) {
    redirect("/home");
  }

  return (
    <>
      <SplashBackground />
      <Spacer y={72} className="!mt-60 sm:!mt-72" />
      <SplashClient />
    </>
  );
}
