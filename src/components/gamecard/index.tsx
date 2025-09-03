import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { useTheme } from "@/providers/SiteThemeProvider";
import { GameType } from "@/types/GameType";
import { SiHtml5, SiLinux } from "@icons-pack/react-simple-icons";
import { Grid2X2, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const platformOrder: Record<string, number> = {
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Web: 4,
  Mobile: 5,
};

export function GameCard({
  game,
  rated = false,
}: {
  game: GameType;
  rated?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Link href={`/g/${game.slug}`}>
      <Card padding={0} className="overflow-hidden relative">
        {rated && (
          <div className="absolute z-20 inset-0 flex items-center justify-center text-white font-bold text-xl bg-black/80">
            <p className="opacity-50">RATED</p>
          </div>
        )}
        <div
          className="absolute top-0 left-0 p-2 pt-1 pb-1 rounded shadow-md m-2 backdrop-blur-md text-xs"
          style={{
            color: colors["text"],
            background: colors["green"] + "aa",
            borderColor: colors["green"],
          }}
        >
          {game.jam.name}
        </div>
        <div
          className="absolute top-0 right-0 p-2 pt-1 pb-1 rounded shadow-md m-2 backdrop-blur-md text-xs"
          style={{
            color: colors["text"],
            background:
              colors[
                game.category == "REGULAR"
                  ? "blue"
                  : game.category == "ODA"
                  ? "purple"
                  : "pink"
              ] + "aa",
            borderColor:
              colors[
                game.category == "REGULAR"
                  ? "blue"
                  : game.category == "ODA"
                  ? "purple"
                  : "pink"
              ],
          }}
        >
          {game.category}
        </div>
        <div className="shadow-[inset_0_0_20px_rgba(0, 0, 0, 0.7)]">
          <Image
            alt={`${game.name}'s thumbnail`}
            height={200}
            width={360}
            className="max-w-90 max-h-[200px] object-cover shadow-inner"
            src={game.thumbnail ?? "/images/D2J_Icon.png"}
          />
        </div>
        <div
          className="absolute blur-md opacity-50 [mask-image:linear-gradient(to_top,#000000cc,#00000033,#00000011,transparent)] [mask-repeat:no-repeat] [mask-size:100%_30%] [mask-position:bottom] [-webkit-mask-image:linear-gradient(to_top,#00000044,transparent)]"
          style={{
            transform: "scale(1, -1)",
          }}
        >
          <Image
            alt={`${game.name}'s thumbnail`}
            height={200}
            width={360}
            className="max-w-90 max-h-[200px] object-cover shadow-inner"
            src={game.thumbnail ?? "/images/D2J_Icon.png"}
          />
        </div>
        <Hstack
          justify="between"
          className="border-t-1 w-full p-2 pb-4 px-4"
          style={{
            borderColor: colors["text"] + "66",
            backgroundColor: colors["base"],
          }}
        >
          <Vstack gap={0} align="start">
            <Text size="2xl" color="text">
              {game.name}
            </Text>

            <Text
              size="sm"
              color="textFaded"
              style={{
                borderColor: colors["base"],
              }}
            >
              {game.short || "General.NoDescription"}
            </Text>
          </Vstack>
          <Hstack>
            {game.downloadLinks
              .map((type) => type.platform)
              .sort(
                (a, b) => (platformOrder[a] ?? 99) - (platformOrder[b] ?? 99)
              )
              .map((platform) => {
                switch (platform) {
                  case "Linux":
                    return <SiLinux key="linux" />;
                  case "Mobile":
                    return <Smartphone strokeWidth={1} key="phone" />;
                  case "Windows":
                    return <Grid2X2 strokeWidth={1} key="windows" />;
                  case "MacOS":
                    return (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="24"
                        height="24"
                        viewBox="0 0 50 50"
                        fill="currentColor"
                        key="mac"
                      >
                        <path d="M 33.375 0 C 30.539063 0.191406 27.503906 1.878906 25.625 4.15625 C 23.980469 6.160156 22.601563 9.101563 23.125 12.15625 C 22.65625 12.011719 22.230469 11.996094 21.71875 11.8125 C 20.324219 11.316406 18.730469 10.78125 16.75 10.78125 C 12.816406 10.78125 8.789063 13.121094 6.25 17.03125 C 2.554688 22.710938 3.296875 32.707031 8.90625 41.25 C 9.894531 42.75 11.046875 44.386719 12.46875 45.6875 C 13.890625 46.988281 15.609375 47.980469 17.625 48 C 19.347656 48.019531 20.546875 47.445313 21.625 46.96875 C 22.703125 46.492188 23.707031 46.070313 25.59375 46.0625 C 25.605469 46.0625 25.613281 46.0625 25.625 46.0625 C 27.503906 46.046875 28.476563 46.460938 29.53125 46.9375 C 30.585938 47.414063 31.773438 48.015625 33.5 48 C 35.554688 47.984375 37.300781 46.859375 38.75 45.46875 C 40.199219 44.078125 41.390625 42.371094 42.375 40.875 C 43.785156 38.726563 44.351563 37.554688 45.4375 35.15625 C 45.550781 34.90625 45.554688 34.617188 45.445313 34.363281 C 45.339844 34.109375 45.132813 33.910156 44.875 33.8125 C 41.320313 32.46875 39.292969 29.324219 39 26 C 38.707031 22.675781 40.113281 19.253906 43.65625 17.3125 C 43.917969 17.171875 44.101563 16.925781 44.164063 16.636719 C 44.222656 16.347656 44.152344 16.042969 43.96875 15.8125 C 41.425781 12.652344 37.847656 10.78125 34.34375 10.78125 C 32.109375 10.78125 30.46875 11.308594 29.125 11.8125 C 28.902344 11.898438 28.738281 11.890625 28.53125 11.96875 C 29.894531 11.25 31.097656 10.253906 32 9.09375 C 33.640625 6.988281 34.90625 3.992188 34.4375 0.84375 C 34.359375 0.328125 33.894531 -0.0390625 33.375 0 Z M 32.3125 2.375 C 32.246094 4.394531 31.554688 6.371094 30.40625 7.84375 C 29.203125 9.390625 27.179688 10.460938 25.21875 10.78125 C 25.253906 8.839844 26.019531 6.828125 27.1875 5.40625 C 28.414063 3.921875 30.445313 2.851563 32.3125 2.375 Z M 16.75 12.78125 C 18.363281 12.78125 19.65625 13.199219 21.03125 13.6875 C 22.40625 14.175781 23.855469 14.75 25.5625 14.75 C 27.230469 14.75 28.550781 14.171875 29.84375 13.6875 C 31.136719 13.203125 32.425781 12.78125 34.34375 12.78125 C 36.847656 12.78125 39.554688 14.082031 41.6875 16.34375 C 38.273438 18.753906 36.675781 22.511719 37 26.15625 C 37.324219 29.839844 39.542969 33.335938 43.1875 35.15625 C 42.398438 36.875 41.878906 38.011719 40.71875 39.78125 C 39.761719 41.238281 38.625 42.832031 37.375 44.03125 C 36.125 45.230469 34.800781 45.988281 33.46875 46 C 32.183594 46.011719 31.453125 45.628906 30.34375 45.125 C 29.234375 44.621094 27.800781 44.042969 25.59375 44.0625 C 23.390625 44.074219 21.9375 44.628906 20.8125 45.125 C 19.6875 45.621094 18.949219 46.011719 17.65625 46 C 16.289063 45.988281 15.019531 45.324219 13.8125 44.21875 C 12.605469 43.113281 11.515625 41.605469 10.5625 40.15625 C 5.3125 32.15625 4.890625 22.757813 7.90625 18.125 C 10.117188 14.722656 13.628906 12.78125 16.75 12.78125 Z"></path>
                      </svg>
                    );
                  case "Web":
                    return <SiHtml5 key="web" />;
                  default:
                    return <></>;
                }
              })}
          </Hstack>
        </Hstack>
      </Card>
    </Link>
  );
}
