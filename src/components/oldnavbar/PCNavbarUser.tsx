import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  NavbarItem,
} from "@heroui/react";
import { UserType } from "@/types/UserType";
import { Bug, LogOut, Settings, User } from "lucide-react";
import { redirect } from "next/navigation";

interface NavbarUserProps {
  user: UserType;
}

export default function PCNavbarUser({ user }: NavbarUserProps) {
  return (
    <NavbarItem>
      <Dropdown backdrop="opaque">
        <DropdownTrigger>
          <Avatar
            src={user.profilePicture}
            className="cursor-pointer outline-2 outline-[#85bdd2] dark:outline-[#1892b3] bg-[#fff] dark:bg-[#1d232b]"
            classNames={{
              base: "bg-transparent",
            }}
          />
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownSection title={user.name}>
            <DropdownItem
              key="profile"
              className="text-[#333] dark:text-white"
              startContent={<User size={16} />}
              onPress={() => redirect(`/u/${user.slug}`)}
            >
              Profile
            </DropdownItem>
            <DropdownItem
              key="settings"
              className="text-[#333] dark:text-white"
              startContent={<Settings size={16} />}
              onPress={() => redirect("/settings")}
            >
              Settings
            </DropdownItem>
            <DropdownItem
              showDivider
              key="bug"
              className="text-[#333] dark:text-white"
              startContent={<Bug size={16} />}
              onPress={() =>
                redirect("https://github.com/Down2Jam/Jamjar/issues")
              }
            >
              Report Bug
            </DropdownItem>
          </DropdownSection>
          <DropdownItem
            key="logout"
            color="danger"
            className="text-danger"
            startContent={<LogOut size={16} />}
            onPress={() => redirect("/logout")}
          >
            Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </NavbarItem>
  );
}
