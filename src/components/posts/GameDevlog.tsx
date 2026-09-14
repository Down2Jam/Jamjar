import { useEffect, useState } from "react";
import { Button, Spinner } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
import { getGameDevlogPosts } from "@/requests/game";
import { readArray } from "@/requests/helpers";
import MentionedContent from "@/components/mentions/MentionedContent";
import ThemedProse from "@/components/themed-prose";
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
  return <section className="flex min-w-0 flex-col gap-4 border-t pt-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 10%, transparent)` }}>
    <h2 className="text-lg font-bold">{t("PostGames.Devlog")}</h2>
    {posts.map(post => <article key={post.id} className="min-w-0 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 8%, transparent)`, backgroundColor: colors.mantle }}>
      <Link href={`/p/${post.slug}`} className="post-title-link text-base font-semibold">{post.title}</Link>
      <div className="my-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: colors.textFaded }}>
        <Link href={`/u/${post.authorSlug}`}>{post.authorName}</Link>
        <span aria-hidden="true">·</span>
        <ContentStatusMeta createdAt={new Date(post.createdAt)} />
      </div>
      <ThemedProse className="max-h-40 overflow-hidden [&_p:first-child]:mt-0">
        <MentionedContent html={post.content} />
      </ThemedProse>
      <Link href={`/p/${post.slug}`} className="mt-3 inline-block text-xs" style={{ color: colors.blue }}>{t("PostGames.ReadPost")}</Link>
    </article>)}
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
