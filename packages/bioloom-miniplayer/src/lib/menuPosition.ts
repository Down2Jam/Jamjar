export function positionPlayerMenu(menu: HTMLElement, x: number, y: number, anchor?: HTMLElement | null) {
  const gap = 12;
  const edge = 8;
  const bounds = anchor?.getBoundingClientRect();
  const top = bounds?.top ?? y;
  const bottom = bounds?.bottom ?? y;
  const center = bounds ? bounds.left + bounds.width / 2 : x;
  menu.style.maxHeight = "calc(100dvh - 16px)";
  const naturalHeight = menu.getBoundingClientRect().height;
  const above = Math.max(0, top - gap - edge);
  const below = Math.max(0, window.innerHeight - bottom - gap - edge);
  const openAbove = naturalHeight <= above || above >= below;
  const available = openAbove ? above : below;
  // Account for padding so a tall menu never covers its trigger.
  const style = getComputedStyle(menu);
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  menu.style.maxHeight = `${Math.max(0, available - padding)}px`;
  const rect = menu.getBoundingClientRect();
  const left = Math.max(edge, Math.min(center - rect.width / 2, window.innerWidth - rect.width - edge));
  const menuTop = openAbove ? Math.max(edge, top - gap - rect.height) : bottom + gap;
  return {
    x: left,
    y: menuTop,
    arrowX: Math.max(left + 16, Math.min(center, left + rect.width - 16)),
    arrowY: openAbove ? menuTop + rect.height - 1 : menuTop - 7,
    opensAbove: openAbove,
    width: rect.width,
  };
}
