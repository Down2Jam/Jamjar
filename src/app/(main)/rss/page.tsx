import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Button, Text } from "bioloom-ui";
import { Rss } from "lucide-react";
import PageCard from "@/components/PageCard";
import { usePageMetadata } from "@/hooks/usePageMetadata";

export default function RSSPage() {
  const uiText = useUiTranslations();
  usePageMetadata({
    title: uiText("AppStrings.RSSFeeds"),
    description: uiText("AppStrings.SubscribeToDown2JamUpdatesWithRSS"),
    canonical: "/rss",
    feed: "/news/rss.xml",
  });

  return (
    <PageCard icon={Rss} title={uiText("AppStrings.RSSFeeds2")} description={uiText("AppStrings.FollowDown2JamUpdatesInYourPreferredFeedReader")}>
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-3 sm:px-3 max-[700px]:px-0">
        <div>
          <h2 className="font-semibold">{uiText("AppStrings.Down2JamNews")}</h2>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.AnnouncementsAndSiteChangelogs")} </Text>
        </div>
        <Button href="/news/rss.xml" icon="rss">
           {uiText("AppStrings.OpenFeed")} </Button>
      </div>
    </PageCard>
  );
}
