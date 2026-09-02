/**
 * Resolves which logo a viewer should see for a brand.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The discriminated union is reconstructed from the consumers, which
 * switch exhaustively over "custom" | "papermark" | "none" (the `never`
 * exhaustiveness check in components/view/dataroom/nav-dataroom.tsx pins the
 * full set) and read `.src` only in the "custom" case.
 */
/** The brand columns {@link resolveBrandLogo} reads. */
export type BrandLogoFields = {
  logo?: string | null;
  hideLogo?: boolean | null;
};

export type ResolvedBrandLogo =
  | { kind: "custom"; src: string }
  | { kind: "papermark" }
  | { kind: "none" };

export const resolveBrandLogo = (
  brand: BrandLogoFields | null | undefined,
): ResolvedBrandLogo => {
  if (brand?.hideLogo) return { kind: "none" };
  if (brand?.logo) return { kind: "custom", src: brand.logo };
  return { kind: "papermark" };
};
