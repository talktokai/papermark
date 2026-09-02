/**
 * Referrals / partner program gate.
 *
 * The upstream repository ships the `/partners` UI references but not this
 * module, so the app fails to build without it. The program is powered by Dub
 * partners; treat it as enabled only when the Dub credentials are configured.
 */
export const isReferralsEnabled = (): boolean => {
  return !!process.env.NEXT_PUBLIC_REFERRALS_ENABLED;
};
