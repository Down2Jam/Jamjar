import { ReactNode } from "react";
import { Icon, IconName, Kbd, Tooltip } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { useTranslations } from "@/compat/next-intl";

interface NavbarButtonProps {
  icon?: IconName;
  iconNode?: ReactNode;
  name?: string;
  description?: string;
  hotkey?: string[];
  delay?: number;
  children: ReactNode | ReactNode[];
}

export default function NavbarTooltip({
  icon,
  iconNode,
  name,
  description,
  hotkey,
  delay = 1000,
  children,
}: NavbarButtonProps) {
  const { siteTheme } = useTheme();
  const t = useTranslations();

  return (
    <Tooltip
      delay={delay}
      content={
        <div
          className="flex items-center flex-col"
          style={{
            borderColor: siteTheme.colors["base"],
            color: siteTheme.colors["text"],
          }}
        >
          <div className="flex items-center gap-2 ">
            {icon && <Icon name={icon} size={16} />}
            {iconNode}
            {name && <p>{t(name)}</p>}
            {hotkey && (
              <Kbd
                style={{
                  backgroundColor: siteTheme.colors["mantle"],
                  color: siteTheme.colors["text"],
                }}
              >
                {hotkey?.join(" ")}
              </Kbd>
            )}
          </div>
          {description && (
            <p className="text-xs opacity-50">{t(description)}</p>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
