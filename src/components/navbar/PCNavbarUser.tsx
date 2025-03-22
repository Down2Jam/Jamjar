import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  NavbarItem,
} from "@nextui-org/react";
import { UserType } from "@/types/UserType";
import { Bug, LogOut, Settings, User } from "lucide-react";

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
              href={`/u/${user.slug}`}
              startContent={<User size={16} />}
            >
              Profile
            </DropdownItem>
            <DropdownItem
              key="settings"
              className="text-[#333] dark:text-white"
              href="/settings"
              startContent={<Settings size={16} />}
            >
              Settings
            </DropdownItem>
            <DropdownItem
              showDivider
              key="bug"
              className="text-[#333] dark:text-white"
              href="https://github.com/Down2Jam/Jamjar/issues"
              startContent={<Bug size={16} />}
            >
              Report Bug
            </DropdownItem>
          </DropdownSection>
          <DropdownItem
            key="logout"
            color="danger"
            className="text-danger"
            href="/logout"
            startContent={<LogOut size={16} />}
          >
            Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </NavbarItem>
  );
}
