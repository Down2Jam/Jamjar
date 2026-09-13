/** Default neutral outline, shared with game download cards. */
export function getNeutralBorderColor(colors: Record<string, string>): string {
  return `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`;
}
