import NewsFeed from "@/components/news/NewsFeed";
import NewsSurface from "@/components/news/NewsSurface";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useTheme } from "@/providers/useSiteTheme";
import { Button } from "bioloom-ui";

export default function NewsPage() {
  const { colors, siteTheme } = useTheme();
  const backgroundTextColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];

  usePageMetadata({
    title: "News",
    description: "Official Down2Jam news, announcements, and site updates.",
    canonical: "/news",
    feed: "/news/rss.xml",
  });

  return (
    <NewsSurface card={false}>
      <header
        className="pb-8 pt-2 sm:pb-10"
        style={{ color: backgroundTextColor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-semibold leading-tight sm:text-6xl"
              style={{ color: backgroundTextColor }}
            >
              News
            </h1>
          </div>
          <Button
            href="/news/rss.xml"
            icon="rss"
            variant="ghost"
            size="sm"
            style={{ color: backgroundTextColor }}
          >
            RSS feed
          </Button>
        </div>
        <p
          className="mt-3 max-w-2xl text-base leading-relaxed"
          style={{ color: backgroundTextColor, opacity: 0.82 }}
        >
          Announcements, improvements, and changes from across Down2Jam.
        </p>
      </header>
      <NewsFeed />
    </NewsSurface>
  );
}
