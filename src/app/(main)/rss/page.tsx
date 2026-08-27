import { Button, Card, Text } from "bioloom-ui";
import { usePageMetadata } from "@/hooks/usePageMetadata";

export default function RSSPage() {
  usePageMetadata({
    title: "RSS Feeds",
    description: "Subscribe to Down2Jam updates with RSS.",
    canonical: "/rss",
    feed: "/news/rss.xml",
  });

  return (
    <Card className="mx-auto max-w-3xl" padding={2}>
      <h1 className="text-3xl font-semibold">RSS feeds</h1>
      <Text className="mt-2" color="textFaded">
        Follow Down2Jam updates in your preferred feed reader.
      </Text>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Down2Jam News</h2>
          <Text size="sm" color="textFaded">
            Announcements and site changelogs.
          </Text>
        </div>
        <Button href="/news/rss.xml" icon="rss">
          Open feed
        </Button>
      </div>
    </Card>
  );
}
