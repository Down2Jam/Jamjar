"use client";

import { NavbarBrand } from "@heroui/navbar";
import NavbarTooltip from "./NavbarTooltip";
import Hotkey from "../../hotkey";
import Logo from "@/components/logo";
import Link from "next/link";
import Text from "@/framework/Text";

export default function Brand({ userLoggedIn }: { userLoggedIn: boolean }) {
  return (
    <NavbarBrand className="flex-grow-0 mr-2">
      <NavbarTooltip
        name="Navbar.Home.Title"
        description="Navbar.Home.Description"
        hotkey={userLoggedIn ? ["G", "H"] : ["G", "S"]}
      >
        <Link
          href={userLoggedIn ? "/home" : "/"}
          className={`duration-500 ease-in-out transition-all transform flex items-center gap-2 text-white`}
        >
          <Logo width={40} />
          <Text gradient={{ from: "blue", to: "pink" }} size="xl">
            Navbar.Brand.Name
          </Text>
          <Hotkey
            href={userLoggedIn ? "/home" : "/"}
            hotkey={userLoggedIn ? ["G", "H"] : ["G", "S"]}
            title="Navbar.Home.Title"
            description="Navbar.Home.Description"
          />
        </Link>
      </NavbarTooltip>
    </NavbarBrand>
  );
}
