function mixColors(from: string, to: string, amount: number) {
  const parse = (value: string) => {
    const hex = value?.replace(/^#/, "");
    const full = hex?.length === 3 ? [...hex].map((part) => part + part).join("") : hex;
    return /^[\da-f]{6}$/i.test(full ?? "")
      ? [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16))
      : null;
  };
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return `color-mix(in srgb, ${from} ${(1 - amount) * 100}%, ${to} ${amount * 100}%)`;
  return `#${a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

export function getRatingColor(stars: number, colors: Record<string, string>, shade = "") {
  const color = (name: string) => colors[`${name}${shade}`] ?? colors[name];
  if (!Number.isFinite(stars) || stars <= 2) return colors.textFaded;
  if (stars < 3) return mixColors(colors.textFaded, color("purple"), stars - 2);
  if (stars === 4) return color("green");
  if (stars > 4) {
    const lime = mixColors(color("green"), color("yellow"), 0.95);
    return mixColors(color("green"), lime, Math.min((stars - 4) * 2, 1));
  }
  const lower = stars < 3.5 ? "purple" : "blue";
  const upper = stars < 3.5 ? "blue" : "green";
  const start = stars < 3.5 ? 3 : 3.5;
  if (stars === start) return color(lower);
  return mixColors(color(lower), color(upper), (stars - start) * 2);
}

export function getResultsGradient(placement: number, averageScore: number, colors: Record<string, string>) {
  if (placement >= 1 && placement <= 3) {
    return { gradient: `linear-gradient(90deg, ${colors.yellow}, ${colors.red})`, first: colors.red };
  }
  const stars = averageScore / 2;
  const first = getRatingColor(stars, colors);
  return {
    gradient: `linear-gradient(90deg, ${getRatingColor(stars, colors, "Light")}, ${first}, ${getRatingColor(stars, colors, "Dark")})`,
    first,
  };
}
