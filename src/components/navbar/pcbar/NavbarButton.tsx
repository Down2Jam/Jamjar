import { Button, IconName, NavbarItem } from "bioloom-ui";
import Hotkey from "../../hotkey";
import NavbarTooltip from "./NavbarTooltip";
import { useTheme } from "@/providers/SiteThemeProvider";
import { useTranslations } from "next-intl";

interface NavbarButtonProps {
  icon?: IconName;
  href?: string;
  name: string;
  isIconOnly?: boolean;
  description: string;
  hotkey?: string[];
  color?: "blue" | "yellow" | "green" | "lime" | "orange" | "red";
  onPress?: () => void;
  className?: string;
}

export default function NavbarButton({
  icon,
  href,
  name,
  isIconOnly,
  description,
  hotkey,
  onPress,
  color = "blue",
  className,
}: NavbarButtonProps) {
  const { siteTheme } = useTheme();
  const t = useTranslations();

  const label = isIconOnly ? undefined : t(name);

  return (
    <NavbarItem className={isIconOnly ? "p-1" : ""}>
      <NavbarTooltip
        icon={icon}
        name={name}
        description={description}
        hotkey={hotkey}
      >
        <>
          <Button
            className={className}
            style={{
              color: siteTheme.colors[color],
            }}
            href={href}
            icon={icon}
            size="sm"
            variant="ghost"
            onClick={onPress}
          >
            {label}
          </Button>
          {hotkey && (
            <Hotkey
              href={href}
              hotkey={hotkey}
              onPress={onPress}
              title={name}
              description={description}
            />
          )}
        </>
      </NavbarTooltip>
    </NavbarItem>
  );
}
