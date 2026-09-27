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
  scoreParts: {
    ratingsGiven: number;
    commentLikes: number;
    achievements: number;
    leaderboardScores: number;
    ratingsReceived: number;
    communityRecommendations: number;
  };
};

type PreviewData = {
  viewer: { id: number; name: string; slug: string };
  baseline: PreviewItem[];
  personalized: PreviewItem[];
  pageInfo: { totalCount: number; hasMore: boolean; nextOffset: number | null };
};

function signedScore(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function PreviewEntry({
  title,
  item,
  personalized,
  t,
}: {
  title: string;
  item: PreviewItem;
  personalized: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const movement = item.otherRank === null ? 0 : item.otherRank - item.rank;
  const scoreParts = [
    { key: "RatingsGiven", value: item.scoreParts.ratingsGiven },
    { key: "CommentLikes", value: item.scoreParts.commentLikes },
    { key: "Achievements", value: item.scoreParts.achievements },
    { key: "LeaderboardScores", value: item.scoreParts.leaderboardScores },
    { key: "RatingsReceived", value: item.scoreParts.ratingsReceived },
    { key: "CommunityRecommendations", value: item.scoreParts.communityRecommendations },
  ];

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className="text-xl font-semibold lg:hidden">{title}</h2>
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
      <div className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm">
        <div className="flex items-baseline justify-between gap-3 font-semibold">
          <span>{t("AdminRecommendations.TotalScore")}</span>
          <span>{(item.baseScore + (personalized ? item.adjustment : 0)).toFixed(2)}</span>
        </div>
        <dl className="mt-2 space-y-1">
          {scoreParts.map((part) => (
            <div key={part.key} className="flex justify-between gap-3">
              <dt className="opacity-75">{t(`AdminRecommendations.${part.key}`)}</dt>
              <dd className="shrink-0 tabular-nums">{signedScore(part.value)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-white/10 pt-1">
            <dt className="opacity-75">{t("AdminRecommendations.BaseScore")}</dt>
            <dd className="shrink-0 tabular-nums">{item.baseScore.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-3 font-medium">
            <dt>{t("AdminRecommendations.PersonalAdjustment")}</dt>
            <dd className="shrink-0 tabular-nums">{signedScore(personalized ? item.adjustment : 0)}</dd>
          </div>
        </dl>
        {personalized ? (item.reasons.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2 opacity-80">
            {item.reasons.map((reason) => (
              <li key={`${reason.family}:${reason.label}`}>
                {reason.label} {signedScore(reason.contribution)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 border-t border-white/10 pt-2 opacity-70">{t("AdminRecommendations.NoMatch")}</p>
        )) : (
          <p className="mt-2 border-t border-white/10 pt-2 opacity-70">{t("AdminRecommendations.VisitorNoAdjustment")}</p>
        )}
      </div>
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
          <div className="space-y-6">
            <div className="hidden gap-5 lg:grid lg:grid-cols-2">
              <h2 className="text-xl font-semibold">{t("AdminRecommendations.VisitorOrder")}</h2>
              <h2 className="text-xl font-semibold">{t("AdminRecommendations.PlayerOrder", { name: data.viewer.name })}</h2>
            </div>
            {data.baseline.map((item, index) => (
              <div key={index} className="grid gap-5 lg:grid-cols-2">
                <PreviewEntry title={t("AdminRecommendations.VisitorOrder")} item={item} personalized={false} t={t} />
                {data.personalized[index] && (
                  <PreviewEntry title={t("AdminRecommendations.PlayerOrder", { name: data.viewer.name })}
                    item={data.personalized[index]} personalized t={t} />
                )}
              </div>
            ))}
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
