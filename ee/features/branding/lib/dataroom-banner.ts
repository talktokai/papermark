/**
 * Classifies a dataroom banner URL into the media type used to render it.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The shape is reconstructed from
 * components/view/dataroom/dataroom-banner-media.tsx, which switches over the
 * kinds below and reads `src` plus `youtubeId`.
 */
export type DataroomBannerKind = "none" | "image" | "video" | "youtube";

export type ClassifiedDataroomBanner = {
  kind: DataroomBannerKind;
  src: string | null;
  youtubeId?: string;
};

const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=([\w-]{11})/i,
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
];

export const classifyDataroomBanner = (
  src: string | null | undefined,
): ClassifiedDataroomBanner => {
  // "no-banner" is the stored sentinel for an explicitly hidden banner.
  if (!src || src === "no-banner") return { kind: "none", src: null };

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = src.match(pattern);
    if (match) return { kind: "youtube", src, youtubeId: match[1] };
  }

  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src)) {
    return { kind: "video", src };
  }

  return { kind: "image", src };
};
