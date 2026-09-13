import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Spinner } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "@/requests/config";
import { readItem } from "@/requests/helpers";

type JamGames = {
  jam: { name: string } | null;
  games: Array<{
    id: number; slug: string; name: string; published: boolean; category: string;
    hasDescription: boolean; hasThumbnail: boolean; hasBuild: boolean; hasPostJamPage: boolean;
    trackCount: number; updatedAt: string;
    team: { name: string | null; users: Array<{ id: number; name: string; slug: string }> };
  }>;
};

export default function AdminJamGames() {
  const t = useTranslations();
  const [data, setData] = useState<JamGames | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "unpublished">("all");
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const response = await fetch(`${BASE_URL}/admin/jam-games`, {
        credentials: "include", cache: "no-store",
        headers: { authorization: `Bearer ${getCookie("token")}` },
      });
      if (!response.ok) throw new Error("Failed to load games");
      setData(await readItem<JamGames>(response));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const query = search.trim().toLowerCase();
  const games = (data?.games ?? []).filter((game) =>
    (status === "all" || game.published === (status === "published")) &&
    [game.name, game.slug, game.team.name, ...game.team.users.map((user) => `${user.name} ${user.slug}`)]
      .some((value) => value?.toLowerCase().includes(query)),
  );
  return <div className="flex flex-col gap-4">
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">{t("AdminJamGames.Title")}</h1>
          <p className="mt-1 text-sm">{data?.jam?.name ?? t("AdminJamGames.CurrentJam")}</p></div>
        <Button onClick={load} disabled={loading}>{t("AdminJamGames.Refresh")}</Button>
      </div>
      <p className="mt-3 text-sm">{t("AdminJamGames.Description")}</p>
    </Card>
    {loading ? <Spinner /> : error ? <Card><p role="alert">{t("AdminJamGames.LoadError")}</p></Card> : !data?.jam ?
      <Card>{t("AdminJamGames.NoJam")}</Card> : <>
      <Card>
        <p className="mb-3">{t("AdminJamGames.Summary", { total: data.games.length, published: data.games.filter((game) => game.published).length, unpublished: data.games.filter((game) => !game.published).length })}</p>
        <Input value={search} onValueChange={setSearch} placeholder={t("AdminJamGames.Search")} aria-label={t("AdminJamGames.Search")} fullWidth />
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "published", "unpublished"] as const).map((value) => <Button key={value} size="sm" color={status === value ? "blue" : "default"} aria-pressed={status === value} onClick={() => setStatus(value)}>{t(`AdminJamGames.${value}`)}</Button>)}
        </div>
      </Card>
      {games.length === 0 && <Card>{t("AdminJamGames.NoGames")}</Card>}
      {games.map((game) => <Card key={game.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold">{game.name}</h2>
            <p className="text-sm opacity-70">{game.team.name || game.team.users.map((user) => user.name).join(", ")}</p>
            <p className="mt-1 text-sm">{t(game.published ? "AdminJamGames.published" : "AdminJamGames.unpublished")} · {game.category}</p>
          </div>
          <Button href={`/g/${encodeURIComponent(game.slug)}`} size="sm" icon="externalLink">{t(game.published ? "AdminJamGames.VisitPage" : "AdminJamGames.VisitTempPage")}</Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {([['DescriptionState', game.hasDescription], ['Thumbnail', game.hasThumbnail], ['Build', game.hasBuild], ['PostJam', game.hasPostJamPage]] as const).map(([key, present]) => <div key={key}><dt className="opacity-70">{t(`AdminJamGames.${key}`)}</dt><dd>{t(present ? "AdminJamGames.Present" : "AdminJamGames.Missing")}</dd></div>)}
          <div><dt className="opacity-70">{t("AdminJamGames.Tracks")}</dt><dd>{game.trackCount}</dd></div>
        </dl>
      </Card>)}
    </>}
  </div>;
}
