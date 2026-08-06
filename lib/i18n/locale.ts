export const SUPPORTED_LOCALES = ["ko", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_COOKIE = "popok-locale";

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko";
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.startsWith("/en/") ? pathname.slice(3) || "/" : pathname || "/";
}

export function localizePath(pathname: string, locale: Locale): string {
  const base = stripLocalePrefix(pathname);
  return locale === "en" ? (base === "/" ? "/en" : `/en${base}`) : base;
}

export function localizedValue(
  source: Record<string, unknown> | null | undefined,
  koreanKey: string,
  englishKey: string,
  locale: Locale,
): string {
  const korean = typeof source?.[koreanKey] === "string" ? source[koreanKey].trim() : "";
  const english = typeof source?.[englishKey] === "string" ? source[englishKey].trim() : "";
  return locale === "en" ? english || korean : korean || english;
}

export function localizedRecord<T extends Record<string, any>>(record: T, locale: Locale): T {
  if (locale !== "en") return record;
  return {
    ...record,
    name: localizedValue(record, "name", "name_en", locale),
    bio: localizedValue(record, "bio", "bio_en", locale),
    bio_short: localizedValue(record, "bio_short", "introduction_en", locale),
  };
}

export function localizedWork<T extends Record<string, any>>(work: T, locale: Locale): T {
  if (locale !== "en") return work;
  return {
    ...work,
    title: localizedValue(work, "title", "title_en", locale),
    description: localizedValue(work, "description", "description_en", locale),
    role: localizedValue(work, "role", "role_en", locale),
  };
}

export function localizedCareer<T extends Record<string, any>>(item: T, locale: Locale): T {
  if (locale !== "en") return item;
  return {
    ...item,
    title: localizedValue(item, "title", "title_en", locale),
    name: localizedValue(item, "name", "organization_en", locale),
    position: localizedValue(item, "position", "title_en", locale),
    organization: localizedValue(item, "organization", "organization_en", locale),
    description: localizedValue(item, "description", "description_en", locale),
    event: localizedValue(item, "event", "description_en", locale),
  };
}
