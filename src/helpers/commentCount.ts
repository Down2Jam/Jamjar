import type { CommentType } from "@/types/CommentType";

export function countComments(comments: readonly CommentType[] = []): number {
  let count = 0;
  const pending = [...comments];
  while (pending.length > 0) {
    const comment = pending.pop()!;
    count += 1;
    for (const child of comment.children ?? []) pending.push(child);
  }
  return count;
}
