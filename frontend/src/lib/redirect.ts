const VALID_LOCALES = ["vi", "en"];

export function getSafeRedirect(redirectTo: string | null, locale: string): string {
  if (!redirectTo) return `/${locale}`;

  try {
    const parsed = new URL(redirectTo, "http://localhost");
    const path = parsed.pathname;

    const firstSegment = path.split("/")[1];
    if (!firstSegment || !VALID_LOCALES.includes(firstSegment)) {
      return `/${locale}`;
    }

    if (firstSegment !== locale) {
      return `/${locale}`;
    }

    return path + parsed.search;
  } catch {
    return `/${locale}`;
  }
}
