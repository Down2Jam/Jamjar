import { Navigate } from "react-router";
import SplashBackground from "@/app/(main)/SplashBackground";
import SplashLogo from "@/app/(main)/SplashLogo";
import SplashDate from "@/app/(main)/SplashDate";
import MobileLogo from "@/app/(main)/MobileLogo";
import { getCookie } from "@/helpers/cookie";
import { Button, Hstack, Stack, Text, Vstack } from "bioloom-ui";

export default function SplashRoute() {
  const token = getCookie("user");
  const hasLoggedIn = getCookie("hasLoggedIn");

  if (token) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <SplashBackground />

      <div className="flex items-center justify-center min-h-[calc(100vh-98px)]">
        <Vstack>
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
                className="self-start"
              >
                {hasLoggedIn ? (
                  <Button href="/login" icon="login" color="blue">
                    Themes.Login
                  </Button>
                ) : (
                  <Button href="/signup" icon="login" color="blue">
                    Splash.Join
                  </Button>
                )}
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
        </Vstack>
      </div>
    </>
  );
}
