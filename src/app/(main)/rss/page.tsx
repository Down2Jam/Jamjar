import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Button, Card, Text } from "bioloom-ui";
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
    <Card className="mx-auto max-w-3xl" padding={2}>
      <h1 className="text-3xl font-semibold">{uiText("AppStrings.RSSFeeds2")}</h1>
      <Text className="mt-2" color="textFaded">
         {uiText("AppStrings.FollowDown2JamUpdatesInYourPreferredFeedReader")} </Text>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">{uiText("AppStrings.Down2JamNews")}</h2>
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.AnnouncementsAndSiteChangelogs")} </Text>
        </div>
        <Button href="/news/rss.xml" icon="rss">
           {uiText("AppStrings.OpenFeed")} </Button>
      </div>
    </Card>
  );
}
