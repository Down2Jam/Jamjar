/**
 * @file The page that shows when someone first visits the site (/)
 *
 * @author Ategon
 * @created 2025-8-13
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SplashBackground from "./SplashBackground";
import { Hstack, Stack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import SplashLogo from "./SplashLogo";
import SplashDate from "./SplashDate";
import MobileLogo from "./MobileLogo";

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

      <div className="flex items-center justify-center min-h-[calc(100vh-98px)]">
        <Hstack className="relative z-0 text-center sm:text-left">
          <Vstack align="center">
            <MobileLogo />
            <Vstack align="start" gap={0}>
              <Text
                gradient={{ from: "blue", to: "pink" }}
                weight="bold"
                size="5xl"
                className="mx-auto sm:mx-0"
              >
                Splash.Title
              </Text>
              <Text
                weight="semibold"
                size="2xl"
                color="textLight"
                className="mx-auto sm:mx-0"
              >
                Splash.Description
              </Text>
              <SplashDate />
            </Vstack>

            <Stack
              direction="flex-col sm:flex-row"
              align="stretch"
              className="mx-auto mt-4 sm:mt-0"
            >
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
            </Stack>
          </Vstack>

          <SplashLogo />
        </Hstack>
      </div>
    </>
  );
}
