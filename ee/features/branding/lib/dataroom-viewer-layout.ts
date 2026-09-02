import { z } from "zod";

/**
 * Dataroom viewer layout vocabulary.
 *
 * Stub replacement: the upstream repository imports these but does not
 * publish them. Every value below is pinned by existing code: the Prisma
 * defaults (prisma/schema/brand.prisma) and the preset switch in
 * pages/branding.tsx, which maps each preset id onto a concrete
 * cardLayout / showFolderTree / viewerHeaderStyle / hideFolderIconsInMain
 * combination.
 */
export const DataroomCardLayoutSchema = z.enum(["LIST", "GRID", "COMPACT"]);
export type DataroomCardLayout = z.infer<typeof DataroomCardLayoutSchema>;

export const DataroomViewerHeaderStyleSchema = z.enum([
  "DEFAULT",
  "SPLIT",
  "NOTION",
]);
export type DataroomViewerHeaderStyle = z.infer<
  typeof DataroomViewerHeaderStyleSchema
>;

export const DataroomViewerLayoutPresetSchema = z.enum([
  "STANDARD",
  "STRICT",
  "MODERN",
  "NOTION",
  "CUSTOM",
]);
export type DataroomViewerLayoutPreset = z.infer<
  typeof DataroomViewerLayoutPresetSchema
>;

/** Preset ids offered as selectable cards (CUSTOM is derived, never picked). */
export type DataroomLayoutCardId = Exclude<DataroomViewerLayoutPreset, "CUSTOM">;

export const CARD_LAYOUT_OPTIONS: ReadonlyArray<{
  value: DataroomCardLayout;
  label: string;
}> = [
  { value: "LIST", label: "List" },
  { value: "GRID", label: "Grid" },
  { value: "COMPACT", label: "Compact" },
];

export const asDataroomCardLayout = (
  value: unknown,
): DataroomCardLayout => {
  const parsed = DataroomCardLayoutSchema.safeParse(value);
  return parsed.success ? parsed.data : "LIST";
};

export const asDataroomViewerHeaderStyle = (
  value: unknown,
): DataroomViewerHeaderStyle => {
  const parsed = DataroomViewerHeaderStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : "DEFAULT";
};

type LayoutShape = {
  cardLayout: DataroomCardLayout;
  showFolderTree: boolean;
  hideFolderIconsInMain: boolean;
  viewerHeaderStyle: DataroomViewerHeaderStyle;
};

// Mirrors applyLayoutPreset() in pages/branding.tsx — kept in the same order
// so the derived preset matches what selecting a card would produce.
const PRESET_SHAPES: ReadonlyArray<{
  id: DataroomLayoutCardId;
  shape: LayoutShape;
}> = [
  {
    id: "STANDARD",
    shape: {
      cardLayout: "LIST",
      showFolderTree: true,
      viewerHeaderStyle: "DEFAULT",
      hideFolderIconsInMain: false,
    },
  },
  {
    id: "STRICT",
    shape: {
      cardLayout: "COMPACT",
      showFolderTree: false,
      viewerHeaderStyle: "DEFAULT",
      hideFolderIconsInMain: true,
    },
  },
  {
    id: "MODERN",
    shape: {
      cardLayout: "COMPACT",
      showFolderTree: false,
      viewerHeaderStyle: "SPLIT",
      hideFolderIconsInMain: true,
    },
  },
  {
    id: "NOTION",
    shape: {
      cardLayout: "GRID",
      showFolderTree: false,
      viewerHeaderStyle: "NOTION",
      hideFolderIconsInMain: false,
    },
  },
];

/** Names the preset matching the current layout, or CUSTOM when none does. */
export const inferDataroomViewerLayoutPreset = (
  layout: LayoutShape,
): DataroomViewerLayoutPreset => {
  const match = PRESET_SHAPES.find(
    ({ shape }) =>
      shape.cardLayout === layout.cardLayout &&
      shape.showFolderTree === layout.showFolderTree &&
      shape.viewerHeaderStyle === layout.viewerHeaderStyle &&
      shape.hideFolderIconsInMain === layout.hideFolderIconsInMain,
  );
  return match?.id ?? "CUSTOM";
};
