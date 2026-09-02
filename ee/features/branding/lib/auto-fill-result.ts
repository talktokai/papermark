/**
 * Result helpers for the "auto-fill branding from a website" flow.
 *
 * Stub replacement: the upstream repository imports these but does not
 * publish them. The scraping endpoint that produced these results is not part
 * of the public source, so `autoFillHasBrandAssets` reports that nothing
 * usable was found and pages/branding.tsx shows the not-found message.
 */
export const AUTO_FILL_NOT_FOUND_MESSAGE =
  "We couldn't find brand assets for that website.";

export type AutoFillResult = {
  logo?: string | null;
  brandColor?: string | null;
  accentColor?: string | null;
  banner?: string | null;
} | null;

export const autoFillHasBrandAssets = (
  result: AutoFillResult,
  options?: { allowBanner?: boolean },
): boolean => {
  if (!result) return false;
  return Boolean(
    result.logo ||
      result.brandColor ||
      result.accentColor ||
      (options?.allowBanner && result.banner),
  );
};
