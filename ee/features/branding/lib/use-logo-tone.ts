import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Detects whether a logo image reads as light or dark, so the chip behind it
 * can be given a contrasting background.
 *
 * Stub replacement: the upstream repository imports this hook but does not
 * publish it. The contract comes from its call site
 * (components/view/dataroom/nav-dataroom.tsx): consumers read `tone` and
 * spread `imgProps` onto the display `<img>`, which already carries
 * `crossOrigin="anonymous"` so the canvas read stays untainted and the hook
 * can analyse that single decode instead of fetching the image again.
 * `imgProps` therefore contributes only an `onLoad` handler — repeating
 * `crossOrigin` here would collide with the attribute already set.
 *
 * Callers default to a white chip while the tone is unknown, which is what a
 * cross-origin logo without CORS headers falls back to.
 */
export type LogoTone = "light" | "dark" | "unknown";

export const useLogoTone = (src?: string | null) => {
  const [tone, setTone] = useState<LogoTone>("unknown");

  // A new logo has not been measured yet; drop back to the neutral default
  // until its onLoad fires.
  useEffect(() => {
    setTone("unknown");
  }, [src]);

  const analyse = useCallback(
    (image: HTMLImageElement) => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 16;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let total = 0;
        let counted = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Ignore near-transparent pixels so padding doesn't skew the mean.
          if (data[i + 3] < 16) continue;
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          counted += 1;
        }

        if (!counted) return;
        setTone(total / counted > 140 ? "light" : "dark");
      } catch {
        // Tainted canvas (cross-origin logo without CORS) — leave it unknown.
        setTone("unknown");
      }
    },
    [],
  );

  const imgProps = useMemo(
    () => ({
      onLoad: (event: SyntheticEvent<HTMLImageElement>) =>
        analyse(event.currentTarget),
    }),
    [analyse],
  );

  return { tone, imgProps };
};
