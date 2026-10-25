import { Children, useState, type ReactElement, type CSSProperties } from "react";
import type { TabProps, TabsProps } from "bioloom-ui";
import MusicTabs from "@/app/(main)/music/MusicTabs";
import { useTheme } from "@/providers/useSiteTheme";
import { useTranslations } from "@/compat/next-intl";
import type { PageVersion } from "@/types/GameType";

export default function GameEditorTabs({ children, className, style, pageVersion = "JAM", onPageVersionChange }: TabsProps & {
  pageVersion?: PageVersion;
  onPageVersionChange?: (version: PageVersion) => void;
}) {
  const t = useTranslations();
  const { colors } = useTheme();
  const [selected, setSelected] = useState("0");
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];

  return <div className={className} style={{ ...style, "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue } as CSSProperties}>
    <MusicTabs ariaLabel="Game settings" groups={[{
      label: "More game settings",
      selected,
      onSelect: setSelected,
      choices: tabs.map((tab, index) => ({ id: String(index), name: String(tab.props.title), icon: tab.props.icon, inline: true })),
    }, ...(onPageVersionChange ? [{
      label: "Page version",
      selected: pageVersion,
      onSelect: (id: string) => onPageVersionChange(id as PageVersion),
      choices: [
        { id: "JAM", name: t("AppStrings.JamPage"), inline: true },
        { id: "POST_JAM", name: t("AppStrings.PostJamPage"), inline: true },
      ],
    }] : [])]} />
    <div role="tabpanel" aria-label={String(tabs[Number(selected)].props.title)}>
      {tabs[Number(selected)]}
    </div>
  </div>;
}
