import { getCurrentJam } from "@/helpers/jam";
import { GameType } from "@/types/GameType";
import { getRatingCategories } from "@/requests/game";
import { Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import Timers from "../timers";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";

export default async function SidebarStats() {
  const jamResponse = await getCurrentJam();
  const currentJam = jamResponse?.jam;
  const ratingResponse = await getRatingCategories(true);
  const ratingCategories = (await ratingResponse.json()).data;
  const ratings = Math.round(
    currentJam?.games.reduce(
      (prev: number, cur: GameType) =>
        cur.ratings.length /
          (cur.ratingCategories.length + ratingCategories.length) +
        prev,
      0
    ) || 0
  );
  const users = currentJam?.users.length || 0;
  const games = currentJam?.games.filter((game) => game.published).length || 0;
  const music = currentJam?.games
    .filter((game) => game.published)
    .reduce((acc, game) => acc + game.tracks?.length || 0, 0);

  return (
    <Card>
      <Vstack>
        <Timers />
        <Hstack>
          <Icon name="users" color="textFaded" />
          <Text>Stats.Entrants</Text>
          <Text color="blue">{users}</Text>
        </Hstack>
        {games != 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" />
            <Text>Stats.Games</Text>
            <Text color="blue">{games}</Text>
          </Hstack>
        )}
        {music != 0 && (
          <Hstack>
            <Icon name="music" color="textFaded" />
            <Text>Music</Text>
            <Text color="blue">{music}</Text>
          </Hstack>
        )}
        {ratings != 0 && (
          <Hstack>
            <Icon name="star" color="textFaded" />
            <Text>Stats.Ratings</Text>
            <Text color="blue">{ratings}</Text>
          </Hstack>
        )}
      </Vstack>
    </Card>
  );
}
