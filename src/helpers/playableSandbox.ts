export function getPlayableSandbox(buildUrl: string, parentOrigin: string) {
  // Match the backend CSP: games can open an unsandboxed authorization tab
  // while the embedded game retains its own sandbox restrictions.
  const restricted = "allow-scripts allow-pointer-lock allow-popups allow-popups-to-escape-sandbox";
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
