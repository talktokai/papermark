import type { Dispatch, ReactNode, SetStateAction } from "react";

/**
 * Banner upload / URL editor for dataroom branding.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. Rendering nothing removes the banner control from the branding pages;
 * an already-saved banner keeps rendering in the viewer, since
 * classifyDataroomBanner reads it straight from the brand row.
 *
 * The setters are typed as React state dispatchers because both call sites
 * pass `useState` setters directly (pages/branding.tsx and
 * pages/datarooms/[id]/branding/index.tsx).
 */
export function BannerEditor(_props: {
  banner: string | null;
  setBanner: Dispatch<SetStateAction<string | null>>;
  setBannerBlobUrl?: Dispatch<SetStateAction<string | null>>;
  sizeHint?: string;
  defaultBannerImage?: string;
  /** Upload drop target rendered by the caller. */
  dropZone?: ReactNode;
  onUrlApplied?: () => void;
}) {
  return null;
}

export default BannerEditor;
