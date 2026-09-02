import { z } from "zod";

import prisma from "@/lib/prisma";

/**
 * Subject type of an API key, and revocation of the user-bound ones.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. The semantics come from the schema comment on
 * `RestrictedToken.subjectType` (prisma/schema/schema.prisma): it is
 * "validated in app code via Zod; 'user' keys are revoked when the owner
 * loses team access, 'machine' keys stay team-scoped".
 */
export const RestrictedTokenSubjectTypeSchema = z
  .enum(["user", "machine"])
  .default("user");

export type RestrictedTokenSubjectType = z.infer<
  typeof RestrictedTokenSubjectTypeSchema
>;

/**
 * Normalises the free-text column into the known union, defaulting to "user" —
 * the stricter of the two, since user keys are the ones that get revoked.
 */
export const parseRestrictedTokenSubjectType = (
  value: unknown,
): RestrictedTokenSubjectType => {
  const parsed = RestrictedTokenSubjectTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "user";
};

/**
 * Deletes the user-bound API keys a departing teammate owns in this team.
 * Machine keys are left alone — they belong to the team, not the person.
 *
 * Returns the Prisma promise unawaited: the caller passes it straight into
 * `prisma.$transaction([...])` (pages/api/teams/[teamId]/remove-teammate.ts),
 * so the deletion commits or rolls back with the rest of the removal.
 */
export const revokeUserBoundTeamTokens = (userId: string, teamId: string) =>
  prisma.restrictedToken.deleteMany({
    where: {
      userId,
      teamId,
      subjectType: "user",
    },
  });
