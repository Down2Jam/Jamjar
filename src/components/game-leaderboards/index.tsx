import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { Fragment, useState } from "react";
import { Avatar, Button, Card, Dropdown, Modal, ModalBody, ModalContent, ModalHeader, Pagination, getNeutralBorderColor } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { UserHoverPreview } from "@/components/hover-previews";
import type { LeaderboardType } from "@/types/LeaderboardType";
import type { ScoreType } from "@/types/ScoreType";

function getPreviewIndices(scoreCount: number, ownIndex: number) {
  const indices = new Set<number>();
  const addWindow = (start: number, count = 3) => {
    for (let index = start; index < start + count; index += 1) {
      if (index >= 0 && index < scoreCount) indices.add(index);
    }
  };

  addWindow(0, 4);
  addWindow(Math.max(0, scoreCount - 3));

  const canCenterOnPlayer = ownIndex >= 2 && ownIndex <= scoreCount - 3;
  const middleStart = Math.max(0, Math.floor(scoreCount / 2) - 1);
  addWindow(canCenterOnPlayer ? ownIndex - 1 : middleStart);

  return [...indices].sort((left, right) => left - right);
}

export default function GameLeaderboards({ leaderboards, userId, canManage, onSubmit, onDelete }: {
  leaderboards: LeaderboardType[];
  userId?: number;
  canManage: boolean;
  onSubmit: (leaderboard: LeaderboardType) => void;
  onDelete: (score: ScoreType) => Promise<void>;
}) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState(leaderboards[0]?.id);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [evidence, setEvidence] = useState<ScoreType | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const board = leaderboards.find((entry) => entry.id === selectedId) ?? leaderboards[0];
  if (!board) return null;
  const borderColor = getNeutralBorderColor(colors);
  const ascending = board.type === "GOLF" || board.type === "SPEEDRUN";
  const sorted = [...(board.scores ?? [])].sort((a, b) => (ascending ? a.data - b.data : b.data - a.data) || a.id - b.id);
  const seen = new Set<number>();
  const scores = board.onlyBest ? sorted.filter((score) => {
    if (seen.has(score.user.id)) return false;
    seen.add(score.user.id);
    return true;
  }) : sorted;
  const ownIndex = scores.findIndex((score) => score.user.id === userId);
  const previewIndices = getPreviewIndices(scores.length, ownIndex);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(scores.length / pageSize));
  const currentPage = Math.min(page, pages);
  const format = (score: ScoreType) => {
    if (board.type === "SCORE" || board.type === "GOLF") return (score.data / 10 ** board.decimalPlaces).toLocaleString(undefined, { maximumFractionDigits: board.decimalPlaces });
    const hours = Math.floor(score.data / 3600000);
    const minutes = Math.floor(score.data % 3600000 / 60000);
    const seconds = Math.floor(score.data % 60000 / 1000);
    const milliseconds = score.data % 1000;
    return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${milliseconds ? `.${String(milliseconds).padStart(3, "0")}` : ""}`;
  };
  const selector = () => <Dropdown portal selectedValue={board.id} onSelect={(value) => { setSelectedId(Number(value)); setPage(1); }} triggerSize="sm" triggerVariant="ghost" triggerStyle={{ boxShadow: "none" }}>
    {leaderboards.map((entry) => <Dropdown.Item key={entry.id} value={entry.id} icon={entry.type === "SCORE" ? "trophy" : entry.type === "GOLF" ? "landplot" : entry.type === "SPEEDRUN" ? "rabbit" : "turtle"}>{entry.name}</Dropdown.Item>)}
  </Dropdown>;
  const row = (score: ScoreType, index: number, full = false, hideDivider = false) => <div key={score.id} className="flex items-center gap-2 border-b py-2 last:border-b-0" style={{ borderColor, borderBottomWidth: hideDivider ? 0 : undefined }}>
    <span className="w-6 shrink-0 text-xs tabular-nums" style={{ color: colors.textFaded }}>{index + 1}</span>
    <div className="min-w-0 flex-1">
      <UserHoverPreview user={score.user} portal><a href={`/u/${score.user.slug}`} className="flex min-w-0 items-center gap-2 text-sm">
        <Avatar src={score.user.profilePicture} size={20} /><span className="truncate">{score.user.name}</span>
      </a></UserHoverPreview>
    </div>
    <button type="button" disabled={!score.evidence} onClick={() => setEvidence(score)} aria-label={uiText("AppStrings.Value0Value13", { value0: format(score), value1: score.evidence ? ", view evidence" : "" })} className="shrink-0 rounded text-right text-sm tabular-nums enabled:cursor-pointer enabled:hover:underline focus-visible:outline" style={{ color: colors.blue }}>{format(score)}</button>
    {full && <div className="flex shrink-0 gap-1">
      <Button size="sm" variant="ghost" icon="eye" aria-label={uiText("AppStrings.ViewScoreEvidence")} disabled={!score.evidence} onClick={() => setEvidence(score)} />
      {(canManage || score.user.id === userId) && <Button size="sm" variant="ghost" icon="trash" color="red" aria-label={uiText("AppStrings.DeleteScore")} disabled={pending !== null} loading={pending === score.id} onClick={async () => { setPending(score.id); try { await onDelete(score); } finally { setPending(null); } }} />}
    </div>}
  </div>;
  const submit = () => { setOpen(false); onSubmit(board); };
  return <>
    <Card padding={1} shadow="none">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-4" style={{ color: colors.textFaded }}>{uiText("AppStrings.LEADERBOARD")}</p>
        {selector()}
      </div>
      <div>
        {previewIndices.map((index, position) => <Fragment key={scores[index].id}>
          {position > 0 && index > previewIndices[position - 1] + 1 && <div aria-label={uiText("AppStrings.RanksOmitted")} className="flex h-px items-center gap-2 text-xs leading-none" style={{ color: colors.textFaded }}><span className="w-6 shrink-0 text-[10px] opacity-40">{uiText("AppStrings.MiddotMiddotMiddot")}</span><span className="flex-1 border-t" style={{ borderColor }} /></div>}
          {row(scores[index], index, false, previewIndices[position + 1] > index + 1)}
        </Fragment>)}
      </div>
      {!scores.length && <p className="py-3 text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.BeTheFirstToSetAScore")}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" variant="ghost" icon="plus" onClick={submit}>{uiText("AppStrings.SubmitScore2")}</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{uiText("AppStrings.ViewLeaderboard")}</Button>
      </div>
    </Card>
    <Modal isOpen={open && !evidence} onOpenChange={(value) => setOpen(!!value)} size="2xl" className="!rounded-md">
      <ModalContent className="!w-[840px] !max-w-[calc(100vw-32px)]">
        <ModalHeader className="pr-14"><h2 className="text-xl font-semibold">{uiText("AppStrings.Leaderboard2")}</h2></ModalHeader>
        <ModalBody>
          <div className="mb-3 flex flex-wrap justify-between gap-3">{selector()}<Button size="sm" variant="ghost" icon="plus" onClick={submit}>{uiText("AppStrings.SubmitScore2")}</Button></div>
          <div className="max-h-[55dvh] overflow-y-auto">
            {scores.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((score, index) => row(score, (currentPage - 1) * pageSize + index, true))}
            {!scores.length && <p className="py-6 text-center text-sm" style={{ color: colors.textFaded }}>{uiText("AppStrings.NoScoresYet2")}</p>}
          </div>
          {pages > 1 && <div className="mt-4 flex justify-center"><Pagination showControls color="primary" variant="faded" page={currentPage} total={pages} onChange={setPage} /></div>}
        </ModalBody>
      </ModalContent>
    </Modal>
    <Modal isOpen={!!evidence} onOpenChange={(value) => { if (!value) setEvidence(null); }} size="2xl">
      <ModalContent><ModalHeader className="pr-14">{uiText("AppStrings.ScoreEvidence")}</ModalHeader><ModalBody>
        {evidence && <img src={evidence.evidence} alt={uiText("AppStrings.ScoreEvidenceFromValue0", { value0: evidence.user.name })} className="max-h-[70dvh] max-w-full object-contain" />}
      </ModalBody></ModalContent>
    </Modal>
  </>;
}
