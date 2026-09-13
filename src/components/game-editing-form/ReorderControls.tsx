import { Button } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const reordered = [...items];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}

export default function ReorderControls({ index, count, name, onMove }: {
  index: number;
  count: number;
  name: string;
  onMove: (direction: -1 | 1) => void;
}) {
  const t = useTranslations();
  if (count < 2) return null;
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`${t("AppStrings.MoveUp")}: ${name}`}>
        {t("AppStrings.MoveUp")}
      </Button>
      <Button size="sm" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`${t("AppStrings.MoveDown")}: ${name}`}>
        {t("AppStrings.MoveDown")}
      </Button>
    </div>
  );
}
