import { LinkUpgradeOptions } from "@/components/links/link-sheet/link-options";

import { DEFAULT_LINK_TYPE } from "@/components/links/link-sheet";

/**
 * Link-sheet form row toggling confidential view for a link.
 *
 * Stub replacement: the upstream repository imports this component but does
 * not publish it. The props mirror the sibling sections it is rendered
 * alongside (see components/links/link-sheet/watermark-section.tsx).
 * Rendering nothing hides the option from the link settings UI; existing
 * links keep whatever value is already stored.
 */
export default function ConfidentialViewSection({
  data: _data,
  setData: _setData,
  isAllowed: _isAllowed,
  handleUpgradeStateChange: _handleUpgradeStateChange,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: (options: LinkUpgradeOptions) => void;
}) {
  return null;
}
