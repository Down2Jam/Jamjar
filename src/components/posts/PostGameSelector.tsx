import { useEffect, useId, useState } from "react";
import { useTranslations } from "@/compat/next-intl";
import { getLinkablePostGames } from "@/requests/post";
import { readArray } from "@/requests/helpers";
import type { LinkedPostGame } from "@/types/PostType";
import { useTheme } from "@/providers/useSiteTheme";
import PostSelect from "./PostSelect";

export default function PostGameSelector({ value, onChange }: {
  value: LinkedPostGame[];
  onChange: (games: LinkedPostGame[]) => void;
}) {
  const t = useTranslations();
  const { colors } = useTheme();
  const id = useId();
  const [games, setGames] = useState<LinkedPostGame[]>([]);
  useEffect(() => {
    let active = true;
    getLinkablePostGames().then(async response => {
      if (!response.ok) return;
      const result = await readArray<LinkedPostGame>(response);
      if (active) setGames(result);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!games.length) return null;
  return <div className="game-editor-row">
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium">{t("PostGames.SelectTitle")}</label>
        <p id={`${id}-description`} className="text-xs" style={{ color: colors.textFaded }}>{t("PostGames.SelectDescription")}</p>
      </div>
      <PostSelect<LinkedPostGame>
        inputId={id}
        instanceId={id}
        aria-describedby={`${id}-description`}
        isMulti
        isClearable
        options={games}
        value={value}
        getOptionValue={game => String(game.gameId)}
        getOptionLabel={game => game.name}
        formatOptionLabel={(game, { context }) => (
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={game.thumbnail || "/images/game-thumbnail.png"}
              alt=""
              className={`aspect-video shrink-0 rounded object-cover ${context === "menu" ? "w-[76px]" : "w-12"}`}
            />
            <span className="flex min-w-0 flex-col gap-1 break-words">
              <span>{game.name}</span>
              {context === "menu" && game.jam?.name && (
                <span className="text-xs font-normal opacity-75">{game.jam.name}</span>
              )}
            </span>
          </div>
        )}
        onChange={selected => onChange(selected.map(game => ({ ...game, relationType: game.relationType ?? "devlog" })))}
        placeholder={t("PostGames.SelectPlaceholder")}
        noOptionsMessage={() => t("PostGames.NoMatchingGames")}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  </div>;
}
