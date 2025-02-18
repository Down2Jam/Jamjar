import { NavbarItem } from "@nextui-org/react";
import { ReactNode } from "react";
import ButtonAction from "../link-components/ButtonAction";

interface NavbarButtonActionProps {
  icon?: ReactNode;
  onPress: () => void;
  name: string;
  important?: boolean;
}

export default function NavbarButtonAction({
  icon,
  onPress,
  name,
  important = false,
}: NavbarButtonActionProps) {
  return (
    <NavbarItem>
      <ButtonAction
        icon={icon}
        onPress={onPress}
        name={name}
        important={important}
      />
    </NavbarItem>
  );
}
