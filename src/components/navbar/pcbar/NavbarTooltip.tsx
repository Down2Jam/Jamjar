import { ReactNode } from "react";
import { Tooltip } from "@heroui/tooltip";
import { Kbd } from "@heroui/kbd";

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
  return (
    <Tooltip
      delay={1000}
      className="bg-white dark:bg-black border-2 border-gray-100 dark:border-gray-900"
      content={
        <div className="flex items-center flex-col">
          <div className="flex items-center gap-2 text-black dark:text-white">
            {icon}
            <p>{name}</p>
            {hotkey && (
              <Kbd className="bg-gray-100 dark:bg-gray-900">
                {hotkey?.join(" ")}
              </Kbd>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}
