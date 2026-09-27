export function compareResultCategories(
  a: { placement: number; averageScore: number },
  b: { placement: number; averageScore: number },
) {
  const aTop = a.placement >= 1 && a.placement <= 3;
  const bTop = b.placement >= 1 && b.placement <= 3;
  if (aTop !== bTop) return aTop ? -1 : 1;
  if (aTop && a.placement !== b.placement) return a.placement - b.placement;
  return b.averageScore - a.averageScore ||
    (a.placement > 0 ? a.placement : Infinity) - (b.placement > 0 ? b.placement : Infinity);
}
