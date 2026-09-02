/**
 * Whether a user may auto-provision teams on the `datarooms-unlimited` plan.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. Upstream it grants the unlimited plan to admins of an existing
 * unlimited subscription (see pages/api/teams/index.ts). Self-hosted
 * deployments have no such subscription, so this denies the automatic upgrade
 * and new teams are created on the default plan.
 */
export const canCreateUnlimitedTeam = async (
  _userId: string,
): Promise<boolean> => {
  return false;
};
