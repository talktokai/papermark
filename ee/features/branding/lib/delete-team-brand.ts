import prisma from "@/lib/prisma";
import { clearCachedBrandLogo } from "@/lib/redis/brand-logo-cache";

/**
 * Deletes a team brand and clears the state that points at it.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. Callers pass the brand row they already loaded (see
 * pages/api/teams/[teamId]/branding.ts and .../brands/[brandId]/index.ts) and
 * expect the cached logo to be dropped alongside it. `Team.defaultBrandId`
 * and `Link.brandId` are SetNull relations in the schema, so the database
 * clears those references on delete; the team default is re-pointed at a
 * remaining brand when one exists.
 */
export const deleteTeamBrand = async ({
  teamId,
  brand,
}: {
  teamId: string;
  brand: { id: string };
}) => {
  await prisma.brand.delete({ where: { id: brand.id } });

  const remaining = await prisma.brand.findFirst({
    where: { teamId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  await prisma.team.update({
    where: { id: teamId },
    data: { defaultBrandId: remaining?.id ?? null },
  });

  await clearCachedBrandLogo(teamId);
};
