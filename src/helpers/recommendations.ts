export function computeEffectiveRecommendationItems<T extends { id: number }>(
  candidates: T[],
  overrideIds: number[],
  hiddenIds: number[],
  limit = 3,
): T[] {
  const candidateById = new Map(candidates.map((item) => [item.id, item]));
  const hiddenSet = new Set(hiddenIds);
  const orderedIds: number[] = [];

  overrideIds.forEach((id) => {
    if (hiddenSet.has(id) || orderedIds.includes(id)) return;
    const item = candidateById.get(id);
    if (item) {
      orderedIds.push(id);
    }
  });

  candidates.forEach((item) => {
    if (orderedIds.length >= limit) return;
    if (hiddenSet.has(item.id) || orderedIds.includes(item.id)) return;
    orderedIds.push(item.id);
  });

  return orderedIds
    .slice(0, limit)
    .map((id) => candidateById.get(id))
    .filter((item): item is T => Boolean(item));
}
