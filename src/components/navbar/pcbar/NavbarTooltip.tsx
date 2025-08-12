import { ReactNode } from "react";
import { Kbd } from "@heroui/kbd";
import Tooltip from "@/framework/Tooltip";
import { useTheme } from "@/providers/SiteThemeProvider";

interface NavbarButtonProps {
  icon?: ReactNode;
  name?: string;
  description?: string;
  hotkey?: string[];
  children: ReactNode | ReactNode[];
}

export default function NavbarTooltip({
  icon,
  name,
  description,
  hotkey,
  children,
}: NavbarButtonProps) {
  const { siteTheme } = useTheme();

  return (
    <Tooltip
      delay={1000}
      content={
        <div
          className="flex items-center flex-col"
          style={{
            borderColor: siteTheme.colors["base"],
            color: siteTheme.colors["text"],
          }}
        >
          <div className="flex items-center gap-2 ">
            {icon}
            <p>{name}</p>
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
          <p className="text-xs opacity-50">{description}</p>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
