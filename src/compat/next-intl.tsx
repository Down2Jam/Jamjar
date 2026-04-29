import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type AbstractIntlMessages = Record<string, unknown>;

type IntlContextValue = {
  locale: string;
  messages: AbstractIntlMessages;
};

const IntlContext = createContext<IntlContextValue>({
  locale: "en",
  messages: {},
});

export function NextIntlClientProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);

  return (
    <IntlContext.Provider value={value}>
      {children}
    </IntlContext.Provider>
  );
}

function readPath(source: AbstractIntlMessages, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, values?: Record<string, unknown>) {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function createTranslator(
  messages: AbstractIntlMessages,
  namespace?: string,
) {
  return (key: string, values?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const value = readPath(messages, fullKey);
    return typeof value === "string" ? interpolate(value, values) : key;
  };
}

export function useTranslations(namespace?: string) {
  const { messages } = useContext(IntlContext);
  return useMemo(
    () => createTranslator(messages, namespace),
    [messages, namespace],
  );
}

export function useLocale() {
  return useContext(IntlContext).locale;
}
