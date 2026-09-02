import type { DataroomLayoutCardId, DataroomViewerLayoutPreset } from "../lib/dataroom-viewer-layout";

/**
 * Selectable cards for the named dataroom viewer layout presets.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The individual layout controls (card layout, folder tree, header style)
 * remain on the branding page, so the same combinations can still be set by
 * hand — only the one-click presets are missing.
 */
export function DataroomLayoutPresetCards(_props: {
  selectedPreset: DataroomViewerLayoutPreset;
  onSelect: (id: DataroomLayoutCardId) => void;
}) {
  return null;
}

export default DataroomLayoutPresetCards;
