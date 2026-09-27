export function tokenizeRecapWords(content: string): string[] {
  return content
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/&(?:apos|rsquo|lsquo|#0*39|#x0*27|#0*8217|#x0*2019|#0*8216|#x0*2018);/gi, "'")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .match(/:[a-z0-9_-]+:|[a-z]+(?:'[a-z]+)*/gi) ?? [];
}

export function uniqueRecapWords(content: string): string[] {
  return [...new Set(tokenizeRecapWords(content).map((word) => word.toLowerCase()))];
}

type RecapComment = {
  id: number | string;
  content?: string;
  deletedAt?: unknown;
  removedAt?: unknown;
  children?: RecapComment[];
};

// Detail responses truncate replies. Expand their leaf nodes using the replies API.
export async function loadRecapComments<T extends RecapComment>(
  comments: T[],
  getReplies: (id: number) => Promise<T[]>,
): Promise<T[]> {
  const pending: RecapComment[] = [...comments];
  const visited = new Set<number | string>();
  const result: T[] = [];
  while (pending.length) {
    const batch = pending.splice(0, 4).filter((comment) => {
      if (visited.has(comment.id)) return false;
      visited.add(comment.id);
      return !comment.deletedAt && !comment.removedAt;
    });
    await Promise.all(batch.map(async (comment) => {
      if (typeof comment.content === "string") {
        result.push({ ...comment, children: [] } as unknown as T);
      }
      const children = comment.children ?? [];
      const hasCompleteChildren = Array.isArray(comment.children) && children.every(
        (child) => typeof child.content === "string",
      );
      if (hasCompleteChildren || typeof comment.id !== "number") {
        pending.push(...children);
      } else {
        pending.push(...await getReplies(comment.id));
      }
    }));
  }
  return result;
}
