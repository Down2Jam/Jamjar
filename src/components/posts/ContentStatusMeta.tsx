"use client";

import { formatDistance } from "date-fns";
import { Hstack, Icon, Text, Tooltip } from "bioloom-ui";

export default function ContentStatusMeta({
  createdAt,
  editedAt,
  deletedAt,
  removedAt,
}: {
  createdAt: Date | string;
  editedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  removedAt?: Date | string | null;
}) {
  const now = new Date();
  const createdDate = new Date(createdAt);

  const renderBadge = (
    icon: string,
    label: string,
    at?: Date | string | null
  ) => {
    if (!at) return null;
    const date = new Date(at);
    return (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center self-center leading-none">
        <Tooltip
          content={`${label} ${formatDistance(date, now, { addSuffix: true })}`}
        >
          <span className="flex h-4 w-4 items-center justify-center leading-none">
            <Icon name={icon as any} size={14} />
          </span>
        </Tooltip>
      </span>
    );
  };

  return (
    <Hstack className="gap-1 leading-none">
      <Text size="xs" color="textFaded">
        {formatDistance(createdDate, now, {
          addSuffix: true,
        })}
      </Text>
      {renderBadge("squarepen", "Edited", editedAt)}
      {renderBadge("trash2", "Deleted", deletedAt)}
      {renderBadge("shieldx", "Removed", removedAt)}
    </Hstack>
  );
}
