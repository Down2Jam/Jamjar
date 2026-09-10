import { Button } from "bioloom-ui";

export default function SidebarButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[400px] flex-wrap items-center justify-center gap-2">
        <Button
          size="lg"
          icon="sidiscord"
          href="https://discord.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Discord"
          aria-label="Join Down2Jam on Discord"
        />
        <Button
          size="lg"
          icon="sibluesky"
          href="https://bluesky.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Bluesky"
          aria-label="Follow Down2Jam on Bluesky"
        />
        <Button
          size="lg"
          icon="siyoutube"
          href="https://youtube.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="YouTube"
          aria-label="Watch Down2Jam on YouTube"
        />
        <Button
          size="lg"
          icon="siinstagram"
          href="https://instagram.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Instagram"
          aria-label="Follow Down2Jam on Instagram"
        />
        <Button
          size="lg"
          icon="sigithub"
          href="https://github.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="GitHub"
          aria-label="View Down2Jam on GitHub"
        />
        <Button
          size="lg"
          icon="siforgejo"
          href="https://forgejo.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip="Forgejo"
          aria-label="View Down2Jam on Forgejo"
        />
        <Button
          size="lg"
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
