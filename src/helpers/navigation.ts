type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

function normalizeSearchHref(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `?${query}` : "?";
}

export function navigateToSearchIfChanged(
  router: RouterLike,
  params: URLSearchParams,
  mode: "push" | "replace" = "push",
) {
  if (typeof window === "undefined") return;

  const nextHref = normalizeSearchHref(params);
  const currentHref = normalizeSearchHref(
    new URLSearchParams(window.location.search),
  );

  if (nextHref === currentHref) {
    return;
  }

  router[mode](nextHref);
}
