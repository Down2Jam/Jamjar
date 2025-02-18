import { NavbarItem } from "@nextui-org/react";
import { ReactNode } from "react";
import ButtonLink from "../link-components/ButtonLink";

interface NavbarButtonLinkProps {
  icon?: ReactNode;
  href: string;
  name: string;
  tooltip?: string;
  isIconOnly?: boolean;
  size?: "sm" | "md";
  iconPosition?: "start" | "end";
  important?: boolean;
}

export default function NavbarButtonLink({
  icon,
  href,
  name,
  tooltip,
  isIconOnly,
  size,
  iconPosition = "end",
  important = false,
}: NavbarButtonLinkProps) {
  return (
    <NavbarItem>
      <ButtonLink
        icon={icon}
        href={href}
        isIconOnly={isIconOnly}
        tooltip={tooltip}
        size={size}
        name={name}
        iconPosition={iconPosition}
        important={important}
      />
    </NavbarItem>
  );
}
