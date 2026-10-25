import { Children, useState, type CSSProperties, type ReactElement } from "react";
import type { TabProps, TabsProps } from "bioloom-ui";
import MusicTabs from "@/app/(main)/music/MusicTabs";
import { useTheme } from "@/providers/useSiteTheme";
import { useTranslations } from "@/compat/next-intl";

export default function SettingsTabs({ children, defaultIndex = 0 }: TabsProps) {
  const { colors } = useTheme();
  const t = useTranslations();
  const [selected, setSelected] = useState(String(defaultIndex));
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const label = t("Navbar.Settings.Title");

  return <div className="min-w-0 w-full [&_.music-responsive-tab-group]:max-w-full" style={{
    "--music-text": colors.text,
    "--music-muted": colors.textFaded,
    "--music-accent": colors.blue,
  } as CSSProperties}>
    <MusicTabs ariaLabel={label} groups={[{
      label,
      selected,
      onSelect: setSelected,
      choices: tabs.map((tab, index) => ({
        id: String(index), name: String(tab.props.title), icon: tab.props.icon, inline: true,
      })),
    }]} />
    <div role="tabpanel" aria-label={String(tabs[Number(selected)].props.title)}>
      {tabs[Number(selected)]}
    </div>
  </div>;
}
