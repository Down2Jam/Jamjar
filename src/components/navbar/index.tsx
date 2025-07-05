import { Navbar as NavbarBase, NavbarContent } from "@heroui/navbar";
import { Button } from "@heroui/button";
import {
  ChevronDown,
  Dice3,
  Gamepad,
  Heart,
  Info,
  Languages,
  LogIn,
  MessageCircle,
  Rss,
  Trophy,
} from "lucide-react";
import {
  SiBluesky,
  SiDiscord,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import ThemeToggle from "../theme-toggle";
import SearchBar from "./SearchBar";
import Brand from "./Brand";
import { Divider } from "@heroui/divider";
import NavbarButton from "./NavbarButton";

export default function Navbar() {
  return (
    <NavbarBase
      maxWidth="2xl"
      className="bg-white dark:bg-black p-1 duration-500 ease-in-out transition-color shadow-2xl"
      style={{
        backgroundImage:
          "url(/images/D2J_Icon_watermark.png), url(/images/D2J_Icon_watermark.png)",
        backgroundPositionY: "center, center",
        backgroundPositionX: "45px, right 45px",
        backgroundSize: "210px",
        backgroundRepeat: "no-repeat",
      }}
      isBordered
      height={40}
    >
      {/* Navbar Left */}
      <NavbarContent justify="start">
        <Brand />
        <SearchBar />
        <Divider orientation="vertical" />
        <div className="flex items-center">
          <NavbarButton
            icon={<Heart size={16} />}
            href="/donate"
            name="Donate"
            description="View the donation and support page"
            hotkey={["G", "D"]}
            isIconOnly
            color="lime"
          />
          <NavbarButton
            icon={<Dice3 size={16} />}
            href="/lucky"
            name="I'm Feeling Lucky"
            description="Get sent to the page for a random game on the website"
            hotkey={["G", "L"]}
            isIconOnly
            color="yellow"
          />
          <NavbarButton
            icon={<Rss size={16} />}
            href="/rss"
            name="RSS"
            description="View available rss feeds"
            hotkey={["G", "S"]}
            isIconOnly
            color="orange"
          />
        </div>
      </NavbarContent>

      {/* Navbar Right */}
      <NavbarContent justify="end" className="gap-2">
        <NavbarButton
          icon={<Info size={16} />}
          href="/about"
          name="About"
          description="Information about the game jam"
          hotkey={["G", "A"]}
          color="red"
        />
        <NavbarButton
          icon={<Gamepad size={16} />}
          href="/games"
          name="Games"
          description="All submitted games to the website"
          hotkey={["G", "E"]}
          color="orange"
        />
        <NavbarButton
          icon={<Trophy size={16} />}
          href="/results"
          name="Results"
          description="The results of the last D2Jam"
          hotkey={["G", "R"]}
          color="yellow"
        />
        <NavbarButton
          icon={<MessageCircle size={16} />}
          href="/home"
          name="Forum"
          description="A forum for members of the community to chat with each other in"
          hotkey={["G", "H"]}
          color="lime"
        />
        <NavbarButton
          icon={<LogIn size={16} />}
          href="/signup"
          name="Join"
          description="Join the website by making or logging into an account"
          hotkey={["G", "J"]}
          color="green"
        />
        <Divider orientation="vertical" />
        <Button
          size="sm"
          startContent={<Languages size={16} />}
          endContent={<ChevronDown size={16} />}
          variant="light"
        />
        <Divider orientation="vertical" />
        <ThemeToggle />
        <Divider orientation="vertical" />
        <Button
          size="sm"
          startContent={<SiDiscord size={16} />}
          isIconOnly
          variant="light"
        />
        <Button
          size="sm"
          startContent={<SiBluesky size={16} />}
          isIconOnly
          variant="light"
        />
        <Button
          size="sm"
          startContent={<SiYoutube size={16} />}
          isIconOnly
          variant="light"
        />
      </NavbarContent>
    </NavbarBase>
  );
}
