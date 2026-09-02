import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Team-brand resolution helpers.
 *
 * Stub replacement: the upstream repository imports these but does not
 * publish them. The behaviour below is reconstructed from the Prisma schema
 * (Brand.teamId, Team.defaultBrandId, Link.brandId, Dataroom.brandId) and
 * from the call sites, which use them to pick the brand row a viewer should
 * see and to keep a team from referencing another team's brand.
 */

/** Precedence: link override, then dataroom base brand, then team default. */
export const resolveBaseBrand = async <T extends Record<string, boolean>>({
  teamId,
  linkBrandId,
  dataroomBrandId,
  select,
}: {
  teamId: string;
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
  select: T;
}) => {
  const brandId = linkBrandId ?? dataroomBrandId ?? null;

  if (brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, teamId },
      select,
    });
    if (brand) return brand;
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { defaultBrandId: true },
  });

  if (team?.defaultBrandId) {
    const defaultBrand = await prisma.brand.findFirst({
      where: { id: team.defaultBrandId, teamId },
      select,
    });
    if (defaultBrand) return defaultBrand;
  }

  // Fall back to the team's only/first brand so single-brand teams keep
  // working even when defaultBrandId was never set.
  return prisma.brand.findFirst({
    where: { teamId },
    orderBy: { createdAt: "asc" },
    select,
  });
};

/** The team's default brand id, used when creating new datarooms. */
export const resolveDefaultBrandId = async (
  teamId: string,
): Promise<string | null> => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { defaultBrandId: true },
  });
  if (team?.defaultBrandId) return team.defaultBrandId;

  const brand = await prisma.brand.findFirst({
    where: { teamId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return brand?.id ?? null;
};

/**
 * Validates that `brandId` belongs to `teamId` before it is persisted on a
 * link. Returns null for an unset or foreign brand so a team can never point
 * a link at another team's brand.
 */
export const resolveOwnedBrandId = async (
  teamId: string,
  brandId?: string | null,
): Promise<string | null> => {
  if (!brandId) return null;

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, teamId },
    select: { id: true },
  });
  return brand?.id ?? null;
};

/**
 * Prisma `select` shapes for the three brand read paths. Each lists the
 * columns its consumer actually renders (viewer chrome, link preview /
 * Open Graph tags, workflow pages).
 */
export const teamBrandViewerSelect = {
  id: true,
  logo: true,
  hideLogo: true,
  banner: true,
  brandColor: true,
  accentColor: true,
  accentButtonColor: true,
  applyAccentColorToDataroomView: true,
  welcomeMessage: true,
  ctaLabel: true,
  ctaUrl: true,
  privacyPolicyUrl: true,
  cardLayout: true,
  showFolderTree: true,
  viewerLayoutPreset: true,
  viewerHeaderStyle: true,
  hideFolderIconsInMain: true,
  defaultLanguage: true,
} as const;

export const teamBrandOgSelect = {
  id: true,
  logo: true,
  hideLogo: true,
  brandColor: true,
  customLinkPreviewEnabled: true,
  linkPreviewTitle: true,
  linkPreviewDescription: true,
  linkPreviewImage: true,
  linkPreviewFavicon: true,
} as const;

export const teamBrandWorkflowSelect = {
  id: true,
  logo: true,
  hideLogo: true,
  brandColor: true,
  accentColor: true,
  accentButtonColor: true,
  welcomeMessage: true,
  privacyPolicyUrl: true,
  defaultLanguage: true,
} as const;

/** The team's default brand row, as served by GET /api/teams/[teamId]/branding. */
export const findDefaultBrand = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { defaultBrandId: true },
  });

  if (team?.defaultBrandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: team.defaultBrandId, teamId },
    });
    if (brand) return brand;
  }

  return prisma.brand.findFirst({
    where: { teamId },
    orderBy: { createdAt: "asc" },
  });
};

/**
 * Creates or updates the team's default brand and keeps `Team.defaultBrandId`
 * pointing at it, so a team that never had a brand gets one on first save.
 */
export const persistDefaultBrand = async ({
  teamId,
  create,
  update,
}: {
  teamId: string;
  create: Prisma.BrandUncheckedCreateInput;
  update: Prisma.BrandUncheckedUpdateInput;
}) => {
  const existing = await findDefaultBrand(teamId);

  if (existing) {
    return prisma.brand.update({
      where: { id: existing.id },
      data: update,
    });
  }

  const brand = await prisma.brand.create({
    data: { ...create, teamId },
  });

  await prisma.team.update({
    where: { id: teamId },
    data: { defaultBrandId: brand.id },
  });

  return brand;
};
