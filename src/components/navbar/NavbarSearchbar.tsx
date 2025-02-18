import { Input, NavbarItem } from "@nextui-org/react";
import { Search } from "lucide-react";

export default function NavbarSearchbar() {
  return (
    <NavbarItem>
      <Input
        placeholder="Search"
        classNames={{
          inputWrapper:
            "!duration-500 ease-in-out transition-all border-[#d9d9da] dark:border-[#8e8e8f] dark:bg-[#222222] bg-[#fff] border-2",
        }}
        endContent={<Search />}
      />
    </NavbarItem>
  );
}
