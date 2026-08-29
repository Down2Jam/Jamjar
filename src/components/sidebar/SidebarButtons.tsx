import { Button } from "bioloom-ui";

export default function SidebarButtons() {
  return (
    <div className="flex justify-center w-[480px]">
      <div className="flex flex-wrap w-[400px] gap-3 items-center justify-center">
        <Button
          icon="sidiscord"
          href="https://discord.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Discord"
          aria-label="Join Down2Jam on Discord"
        />
        <Button
          icon="sibluesky"
          href="https://bluesky.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Bluesky"
          aria-label="Follow Down2Jam on Bluesky"
        />
        <Button
          icon="siyoutube"
          href="https://youtube.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="YouTube"
          aria-label="Watch Down2Jam on YouTube"
        />
        <Button
          icon="siinstagram"
          href="https://instagram.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Instagram"
          aria-label="Follow Down2Jam on Instagram"
        />
        <Button
          icon="sigithub"
          href="https://github.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="GitHub"
          aria-label="View Down2Jam on GitHub"
        />
        <Button
          icon="siforgejo"
          href="https://forgejo.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Forgejo"
          aria-label="View Down2Jam on Forgejo"
        />
        <Button
          icon="siliberadotchat"
          href="https://web.libera.chat/#down2jam"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Libera.Chat #down2jam"
          aria-label="Join the Down2Jam channel on Libera.Chat"
        />
      </div>
    </div>
  );
}
