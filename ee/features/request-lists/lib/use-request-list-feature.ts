/**
 * Feature gate for the dataroom request-list (tasks) feature.
 *
 * Stub replacement: the upstream repository imports this hook but does not
 * publish it. Returning false hides the request-list navigation entries; the
 * rest of the dataroom UI is unaffected.
 */
export const useRequestListFeatureEnabled = (): boolean => {
  return false;
};
