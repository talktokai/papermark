import type { Rotation } from "@/lib/hooks/use-fullscreen";

/**
 * Visual overlay rendered on top of a document when confidential view is on.
 *
 * Stub replacement: the upstream repository imports this component but does
 * not publish it. Rendering nothing leaves the viewer unchanged; callers
 * already gate it behind the link's `confidentialViewEnabled` flag, so a link
 * with the option set simply shows no overlay.
 *
 * `navbarAbove` and `rotation` are passed by the paged viewers
 * (components/view/viewer/pages-horizontal-viewer.tsx and
 * pages-vertical-viewer.tsx) to position the overlay against the current page.
 */
export function ConfidentialViewOverlay(_props: {
  navbarAbove?: boolean;
  rotation?: Rotation;
}) {
  return null;
}

export default ConfidentialViewOverlay;
