import { merge } from "lodash";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const fallbackLocale = "en";

  const fallbackMessages = (await import(`../messages/${fallbackLocale}.json`))
    .default;

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = fallbackMessages;
  }

  return {
    locale,
    timeZone: "America/Toronto",
    messages: merge({}, fallbackMessages, messages),
  };
});
