import { useEffect, useId, useState } from "react";
import { useTranslations } from "@/compat/next-intl";
import { getLinkablePostGames } from "@/requests/post";
import { readArray } from "@/requests/helpers";
import type { LinkedPostGame } from "@/types/PostType";
import { useTheme } from "@/providers/useSiteTheme";
import Select, { type StylesConfig } from "react-select";

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
  const styles: StylesConfig<LinkedPostGame, true> = {
    container: base => ({ ...base, width: "100%", maxWidth: "28rem", fontSize: 14, lineHeight: "20px" }),
    control: (base, { isFocused }) => ({
      ...base,
      backgroundColor: colors.base,
      borderColor: isFocused ? colors.blue : `color-mix(in srgb, ${colors.text} 10%, ${colors.mantle})`,
      boxShadow: isFocused ? `0 0 0 1px ${colors.blue}` : "none",
      borderRadius: 8,
      minWidth: 0,
      ":hover": { borderColor: colors.blue },
    }),
    input: base => ({ ...base, color: colors.text }),
    placeholder: base => ({ ...base, color: colors.textFaded }),
    menu: base => ({ ...base, backgroundColor: colors.mantle, color: colors.text }),
    menuPortal: base => ({ ...base, zIndex: 100, fontSize: 14, lineHeight: "20px" }),
    option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? colors.base : "transparent", color: colors.text }),
    multiValue: base => ({ ...base, backgroundColor: colors.surface0 }),
    multiValueLabel: base => ({ ...base, color: colors.text }),
    multiValueRemove: base => ({ ...base, color: colors.textFaded, ":hover": { backgroundColor: colors.base, color: colors.text } }),
  };
  if (!games.length) return null;
  return <div className="game-editor-row">
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium">{t("PostGames.SelectTitle")}</label>
        <p id={`${id}-description`} className="text-xs" style={{ color: colors.textFaded }}>{t("PostGames.SelectDescription")}</p>
      </div>
      <Select<LinkedPostGame, true>
        inputId={id}
        instanceId={id}
        aria-describedby={`${id}-description`}
        isMulti
        isClearable
        options={games}
        value={value}
        getOptionValue={game => String(game.gameId)}
        getOptionLabel={game => game.name}
        onChange={selected => onChange(selected.map(game => ({ ...game, relationType: game.relationType ?? "devlog" })))}
        styles={styles}
        placeholder={t("PostGames.SelectPlaceholder")}
        noOptionsMessage={() => t("PostGames.NoMatchingGames")}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  </div>;
}
