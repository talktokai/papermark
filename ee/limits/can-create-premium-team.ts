/**
 * Team-count eligibility for `datarooms-premium` admins.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. Upstream it lets admins of a premium subscription provision
 * their own teams, capped at PREMIUM_TEAM_LIMIT. Self-hosted deployments have
 * no such subscription, so `isPremiumAdmin` is false and no automatic upgrade
 * is granted; `pages/api/teams/index.ts` then creates the team on the default
 * plan without hitting the 403 limit branch.
 */
export const PREMIUM_TEAM_LIMIT = 5;

export type PremiumTeamEligibility = {
  isPremiumAdmin: boolean;
  canCreate: boolean;
};

export const getPremiumTeamEligibility = async (
  _userId: string,
): Promise<PremiumTeamEligibility> => {
  return { isPremiumAdmin: false, canCreate: false };
};
