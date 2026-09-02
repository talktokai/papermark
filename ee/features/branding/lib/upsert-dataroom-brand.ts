import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Writes a dataroom's own brand and detaches it from the inherited team brand.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. Saving a dataroom-specific brand means the dataroom no longer inherits,
 * so `Dataroom.brandId` (the base-brand pointer) is cleared in the same
 * transaction — the condition `inheritsTeamBrand` reads back.
 */
export const upsertDataroomBrandAndClearInherited = async ({
  dataroomId,
  data,
}: {
  dataroomId: string;
  /** Passed by the caller for symmetry with the team branding route; the
   *  dataroom already scopes the brand, so it is not written. */
  teamId?: string;
  data: Omit<Prisma.DataroomBrandUncheckedCreateInput, "dataroomId">;
}) => {
  return prisma.$transaction(async (tx) => {
    const brand = await tx.dataroomBrand.upsert({
      where: { dataroomId },
      create: { ...data, dataroomId },
      update: data,
    });

    await tx.dataroom.update({
      where: { id: dataroomId },
      data: { brandId: null },
    });

    return brand;
  });
};
