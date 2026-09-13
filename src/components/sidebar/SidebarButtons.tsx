import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Button } from "bioloom-ui";

export default function SidebarButtons({ className = "" }: { className?: string }) {
  const uiText = useUiTranslations();
  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div className="flex w-full max-w-[400px] flex-wrap items-center justify-center gap-2">
        <Button
          size="lg"
          icon="sidiscord"
          href="https://discord.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.Discord")}
          aria-label={uiText("AppStrings.JoinDown2JamOnDiscord")}
        />
        <Button
          size="lg"
          icon="sibluesky"
          href="https://bluesky.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.Bluesky")}
          aria-label={uiText("AppStrings.FollowDown2JamOnBluesky")}
        />
        <Button
          size="lg"
          icon="siyoutube"
          href="https://youtube.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.YouTube")}
          aria-label={uiText("AppStrings.WatchDown2JamOnYouTube")}
        />
        <Button
          size="lg"
          icon="siinstagram"
          href="https://instagram.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.Instagram")}
          aria-label={uiText("AppStrings.FollowDown2JamOnInstagram")}
        />
        <Button
          size="lg"
          icon="sigithub"
          href="https://github.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.GitHub")}
          aria-label={uiText("AppStrings.ViewDown2JamOnGitHub")}
        />
        <Button
          size="lg"
          icon="siforgejo"
          href="https://forgejo.d2jam.com"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.Forgejo")}
          aria-label={uiText("AppStrings.ViewDown2JamOnForgejo")}
        />
        <Button
          size="lg"
          icon="siliberadotchat"
          href="https://web.libera.chat/#down2jam"
          target="_blank"
          rel="noopener noreferrer"
          tooltip={uiText("AppStrings.LiberaChatDown2jam")}
          aria-label={uiText("AppStrings.JoinTheDown2JamChannelOnLiberaChat")}
        />
      </div>
    </div>
  );
}
