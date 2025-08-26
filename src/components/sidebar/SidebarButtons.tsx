import { Button } from "@/framework/Button";

export default function SidebarButtons() {
  return (
    <div className="flex justify-center w-[480px]">
      <div className="flex flex-wrap w-[400px] gap-3 items-center justify-center">
        <Button
          icon="sidiscord"
          href="https://discord.d2jam.com"
          target="_blank"
          // tooltip="Discord"
        />
        <Button
          icon="sibluesky"
          href="https://bluesky.d2jam.com"
          target="_blank"
          // tooltip="Bluesky"
        />
        <Button
          icon="siyoutube"
          href="https://youtube.d2jam.com"
          target="_blank"
          // tooltip="YouTube"
        />
        <Button
          icon="siinstagram"
          href="https://instagram.d2jam.com"
          target="_blank"
          // tooltip="Instagram"
        />
        <Button
          icon="sigithub"
          href="https://github.d2jam.com"
          target="_blank"
          // tooltip="GitHub"
        />
        <Button
          icon="siforgejo"
          href="https://forgejo.d2jam.com"
          target="_blank"
        />
      </div>
    </div>
  );
}
