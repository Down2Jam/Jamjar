export type PostTagRules = Record<number, number>;

export function parsePostTagRules(value: string | null): PostTagRules | undefined {
  if (!value) return undefined;

  const rules: PostTagRules = {};

  for (const rule of value.split("_")) {
    const [rawTagId, rawValue] = rule.split(",");
    const tagId = Number(rawTagId);
    const ruleValue = Number(rawValue);

    if (Number.isInteger(tagId) && tagId > 0 && (ruleValue === 1 || ruleValue === -1)) {
      rules[tagId] = ruleValue;
    }
  }

  return Object.keys(rules).length > 0 ? rules : undefined;
}

export function serializePostTagRules(rules?: PostTagRules): string {
  if (!rules) return "";

  return Object.entries(rules)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([tagId, value]) => `${tagId},${value}`)
    .join("_");
}

export function postTagFilterHref(tagId: number): string {
  return `/home?tags=${encodeURIComponent(`${tagId},1`)}`;
}
