import Link from "@/compat/next-link";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
import type { LinkedPostGame } from "@/types/PostType";

export default function LinkedPostGames({ games }: { games?: LinkedPostGame[] }) {
  const { colors } = useTheme();
  const t = useTranslations();
  if (!games?.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2" aria-label={t("PostGames.LinkedGames")}>
    {games.map(game => <Link key={game.gameId} href={`/g/${game.slug}`} className="flex max-w-full items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors hover:brightness-110"
      style={{ color: colors.blue, borderColor: `color-mix(in srgb, ${colors.text} 10%, transparent)` }}>
      <img src={game.thumbnail || "/images/game-thumbnail.png"} alt="" className="h-7 w-7 shrink-0 rounded-sm object-cover" />
      <span className="min-w-0 break-words">{game.name || game.slug}</span>
    </Link>)}
  </div>;
}
