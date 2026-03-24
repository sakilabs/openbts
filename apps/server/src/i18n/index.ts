import en from "./en/notifications.js";
import pl from "./pl/notifications.js";

const translations = { en, pl } as const;

type Locale = keyof typeof translations;
type Namespace = keyof typeof translations.en;

function resolveLocale(locale: string | null | undefined): Locale {
  if (!locale) return "pl";
  const lang = locale.split("-")[0]!.toLowerCase();
  return lang in translations ? (lang as Locale) : "pl";
}

export function t<N extends Namespace>(namespace: N, locale: string | null | undefined): { title: string; body: string } {
  return translations[resolveLocale(locale)][namespace];
}
