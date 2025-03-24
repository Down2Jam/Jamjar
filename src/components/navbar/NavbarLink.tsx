import { NavbarItem } from "@heroui/react";
import Link from "../link-components/Link";

interface NavbarLinkProps {
  name: string;
  href: string;
}

export default function NavbarLink({ name, href }: NavbarLinkProps) {
  return (
    <NavbarItem>
      <Link name={name} href={href} />
    </NavbarItem>
  );
}
