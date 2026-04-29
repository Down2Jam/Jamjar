import messages from "@/messages/en.json";

export function getRequestConfig<T>(factory: () => T) {
  return factory;
}

export async function getLocale() {
  return "en";
}

export async function getMessages() {
  return messages;
}

export async function getTranslations(namespace?: string) {
  const { createTranslator } = await import("./next-intl");
  return createTranslator(messages, namespace);
}
