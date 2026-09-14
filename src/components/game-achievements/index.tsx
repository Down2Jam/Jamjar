import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { Button, Card, Modal, ModalBody, ModalContent, ModalHeader, Tooltip, getNeutralBorderColor, addToast } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import styles from "./rarity.module.css";
import type { AchievementType } from "@/types/AchievementType";

export default function GameAchievements({ achievements, userId, thumbnail, gameName, engagedUsers, onToggle, modalOnly = false, onClose }: {
  achievements: AchievementType[];
  userId?: number;
  thumbnail?: string;
  gameName: string;
  modalOnly?: boolean;
  onClose?: () => void;
  engagedUsers: number;
  onToggle: (achievement: AchievementType) => Promise<void>;
}) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"personal" | "global">("personal");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const badgeRowRef = useRef<HTMLDivElement>(null);
  const [visibleBadgeCount, setVisibleBadgeCount] = useState(0);
  useLayoutEffect(() => {
    const row = badgeRowRef.current;
    if (!row) return;
    const update = () => {
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const slots = Math.max(0, Math.floor((row.getBoundingClientRect().width + gap) / (44 + gap)));
      // Reserve one slot for the overflow count whenever not all badges fit.
      setVisibleBadgeCount(achievements.length <= slots ? achievements.length : Math.max(0, slots - 1));
    };
    const observer = new ResizeObserver(update);
    observer.observe(row);
    update();
    return () => observer.disconnect();
  }, [achievements.length, modalOnly]);
  const unlocked = (achievement: AchievementType) => achievement.users.some((entry) => entry.id === userId);
  const unlockTime = (achievement: AchievementType) => {
    if (!unlocked(achievement)) return null;
    const earnedAt = achievement.unlocks?.find((entry) => entry.userId === userId)?.earnedAt;
    if (!earnedAt) return null;
    const date = new Date(earnedAt);
    // Legacy unlocks were backfilled with the achievement creation time.
    if (!Number.isFinite(date.getTime()) || (achievement.createdAt && date.getTime() === new Date(achievement.createdAt).getTime())) return null;
    return date.getTime();
  };
  const unlockDate = (achievement: AchievementType) => {
    const time = unlockTime(achievement);
    return time === null ? null : new Date(time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };
  const count = achievements.filter(unlocked).length;
  const percent = achievements.length ? Math.round(count / achievements.length * 100) : 0;
  const featured = achievements.filter(unlocked).sort((a, b) => (unlockTime(b) ?? -Infinity) - (unlockTime(a) ?? -Infinity))[0];
  const borderColor = getNeutralBorderColor(colors);
  const rarity = (achievement: AchievementType) => {
    const pct = engagedUsers > 0 ? achievement.users.length / engagedUsers * 100 : 0;
    if (engagedUsers >= 40 && pct <= 5) return { name: "Abyssal", color: colors.magenta, strength: 12, shimmer: true };
    if (engagedUsers >= 20 && pct <= 10) return { name: "Diamond", color: colors.blue, strength: 10, shimmer: true };
    if (engagedUsers >= 10 && pct <= 25) return { name: "Gold", color: colors.yellow, strength: 8, shimmer: false };
    if (engagedUsers >= 5 && pct <= 50) return { name: "Silver", color: colors.gray, strength: 6, shimmer: false };
    if (engagedUsers >= 5) return { name: "Bronze", color: colors.orange, strength: 4, shimmer: false };
    return null;
  };
  const image = (achievement: AchievementType, size: string, muted = !unlocked(achievement)) => {
    const tier = rarity(achievement);
    return <span className={`${size} ${styles.icon} ${tier && !muted && tier.shimmer ? styles.shimmer : ""}`} style={tier ? { "--rarity-color": tier.color, "--rarity-glow": `${tier.strength}px`, "--rarity-opacity": muted ? 0.08 : 0.25 } as CSSProperties : undefined}>
      <img src={achievement.image || thumbnail || "/images/game-thumbnail.png"} alt="" className="h-full w-full rounded object-cover" style={{ filter: muted ? "grayscale(1)" : undefined, opacity: muted ? 0.6 : 1 }} />
    </span>;
  };
  const showAchievement = () => { setSearch(""); setView(userId ? "personal" : "global"); setOpen(true); };
  const achievementPreview = (achievement: AchievementType) => (
    <div className="w-80 max-w-[calc(100vw-48px)] px-2 whitespace-normal text-left">
      <div className="flex items-start gap-3 py-2">
        {image(achievement, "h-20 w-20", false)}
        <div className="min-w-0 pt-1">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>{achievement.name}</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.textFaded }}>{achievement.description}</p>
        </div>
      </div>
      <div className="mt-1 border-t py-2 text-xs leading-relaxed" style={{ borderColor, color: colors.textFaded }}>
        {rarity(achievement) && <p style={{ color: rarity(achievement)?.color }}>{rarity(achievement)?.name}</p>}
        {unlocked(achievement) && <p>{unlockDate(achievement) ? uiText("AppStrings.UnlockedOnValue0", { value0: unlockDate(achievement) }) : uiText("AppStrings.Unlocked")}</p>}
        <p>{(engagedUsers ? Math.min(100, achievement.users.length / engagedUsers * 100) : 0).toFixed(1)}{uiText("AppStrings.OfPlayersHaveThisAchievement")}</p>
      </div>
    </div>
  );

  return <>
    {!modalOnly && <Card padding={1} shadow="none">
      <p className="mb-3 text-xs leading-4" style={{ color: colors.textFaded }}>{uiText("AppStrings.ACHIEVEMENTS")}</p>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs" style={{ color: colors.textFaded }}>
            {userId ? <>{count === achievements.length ? uiText("AppStrings.YouVeUnlockedAllAchievements") : uiText("AppStrings.YouVeUnlocked")} {count}/{achievements.length} ({percent}%)</> : uiText("AppStrings.Value0AchievementsSignInToTrackYourProgress", { value0: achievements.length })}
          </p>
          <div role="progressbar" aria-label={uiText("AppStrings.AchievementsUnlocked")} aria-valuenow={count} aria-valuemin={0} aria-valuemax={achievements.length} className="h-2 overflow-hidden rounded-sm" style={{ backgroundColor: colors.base }}>
            <div className="h-full transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%`, backgroundColor: colors.blue }} />
          </div>
        </div>
      </div>
      {featured && <Tooltip compact position="top" content={achievementPreview(featured)}><button type="button" onClick={() => showAchievement()} className="mt-4 flex w-full cursor-pointer items-center gap-3 text-left">
        {image(featured, "h-10 w-10")}
        <div className="min-w-0"><p className="text-sm font-semibold">{featured.name}</p><p className="line-clamp-2 text-xs" style={{ color: colors.textFaded }}>{featured.description}</p></div>
      </button></Tooltip>}
      <div className="mt-3 flex items-center gap-2">
        <div ref={badgeRowRef} className="flex min-w-[44px] flex-1 items-center gap-2 [&>div]:shrink-0">
        {achievements.slice(0, visibleBadgeCount).map((achievement) => <Tooltip key={achievement.id} compact position="top" content={achievementPreview(achievement)}>
          <button type="button" aria-label={uiText("AppStrings.ViewValue0", { value0: achievement.name })} onClick={() => showAchievement()} className="relative flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded p-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2">
            {image(achievement, "h-9 w-9")}
            {unlocked(achievement) && <Check size={12} className="absolute bottom-0 right-0 rounded" style={{ backgroundColor: colors.mantle, color: colors.green }} />}
          </button>
        </Tooltip>)}
        {achievements.length > visibleBadgeCount && <Button variant="ghost" className="!h-[44px] !w-[44px] shrink-0 !p-0" onClick={() => showAchievement()} aria-label={uiText("AppStrings.ViewAllValue0Achievements", { value0: achievements.length })}>+{achievements.length - visibleBadgeCount}</Button>}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => showAchievement()}>{userId ? uiText("AppStrings.ViewMyAchievements") : uiText("AppStrings.ViewAchievements")}</Button>
      </div>
    </Card>}
    <Modal isOpen={modalOnly || open} onOpenChange={(value) => { if (!value) { setOpen(false); onClose?.(); } }} size="2xl" className="!rounded-md">
      <ModalContent className="!w-[840px] !max-w-[calc(100vw-32px)]">
        <ModalHeader className="pr-14 pb-4">
          <div className="flex items-center gap-3">
            <img src={thumbnail || "/images/game-thumbnail.png"} alt="" className="h-9 w-9 rounded object-cover" />
            <h2 className="text-xl font-semibold">{gameName}</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="mb-4">
            <div className="mb-2 flex justify-between gap-3 text-xs" style={{ color: colors.textFaded }}>
              <span>{userId ? uiText("AppStrings.Value0OFValue1ACHIEVEMENTSEARNED", { value0: count, value1: achievements.length }) : uiText("AppStrings.Value0ACHIEVEMENTS", { value0: achievements.length })}</span>
              {userId && <span>({percent}%)</span>}
            </div>
            {userId && <div role="progressbar" aria-label={uiText("AppStrings.AchievementsEarned")} aria-valuenow={count} aria-valuemin={0} aria-valuemax={achievements.length} className="h-2 overflow-hidden rounded-sm" style={{ backgroundColor: colors.base }}>
              <div className="h-full transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%`, backgroundColor: colors.blue }} />
            </div>}
          </div>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {userId && <Button size="sm" variant="ghost" className="!rounded" aria-pressed={view === "personal"} onClick={() => setView("personal")} style={{ backgroundColor: view === "personal" ? `color-mix(in srgb, ${colors.blue} 15%, ${colors.mantle})` : undefined }}>{uiText("AppStrings.MyAchievements")}</Button>}
            <Button size="sm" variant="ghost" className="!rounded" aria-pressed={view === "global"} onClick={() => setView("global")} style={{ backgroundColor: view === "global" ? `color-mix(in srgb, ${colors.blue} 15%, ${colors.mantle})` : undefined }}>{uiText("AppStrings.AllAchievements")}</Button>
          </div>

          <div className="mb-3 flex justify-end">
            <input type="search" aria-label={uiText("AppStrings.SearchAchievements")} placeholder={uiText("AppStrings.SearchAchievements2")} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded border px-3 py-2 text-sm sm:w-64" style={{ backgroundColor: colors.mantle, borderColor, color: colors.text }} />
          </div>
          <div className="max-h-[55dvh] overflow-y-auto pr-1">
            {(() => {
              const matching = achievements.filter((achievement) => `${achievement.name} ${achievement.description}`.toLowerCase().includes(search.trim().toLowerCase()));
              const groups = view === "global"
                ? [{ label: "", items: [...matching].sort((a, b) => b.users.length - a.users.length) }]
                : [{ label: "", items: matching.filter(unlocked) }, { label: uiText("AppStrings.LOCKEDACHIEVEMENTS"), items: matching.filter((achievement) => !unlocked(achievement)) }];
              if (!matching.length) return <p className="py-8 text-center text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.NoAchievementsFound")}</p>;
              return groups.filter((group) => group.items.length).map((group) => <section key={group.label} className="mb-4 last:mb-0">
                {group.label && <h3 className="mb-2 text-xs" style={{ color: colors.textFaded }}>{group.label}</h3>}
                <div className="flex flex-col gap-2">
                  {group.items.map((achievement) => {
                    const date = unlockDate(achievement);
                    const globalPercent = (engagedUsers ? Math.min(100, achievement.users.length / engagedUsers * 100) : 0).toFixed(1);
                    return <div key={achievement.id} className="flex flex-wrap items-center gap-3 rounded border p-3" style={{
                      backgroundColor: colors.mantle,
                      backgroundImage: view === "global"
                        ? `linear-gradient(to right, color-mix(in srgb, ${borderColor} 50%, ${colors.mantle}) ${globalPercent}%, transparent ${globalPercent}%)`
                        : undefined,
                      borderColor,
                    }}>
                      {image(achievement, "h-10 w-10", view === "personal" && !unlocked(achievement))}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{achievement.name}</p>
                        <p className="text-xs leading-relaxed" style={{ color: colors.textFaded }}>{achievement.description}</p>
                        <p className="text-xs" style={{ color: colors.textFaded }}>{globalPercent}{uiText("AppStrings.OfPlayersHaveThisAchievement")}{view === "global" && rarity(achievement) && <span style={{ color: rarity(achievement)?.color }}>  {uiText("AppStrings.Middot")} {rarity(achievement)?.name}</span>}</p>
                      </div>
                      {view === "personal" && <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-col sm:items-end">
                        {date && <p className="text-xs" style={{ color: colors.textFaded }}>{uiText("AppStrings.Unlocked")} {date}</p>}
                        {userId && <Button size="sm" variant="ghost" icon={unlocked(achievement) ? "x" : "plus"} disabled={pendingId !== null} loading={pendingId === achievement.id} onClick={async () => {
                          setPendingId(achievement.id);
                          try { await onToggle(achievement); } catch { addToast({ title: uiText("AppStrings.FailedToUpdateAchievement") }); } finally { setPendingId(null); }
                        }}>{unlocked(achievement) ? uiText("AppStrings.MarkUnachieved") : uiText("AppStrings.MarkAchieved")}</Button>}
                      </div>}
                    </div>;
                  })}
                </div>
              </section>);
            })()}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  </>;
}
