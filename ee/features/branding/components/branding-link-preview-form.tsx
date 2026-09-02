import type { Dispatch, SetStateAction } from "react";

/**
 * Editor for a brand's default Open Graph / social link preview.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. Saved values are still honoured at read time by resolvePublicLinkMeta;
 * only the editing UI is missing. Handlers are typed as React state
 * dispatchers because the call sites pass `useState` setters directly.
 */
export function BrandingLinkPreviewForm(_props: {
  enabled: boolean;
  onEnabledChange: Dispatch<SetStateAction<boolean>>;
  title: string;
  onTitleChange: Dispatch<SetStateAction<string>>;
  description: string;
  onDescriptionChange: Dispatch<SetStateAction<string>>;
  imageUrl: string | null;
  onImageChange: Dispatch<SetStateAction<string | null>>;
  faviconUrl: string | null;
  onFaviconChange: Dispatch<SetStateAction<string | null>>;
  inheritanceHint?: string;
}) {
  return null;
}

export default BrandingLinkPreviewForm;
