import { NavbarItem } from "@heroui/react";
import { ReactNode } from "react";
import IconLink from "../link-components/IconLink";

interface NavbarIconLinkProps {
  icon: ReactNode;
  href: string;
}

export default function NavbarIconLink({ icon, href }: NavbarIconLinkProps) {
  return (
    <NavbarItem>
      <IconLink icon={icon} href={href} />
    </NavbarItem>
  );
}
