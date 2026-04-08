export const queryKeys = {
  jam: {
    all: ["jam"] as const,
    current: () => [...queryKeys.jam.all, "current"] as const,
    list: () => [...queryKeys.jam.all, "list"] as const,
    participation: () => [...queryKeys.jam.all, "participation"] as const,
  },
  user: {
    all: ["user"] as const,
    self: () => [...queryKeys.user.all, "self"] as const,
    detail: (slug: string) => [...queryKeys.user.all, "detail", slug] as const,
    search: (query: string) =>
      [...queryKeys.user.all, "search", query] as const,
  },
  game: {
    all: ["game"] as const,
    detail: (slug: string) => [...queryKeys.game.all, "detail", slug] as const,
    list: (sort: string, jamId?: string) =>
      [...queryKeys.game.all, "list", sort, jamId] as const,
    current: () => [...queryKeys.game.all, "current"] as const,
    ratingCategories: (always?: boolean) =>
      [...queryKeys.game.all, "ratingCategories", always] as const,
    flags: () => [...queryKeys.game.all, "flags"] as const,
    tags: () => [...queryKeys.game.all, "tags"] as const,
    results: (
      category: string,
      contentType: string,
      sort: string,
      jam: string
    ) =>
      [
        ...queryKeys.game.all,
        "results",
        category,
        contentType,
        sort,
        jam,
      ] as const,
  },
  post: {
    all: ["post"] as const,
    list: (
      sort: string,
      time: string,
      sticky: boolean,
      tagRules?: Record<number, number>,
      userSlug?: string
    ) =>
      [
        ...queryKeys.post.all,
        "list",
        sort,
        time,
        sticky,
        tagRules,
        userSlug,
      ] as const,
    detail: (slug: string, userSlug?: string) =>
      [...queryKeys.post.all, "detail", slug, userSlug] as const,
  },
  documentation: {
    all: ["documentation"] as const,
    list: (section: string) =>
      [...queryKeys.documentation.all, "list", section] as const,
    detail: (slug: string, section: string) =>
      [...queryKeys.documentation.all, "detail", slug, section] as const,
    pressKitMedia: () =>
      [...queryKeys.documentation.all, "press-kit-media"] as const,
  },
  event: {
    all: ["event"] as const,
    list: (filter: string) =>
      [...queryKeys.event.all, "list", filter] as const,
    detail: (slug: string) =>
      [...queryKeys.event.all, "detail", slug] as const,
  },
  theme: {
    all: ["theme"] as const,
    current: () => [...queryKeys.theme.all, "current"] as const,
    suggestions: () => [...queryKeys.theme.all, "suggestions"] as const,
    list: (isVoting?: boolean) =>
      [...queryKeys.theme.all, "list", isVoting] as const,
    votes: () => [...queryKeys.theme.all, "votes"] as const,
  },
  emoji: {
    all: ["emoji"] as const,
    list: () => [...queryKeys.emoji.all, "list"] as const,
  },
  team: {
    all: ["team"] as const,
    list: () => [...queryKeys.team.all, "list"] as const,
    user: () => [...queryKeys.team.all, "user"] as const,
    roles: () => [...queryKeys.team.all, "roles"] as const,
  },
  tag: {
    all: ["tag"] as const,
    list: () => [...queryKeys.tag.all, "list"] as const,
  },
  streamer: {
    all: ["streamer"] as const,
    list: () => [...queryKeys.streamer.all, "list"] as const,
  },
  siteTheme: {
    all: ["siteTheme"] as const,
    list: () => [...queryKeys.siteTheme.all, "list"] as const,
  },
  track: {
    all: ["track"] as const,
    list: () => [...queryKeys.track.all, "list"] as const,
  },
  admin: {
    all: ["admin"] as const,
    images: () => [...queryKeys.admin.all, "images"] as const,
  },
  notification: {
    all: ["notification"] as const,
    list: () => [...queryKeys.notification.all, "list"] as const,
  },
  search: {
    all: ["search"] as const,
    results: (query: string) =>
      [...queryKeys.search.all, "results", query] as const,
  },
} as const;
