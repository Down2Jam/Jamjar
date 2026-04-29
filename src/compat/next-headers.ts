function readCookie(name: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) {
    return undefined;
  }

  return {
    name,
    value: decodeURIComponent(match.slice(name.length + 1)),
  };
}

export async function cookies() {
  return {
    get: readCookie,
  };
}
