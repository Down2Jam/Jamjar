/**
 * @file The page that shows when someone first visits the site (/)
 *
 * @author Ategon
 * @created 2025-8-13
 */
import { Spacer } from "@heroui/react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SplashBackground from "./SplashBackground";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import SplashLogo from "./SplashLogo";
import SplashDate from "./SplashDate";

export default async function SplashPage() {
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

      <div className="flex justify-center items-center gap-16 relative z-0 flex-col sm:flex-row text-center sm:text-left">
        <Vstack align="start">
          {/* Title */}
          <Vstack align="start" gap={0}>
            <Text
              gradient={{ from: "blue", to: "pink" }}
              weight="bold"
              size="5xl"
              className="mx-auto sm:mx-0"
            >
              Splash.Title
            </Text>
            <Text weight="semibold" size="2xl" color="textLight">
              Splash.Description
            </Text>
            <SplashDate />
          </Vstack>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center sm:justify-start">
            <Button href="/signup" icon="login" color="blue">
              Splash.Join
            </Button>
            <Button href="/home" icon="map" color="pink">
              Splash.Explore
            </Button>
            <Button href="/about" icon="info">
              Splash.About
            </Button>
            <Button
              href="https://www.youtube.com/watch?v=-Bs6EO_Co7Q"
              icon="bookcopy"
              externalIcon={false}
            >
              Splash.Why
            </Button>
          </div>
        </Vstack>

        <SplashLogo />
      </div>
    </>
  );
}
