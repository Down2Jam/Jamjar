import {
    Dropdown,
    DropdownTrigger,
    Avatar,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
    NavbarItem,
    NavbarMenuItem,
} from "@nextui-org/react";
import { Bell, CalendarPlus, Gamepad2, LogInIcon, Shield, SquarePen } from "lucide-react";
import ButtonLink from "../link-components/ButtonLink";
import { FC } from "react";
import IconLink from "../link-components/IconLink";
import ButtonAction from "../link-components/ButtonAction";
import { UserType } from "@/types/UserType";
import { GameType } from "@/types/GameType";

interface userMenuProps {
    user: UserType | undefined;
    isInJam: boolean | undefined;
    hasGame: GameType | null | undefined;
    onJamPress: () => void;
}

export const UserMenu:FC<userMenuProps> = ({user, isInJam, hasGame, onJamPress}) => {
    return (
        <>
            {user ? (
                <>
                {isInJam ? (
                    <NavbarMenuItem className="hidden md:inline-block">
                        <ButtonLink 
                            icon={<Gamepad2 />} 
                            href={hasGame ? "/games/" + hasGame.slug : "/create-game"} 
                            name={hasGame ? "My Game" : "Create Game"} 
                        />
                    </NavbarMenuItem>
                ):(
                    <NavbarMenuItem className="hidden md:inline-block">
                        <ButtonAction 
                            icon={<CalendarPlus />}
                            onPress={onJamPress}
                            name="Join jam"  />
                    </NavbarMenuItem>
                )}
                <NavbarItem className="hidden md:inline-block">
                    <ButtonLink icon={<SquarePen />} href="/create-post" name="Create Post" />
                </NavbarItem>
                {user.mod && (
                    <NavbarItem>
                        <IconLink icon={<Shield />} href="/reports"  />
                    </NavbarItem>
                )}
                <NavbarItem>
                    <IconLink icon={<Bell />} href="/inbox"  />
                </NavbarItem>
                <NavbarItem>
                    <Dropdown backdrop="opaque">
                    <DropdownTrigger>
                        <Avatar
                        src={user.profilePicture}
                        className="cursor-pointer"
                        classNames={{
                            base: "bg-transparent",
                        }}
                        />
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownSection className="md:hidden" showDivider title="">
                            {isInJam ? (
                                <DropdownItem
                                    key="joinjam"
                                    className="text-[#333] dark:text-white"
                                    href={hasGame ? "/games/" + hasGame.slug : "/create-game"} 
                                    onPress={onJamPress}
                                >
                                    {hasGame ? "My Game" : "Create Game"}
                            </DropdownItem>
                            ):(
                                <DropdownItem
                                    key="joinjam"
                                    className="text-[#333] dark:text-white"
                                    href={`/u/${user.slug}`}
                                    onPress={onJamPress}
                                >
                                    Join Jam
                            </DropdownItem>
                            )}
                            
                            <DropdownItem
                                key="create-post"
                                className="text-[#333] dark:text-white"
                                href="/create-post"
                                
                            >
                                Create Post
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={user.name}>
                        <DropdownItem
                            key="profile"
                            className="text-[#333] dark:text-white"
                            href={`/u/${user.slug}`}
                        >
                            Profile
                        </DropdownItem>
                        <DropdownItem
                            showDivider
                            key="settings"
                            className="text-[#333] dark:text-white"
                            href="/settings"
                        >
                            Settings
                        </DropdownItem>
                        </DropdownSection>
                        <DropdownItem
                        key="logout"
                        color="danger"
                        className="text-danger"
                        href="/logout"
                        >
                        Logout
                        </DropdownItem>
                    </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </>
            ) : (
            <NavbarMenuItem>
                <ButtonLink icon={<LogInIcon />} href="/login" name="Sign In" />
            </NavbarMenuItem>
            )}
        </>
    )
}