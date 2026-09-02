/**
 * Chooses between a dataroom's own brand and the team brand it inherits.
 *
 * Stub replacement: the upstream repository imports these but does not
 * publish them. The rule follows the schema and the link-sheet UI: a link
 * with no `brandId` on a dataroom link means "use the dataroom's own brand"
 * (components/links/link-sheet/brand-section.tsx), otherwise the resolved
 * team brand is displayed.
 */

/** Sentinel select value meaning "this dataroom's own brand". */
export const CUSTOM_DATAROOM_BRAND = "custom-dataroom-brand";
export const CUSTOM_DATAROOM_BRAND_LABEL = "Dataroom brand";

export const inheritsTeamBrand = ({
  linkBrandId,
  dataroomBrandId,
  hasDataroomBrand,
}: {
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
  hasDataroomBrand: boolean;
}): boolean => {
  // An explicit brand on the link always wins over the dataroom's own brand.
  if (linkBrandId) return true;
  // No dataroom-specific brand row means there is nothing to inherit from.
  if (!hasDataroomBrand) return true;
  // A dataroom pointing at a team base brand inherits it.
  return Boolean(dataroomBrandId);
};

export const resolveDisplayedDataroomBrand = <
  D extends object,
  T extends object,
>({
  dataroomBrand,
  teamBrand,
  inheritTeamBrand,
}: {
  dataroomBrand: D | null;
  teamBrand: T | null;
  inheritTeamBrand: boolean;
}): D | T | null => {
  if (inheritTeamBrand) return teamBrand ?? dataroomBrand ?? null;
  return dataroomBrand ?? teamBrand ?? null;
};
