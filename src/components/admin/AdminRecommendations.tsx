"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/compat/next-intl";
import { Button, Card, Spinner } from "bioloom-ui";
import { GameCard } from "@/components/gamecard";
import { useCurrentJam, useJams, useSearchUsers, useSelf } from "@/hooks/queries";
import { getAdminRecommendationPreview } from "@/requests/admin";
import { readItem } from "@/requests/helpers";
import type { GameType, ListingPageVersion } from "@/types/GameType";

type PreviewItem = {
  game: GameType;
  rank: number;
  otherRank: number | null;
  baseScore: number;
  adjustment: number;
  reasons: Array<{ family: string; label: string; contribution: number }>;
};

type PreviewData = {
  viewer: { id: number; name: string; slug: string };
  baseline: PreviewItem[];
  personalized: PreviewItem[];
  pageInfo: { totalCount: number; hasMore: boolean; nextOffset: number | null };
};

function PreviewColumn({
  title,
  items,
  personalized,
  t,
}: {
  title: string;
  items: PreviewItem[];
  personalized: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="min-w-0 space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.map((item) => {
        const movement = item.otherRank === null ? 0 : item.otherRank - item.rank;
        return (
          <div key={`${item.game.id}:${item.game.pageVersion ?? "JAM"}`} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">#{item.rank}</span>
              <span className="opacity-75">
                {personalized
                  ? t("AdminRecommendations.VisitorRank", { rank: item.otherRank ?? "—" })
                  : t("AdminRecommendations.PlayerRank", { rank: item.otherRank ?? "—" })}
                {personalized && movement !== 0 ? ` · ${movement > 0 ? "↑" : "↓"}${Math.abs(movement)}` : ""}
              </span>
            </div>
            <GameCard game={item.game} />
            {personalized && (
              <div className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                <p className="font-medium">
                  {t("AdminRecommendations.Adjustment", {
                    value: `${item.adjustment >= 0 ? "+" : ""}${item.adjustment.toFixed(2)}`,
                  })}
                </p>
                {item.reasons.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 opacity-80">
                    {item.reasons.map((reason) => (
                      <li key={`${reason.family}:${reason.label}`}>
                        {reason.contribution > 0 ? "+" : "−"}{reason.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 opacity-70">{t("AdminRecommendations.NoMatch")}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default function AdminRecommendations() {
  const t = useTranslations();
  const { data: self } = useSelf();
  const { data: jams = [] } = useJams();
  const { data: currentJam, isLoading: currentJamLoading } = useCurrentJam();
  const [userId, setUserId] = useState<number | null>(null);
  const [jamId, setJamId] = useState<number | undefined>();
  const [pageVersion, setPageVersion] = useState<ListingPageVersion>("JAM");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const defaultJamSet = useRef(false);
  const { data: searchResults = [] } = useSearchUsers(search.trim(), search.trim().length > 1);

  useEffect(() => {
    if (self && userId === null) setUserId(self.id);
  }, [self, userId]);

  useEffect(() => {
    if (defaultJamSet.current || currentJamLoading) return;
    defaultJamSet.current = true;
    if (currentJam?.jam?.id) setJamId(currentJam.jam.id);
  }, [currentJam, currentJamLoading]);

  useEffect(() => {
    if (userId === null || currentJamLoading) return;
    const controller = new AbortController();
    if (offset === 0) setData(null);
    setLoading(true);
    setError(false);

    void getAdminRecommendationPreview({
      userId,
      jamId,
      pageVersion,
      offset,
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Preview request failed");
      const next = await readItem<PreviewData>(response);
      if (!next || controller.signal.aborted) return;
      setData((previous) => offset === 0 || !previous ? next : {
        ...next,
        baseline: [...previous.baseline, ...next.baseline],
        personalized: [...previous.personalized, ...next.personalized],
      });
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [userId, jamId, pageVersion, offset, currentJamLoading]);

  const changeUser = (id: number) => {
    setUserId(id);
    setOffset(0);
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-4 pb-10">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t("AdminRecommendations.Title")}</h1>
            <p className="mt-1 text-sm opacity-75">{t("AdminRecommendations.Description")}</p>
          </div>
          <Button href="/admin" variant="ghost" icon="arrowleft">
            {t("AdminRecommendations.Back")}
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("AdminRecommendations.Jam")}</span>
            <select className="rounded-lg border border-white/20 bg-transparent p-2" value={jamId ?? "all"}
              onChange={(event) => { setJamId(event.target.value === "all" ? undefined : Number(event.target.value)); setOffset(0); }}>
              <option value="all">{t("AdminRecommendations.AllJams")}</option>
              {jams.map((jam) => <option key={jam.id} value={jam.id}>{jam.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("AdminRecommendations.Version")}</span>
            <select className="rounded-lg border border-white/20 bg-transparent p-2" value={pageVersion}
              onChange={(event) => { setPageVersion(event.target.value as ListingPageVersion); setOffset(0); }}>
              <option value="ALL">{t("AdminRecommendations.LatestVersion")}</option>
              <option value="JAM">{t("AdminRecommendations.JamVersion")}</option>
              <option value="POST_JAM">{t("AdminRecommendations.PostJamVersion")}</option>
            </select>
          </label>
          <div className="relative flex flex-col gap-1 text-sm">
            <label htmlFor="recommendation-user-search">{t("AdminRecommendations.Player")}</label>
            <input id="recommendation-user-search" className="rounded-lg border border-white/20 bg-transparent p-2"
              value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={data?.viewer.name ?? self?.name ?? t("AdminRecommendations.SearchPlayer")} />
            {search.trim().length > 1 && searchResults.length > 0 && (
              <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-white/20 bg-black p-1 shadow-lg">
                {searchResults.map((user) => (
                  <button key={user.id} type="button" className="block w-full rounded px-3 py-2 text-left hover:bg-white/10"
                    onClick={() => changeUser(user.id)}>{user.name} (@{user.slug})</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {error && <Card><p role="alert">{t("AdminRecommendations.LoadError")}</p></Card>}
      {loading && !data && <div className="flex justify-center p-8"><Spinner /></div>}
      {data && (
        <>
          <p className="text-sm opacity-75">
            {t("AdminRecommendations.GameCount", { count: data.pageInfo.totalCount })}
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            <PreviewColumn title={t("AdminRecommendations.VisitorOrder")} items={data.baseline} personalized={false} t={t} />
            <PreviewColumn title={t("AdminRecommendations.PlayerOrder", { name: data.viewer.name })}
              items={data.personalized} personalized t={t} />
          </div>
          {data.pageInfo.hasMore && (
            <div className="flex justify-center">
              <Button disabled={loading || data.pageInfo.nextOffset === null}
                onClick={() => { if (data.pageInfo.nextOffset !== null) setOffset(data.pageInfo.nextOffset); }}>
                {loading ? t("AdminRecommendations.Loading") : t("AdminRecommendations.LoadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
