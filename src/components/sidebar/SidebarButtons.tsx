import ButtonLink from "../link-components/ButtonLink";
import {
  SiBluesky,
  SiDiscord,
  SiForgejo,
  SiGithub,
  SiInstagram,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

export default function SidebarButtons() {
  return (
    <div className="flex justify-center w-[480px]">
      <div className="flex flex-wrap w-[400px] gap-3 items-center justify-center">
        <ButtonLink
          icon={<SiDiscord size={16} />}
          href="https://discord.d2jam.com"
          name=""
          tooltip="Discord"
          isIconOnly
          size="sm"
        />
        <ButtonLink
          icon={<SiBluesky size={16} />}
          href="https://bluesky.d2jam.com"
          name=""
          tooltip="Bluesky"
          isIconOnly
          size="sm"
        />
        <ButtonLink
          icon={<SiYoutube size={16} />}
          href="https://youtube.d2jam.com"
          name=""
          tooltip="YouTube"
          isIconOnly
          size="sm"
        />
        <ButtonLink
          icon={<SiInstagram size={16} />}
          href="https://instagram.d2jam.com"
          name=""
          tooltip="Instagram"
          isIconOnly
          size="sm"
        />
        <ButtonLink
          icon={<SiGithub size={16} />}
          href="https://github.d2jam.com"
          name=""
          tooltip="GitHub"
          isIconOnly
          size="sm"
        />
        <ButtonLink
          icon={<SiForgejo size={16} />}
          href="https://forgejo.d2jam.com"
          name=""
          tooltip="Forgejo"
          isIconOnly
          size="sm"
        />
      </div>
    </div>
  );
}
