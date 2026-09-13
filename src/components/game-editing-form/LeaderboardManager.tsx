import { useState } from "react";
import { Button, Dropdown, Icon, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch } from "bioloom-ui";
import type { IconName } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import type { LeaderboardInput, LeaderboardTypeType } from "@/types/LeaderboardType";
import type { GameType } from "@/types/GameType";

const types: Record<LeaderboardTypeType, { label: string; rule: string; icon: IconName }> = {
  SCORE: { label: "Score", rule: "Highest score wins", icon: "trophy" },
  GOLF: { label: "Golf", rule: "Lowest score wins", icon: "landplot" },
  SPEEDRUN: { label: "Speedrun", rule: "Fastest time wins", icon: "rabbit" },
  ENDURANCE: { label: "Endurance", rule: "Longest time wins", icon: "turtle" },
};

function Preview({ leaderboard }: { leaderboard: LeaderboardInput }) {
  const { colors } = useTheme();
  const time = leaderboard.type === "SPEEDRUN" || leaderboard.type === "ENDURANCE";
  const descending = leaderboard.type === "SCORE" || leaderboard.type === "ENDURANCE";
  const samples = time ? [65432, 78210, 91500] : [1250, 1800, 2400];
  if (descending) samples.reverse();
  const format = (value: number) => time
    ? `${Math.floor(value / 60000)}:${String(Math.floor(value / 1000) % 60).padStart(2, "0")}.${String(value % 1000).padStart(3, "0")}`
    : value.toFixed(leaderboard.decimalPlaces);

  return (
    <section className="overflow-hidden rounded-lg border" style={{ borderColor: colors.base, background: colors.crust }}>
      <div className="border-b p-4" style={{ borderColor: colors.base }}>
        <div className="flex items-center gap-2 font-semibold"><Icon name={types[leaderboard.type].icon} />{leaderboard.name || "Untitled leaderboard"}</div>
        <p className="mt-1 text-xs" style={{ color: colors.textFaded }}>Preview · Sample entries</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead style={{ color: colors.textFaded }}><tr><th className="p-3 font-medium">Rank</th><th className="p-3 font-medium">Player</th><th className="p-3 text-right font-medium">{time ? "Time" : "Score"}</th></tr></thead>
        <tbody>{samples.map((value, index) => (
          <tr key={index} className="border-t" style={{ borderColor: colors.base }}>
            <td className="p-3" style={{ color: index === 0 ? colors.yellow : colors.textFaded }}>#{index + 1}</td>
            <td className="p-3">Player {String.fromCharCode(65 + index)}</td>
            <td className="p-3 text-right font-mono">{format(value)}</td>
          </tr>
        ))}</tbody>
      </table>
      <p className="p-3 text-xs" style={{ color: colors.textFaded }}>{types[leaderboard.type].rule} · {leaderboard.onlyBest ? "Best entry per player" : "All entries"}</p>
    </section>
  );
}

export default function LeaderboardManager({ value, onChange }: {
  value: LeaderboardInput[];
  onChange: (value: LeaderboardInput[]) => void;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState<{ index: number | null; draft: LeaderboardInput } | null>(null);
  const [invalidNumber, setInvalidNumber] = useState(false);
  const close = () => { setEditing(null); setInvalidNumber(false); };
  const update = (patch: Partial<LeaderboardInput>) => setEditing(current => current ? { ...current, draft: { ...current.draft, ...patch } } : null);
  const open = (index: number | null) => {
    setInvalidNumber(false);
    setEditing({ index, draft: index === null ? {
      name: "", type: "SCORE", onlyBest: true, game: {} as GameType,
      scores: [], maxUsersShown: 10, decimalPlaces: 0,
    } : { ...value[index] } });
  };
  const apply = () => {
    if (!editing) return;
    const { draft, index } = editing;
    if (!Number.isInteger(draft.decimalPlaces) || draft.decimalPlaces < 0 || draft.decimalPlaces > 3) {
      setInvalidNumber(true);
      return;
    }
    onChange(index === null ? [...value, draft] : value.map((item, i) => i === index ? draft : item));
    close();
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: colors.textFaded }}>{value.length} {value.length === 1 ? "leaderboard" : "leaderboards"}</p>
        <Button icon="plus" onClick={() => open(null)}>Add leaderboard</Button>
      </div>
      {value.length === 0 ? <div className="py-8 text-center text-sm" style={{ color: colors.textFaded }}>No leaderboards yet. Add one to let players compete for scores or times.</div> : (
        <div>
          {value.map((lb, index) => (
            <div key={lb.id ?? index} className="flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0" style={{ borderColor: colors.base }}>
              <div className="flex min-w-0 items-start gap-3">
                <Icon name={types[lb.type].icon} />
                <div className="min-w-0"><p className="break-words text-sm font-semibold">{lb.name || `Leaderboard ${index + 1}`}</p>
                  <p className="mt-1 text-xs" style={{ color: colors.textFaded }}>{types[lb.type].rule} · {lb.onlyBest ? "Best per player" : "All entries"} · {lb.scores.length} entries</p>
                </div>
              </div>
              <Button icon="pencil" variant="ghost" onClick={() => open(index)} aria-label={`Preview and edit ${lb.name || `leaderboard ${index + 1}`}`}>Preview & edit</Button>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={editing !== null} onOpenChange={open => { if (!open) close(); }} size="2xl">
        <ModalContent>
          <ModalHeader className="pr-14 text-lg font-semibold">{editing?.index === null ? "Add leaderboard" : "Edit leaderboard"}</ModalHeader>
          {editing && <ModalBody className="max-h-[65dvh] overflow-y-auto">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-4">
                <Input label="Name" fullWidth value={editing.draft.name} placeholder="e.g. Highest score" onValueChange={name => update({ name })} />
                <div><p className="mb-2 text-sm">Scoring type</p>
                  <Dropdown portal selectedValue={editing.draft.type} onSelect={type => update({ type: type as LeaderboardTypeType })}>
                    {Object.entries(types).map(([type, info]) => <Dropdown.Item key={type} value={type} icon={info.icon} description={info.rule}>{info.label}</Dropdown.Item>)}
                  </Dropdown>
                </div>
                {(editing.draft.type === "SCORE" || editing.draft.type === "GOLF") && <Input label="Decimal places" type="number" min={0} max={3} value={editing.draft.decimalPlaces} onValueChange={v => update({ decimalPlaces: Number(v) })} />}
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.draft.onlyBest} onChange={onlyBest => update({ onlyBest })} />Only show each player’s best entry</label>
                {invalidNumber && <p role="alert" className="text-sm" style={{ color: colors.red }}>Use a whole number from 0 to 3 for decimal places.</p>}
              </div>
              <div className="min-w-0"><Preview leaderboard={{ ...editing.draft, decimalPlaces: Math.max(0, Math.min(3, editing.draft.decimalPlaces || 0)) }} /></div>
            </div>
          </ModalBody>}
          <ModalFooter className="flex-wrap">
            {editing?.index != null && <Button icon="trash" variant="ghost" style={{ color: colors.red }} onClick={() => { onChange(value.filter((_, index) => index !== editing.index)); close(); }}>Remove</Button>}
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button icon="check" color="blue" onClick={apply}>Apply changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
