/**
 * Resolves the Open Graph / social preview tags for a public link.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The result shape is pinned by the initialiser in
 * lib/api/links/link-data.ts, and the precedence follows the schema comment
 * on Brand.customLinkPreviewEnabled ("per-link settings override"): explicit
 * link metatags win, then the brand's link preview, then the default title.
 */
export type ResolvedPublicLinkMeta = {
  enableCustomMetatag: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage: string | null;
  metaFavicon: string | null;
};

type BrandPreview = {
  customLinkPreviewEnabled?: boolean | null;
  linkPreviewTitle?: string | null;
  linkPreviewDescription?: string | null;
  linkPreviewImage?: string | null;
  linkPreviewFavicon?: string | null;
} | null;

export const resolvePublicLinkMeta = ({
  link,
  teamBrand,
  dataroomBrand,
  defaultTitle,
}: {
  link: {
    enableCustomMetatag: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaImage: string | null;
    metaFavicon: string | null;
  };
  teamBrand?: BrandPreview;
  dataroomBrand?: BrandPreview;
  defaultTitle?: string | null;
}): ResolvedPublicLinkMeta => {
  if (link.enableCustomMetatag) {
    return {
      enableCustomMetatag: true,
      metaTitle: link.metaTitle ?? defaultTitle ?? null,
      metaDescription: link.metaDescription,
      metaImage: link.metaImage,
      metaFavicon: link.metaFavicon ?? "/favicon.ico",
    };
  }

  const brand = [dataroomBrand, teamBrand].find(
    (candidate) => candidate?.customLinkPreviewEnabled,
  );

  if (brand) {
    return {
      enableCustomMetatag: true,
      metaTitle: brand.linkPreviewTitle ?? defaultTitle ?? null,
      metaDescription: brand.linkPreviewDescription ?? null,
      metaImage: brand.linkPreviewImage ?? null,
      metaFavicon: brand.linkPreviewFavicon ?? "/favicon.ico",
    };
  }

  return {
    enableCustomMetatag: false,
    metaTitle: defaultTitle ?? null,
    metaDescription: null,
    metaImage: null,
    metaFavicon: "/favicon.ico",
  };
};
