export function getPlayableSandbox(buildUrl: string, parentOrigin: string) {
  const restricted = "allow-scripts allow-pointer-lock";
  try {
    const build = new URL(buildUrl, parentOrigin);
    if (build.protocol === "https:" && build.origin !== new URL(parentOrigin).origin) {
      return `${restricted} allow-same-origin`;
    }
  } catch {
    // Keep the restrictive sandbox if the URL cannot be resolved.
  }
  return restricted;
}
