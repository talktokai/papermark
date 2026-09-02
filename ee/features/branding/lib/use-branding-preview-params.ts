import { useEffect, useState } from "react";

/**
 * Reads branding preview settings from the URL, then keeps them live over
 * postMessage so the branding editor's preview iframe never reloads.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The returned keys are taken from the destructuring in
 * pages/room_ppreview_demo.tsx; every value arrives as a raw query-string
 * value, which that page parses itself (e.g. `hideLogo === "1"`).
 */
export type BrandingPreviewParams = {
  brandLogo: string;
  hideLogo: string;
  brandColor: string;
  brandBanner: string;
  accentColor: string;
  applyAccentColorToDataroomView: string;
  cardLayout: string;
  showFolderTree: string;
  ctaLabel: string;
  ctaUrl: string;
  accentButtonColor: string;
  viewerHeaderStyle: string;
  hideFolderIconsInMain: string;
  welcomeMessage: string;
};

const PARAM_KEYS: (keyof BrandingPreviewParams)[] = [
  "brandLogo",
  "hideLogo",
  "brandColor",
  "brandBanner",
  "accentColor",
  "applyAccentColorToDataroomView",
  "cardLayout",
  "showFolderTree",
  "ctaLabel",
  "ctaUrl",
  "accentButtonColor",
  "viewerHeaderStyle",
  "hideFolderIconsInMain",
  "welcomeMessage",
];

const EMPTY = Object.fromEntries(
  PARAM_KEYS.map((key) => [key, ""]),
) as BrandingPreviewParams;

const readFromLocation = (): BrandingPreviewParams => {
  if (typeof window === "undefined") return EMPTY;
  const search = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    PARAM_KEYS.map((key) => [key, search.get(key) ?? ""]),
  ) as BrandingPreviewParams;
};

export const useBrandingPreviewParams = (): BrandingPreviewParams => {
  const [params, setParams] = useState<BrandingPreviewParams>(EMPTY);

  useEffect(() => {
    setParams(readFromLocation());

    const onMessage = (event: MessageEvent) => {
      // Only accept updates from the editor hosting this iframe.
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      setParams((current) => {
        const next = { ...current };
        let changed = false;
        for (const key of PARAM_KEYS) {
          const value = (data as Record<string, unknown>)[key];
          if (typeof value === "string" && value !== next[key]) {
            next[key] = value;
            changed = true;
          }
        }
        return changed ? next : current;
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return params;
};
