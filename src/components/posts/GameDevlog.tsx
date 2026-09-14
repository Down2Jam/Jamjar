import { useEffect, useState } from "react";
import { Button, Spinner } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
import { getGameDevlogPosts } from "@/requests/game";
import { readArray } from "@/requests/helpers";
import ContentStatusMeta from "./ContentStatusMeta";

type DevlogPost = { id: number; slug: string; title: string; content: string; createdAt: string; authorSlug: string; authorName: string };

export default function GameDevlog({ gameSlug }: { gameSlug: string }) {
  const t = useTranslations();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<DevlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    getGameDevlogPosts(gameSlug, undefined, 5).then(async response => {
      if (!response.ok) throw new Error("Could not load posts");
      const items = await readArray<DevlogPost>(response);
      if (active) { setPosts(items); setHasMore(items.length === 5); }
    }).catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [gameSlug, attempt]);
  if (!loading && !failed && !posts.length) return null;
  return <section aria-label={t("PostGames.Devlog")} className="flex min-w-0 flex-col gap-2">
    <h2 className="text-lg font-bold">{t("PostGames.Devlog")}</h2>
    {posts.map(post => <div key={post.id} className="flex min-w-0 items-center gap-2">
      <Link href={`/p/${post.slug}`} title={post.title} className="min-w-0 truncate text-sm hover:underline" style={{ color: colors.blue }}>{post.title}</Link>
      <div className="shrink-0 whitespace-nowrap">
        <ContentStatusMeta createdAt={post.createdAt} />
      </div>
    </div>)}
    {loading && <Spinner />}
    {failed && <div className="flex items-center gap-2 text-sm" role="status">
      <span>{t("PostGames.LoadError")}</span>
      <Button variant="ghost" onClick={() => setAttempt(value => value + 1)}>{t("PostGames.Retry")}</Button>
    </div>}
    {hasMore && !failed && <Button variant="ghost" loading={loading} onClick={async () => {
      setLoading(true);
      try {
        const response = await getGameDevlogPosts(gameSlug, undefined, 5, posts.at(-1)?.createdAt, posts.at(-1)?.id);
        if (!response.ok) throw new Error("Could not load posts");
        const items = await readArray<DevlogPost>(response);
        setPosts(previous => [...previous, ...items.filter(item => !previous.some(post => post.id === item.id))]);
        setHasMore(items.length === 5);
      } catch { setFailed(true); } finally { setLoading(false); }
    }}>{t("PostGames.LoadMore")}</Button>}
  </section>;
}
