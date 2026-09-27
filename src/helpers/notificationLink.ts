import type { NotificationType } from "../types/NotificationType";

export function getNotificationLink(
  notification: Pick<NotificationType, "type" | "data" | "link">,
) {
  if (notification.type === "FOLLOW") {
    const userSlug =
      typeof notification.data?.userSlug === "string"
        ? notification.data.userSlug
        : null;
    if (userSlug) return `/u/${userSlug}`;
  }

  if (!notification.link) return null;
  // Stored notifications can still contain routes used by the old frontend.
  return notification.link
    .replace(/^\/forum\/posts\/([^/?#]+)(.*)$/, "/p/$1$2")
    .replace(/^\/games\/([^/?#]+)(.*)$/, "/g/$1$2")
    .replace(/^\/tracks\/([^/?#]+)(.*)$/, "/m/$1$2")
    .replace(/^\/users\/([^/?#]+)(.*)$/, "/u/$1$2");
}
