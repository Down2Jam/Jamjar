import { Badge, Button, IconName, NavbarItem } from "bioloom-ui";
import { ReactNode } from "react";
import Hotkey from "../../hotkey";
import NavbarTooltip from "./NavbarTooltip";
import { useTheme } from "@/providers/useSiteTheme";
import { useTranslations } from "@/compat/next-intl";

interface NavbarButtonProps {
  icon?: IconName;
  iconNode?: ReactNode;
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top";
  name: string;
  isIconOnly?: boolean;
  description: string;
  hotkey?: string[];
  color?: "blue" | "yellow" | "green" | "lime" | "orange" | "red";
  onPress?: () => void;
  className?: string;
  indicator?: boolean;
}

export default function NavbarButton({
  icon,
  iconNode,
  href,
  target,
  name,
  isIconOnly,
  description,
  hotkey,
  onPress,
  color = "blue",
  className,
  indicator = false,
}: NavbarButtonProps) {
  const { siteTheme } = useTheme();
  const t = useTranslations();

  const label = isIconOnly ? undefined : t(name);

  return (
    <NavbarItem
      className={
        isIconOnly ? "flex h-8 w-8 items-center justify-center p-0" : ""
      }
    >
      <NavbarTooltip
        icon={icon}
        iconNode={iconNode}
        name={name}
        description={description}
        hotkey={hotkey}
        delay={isIconOnly ? 300 : undefined}
      >
        <>
          <Badge
            content={indicator ? "" : undefined}
            size={8}
            color="red"
            offset={5}
          >
            <Button
              className={className}
              style={{
                color: siteTheme.colors[color],
              }}
              href={href}
              target={target}
              icon={iconNode ? undefined : icon}
              leftSlot={iconNode}
              size={isIconOnly ? "md" : "sm"}
              variant="ghost"
              onClick={onPress}
            >
              {label}
            </Button>
          </Badge>
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
