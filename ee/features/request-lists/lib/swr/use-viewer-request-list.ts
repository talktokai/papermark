/**
 * Viewer-side state for the dataroom request list.
 *
 * Stub replacement: the upstream repository imports this hook but does not
 * publish it. Callers destructure `enabled` to decide whether to render the
 * request-list button/sheet and whether to track viewer uploads; returning
 * false keeps those paths off.
 */
export type ViewerRequestListState = {
  enabled: boolean;
};

export const useViewerRequestList = (_params: {
  linkId?: string;
  dataroomId?: string;
  viewerId?: string;
  isPreview?: boolean;
}): ViewerRequestListState => {
  return { enabled: false };
};
