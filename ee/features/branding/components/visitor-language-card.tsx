import type { Dispatch, SetStateAction } from "react";

import type { SupportedLocaleCode } from "@/lib/i18n/locales";

/**
 * Picker for the default viewer-facing language of a dataroom.
 *
 * Stub replacement: the upstream repository imports this but does not publish
 * it. The stored `defaultLanguage` is still applied by the viewer; without
 * this card it stays at whatever value is saved (English by default).
 */
export function VisitorLanguageCard(_props: {
  defaultLanguage: SupportedLocaleCode;
  onDefaultLanguageChange: Dispatch<SetStateAction<SupportedLocaleCode>>;
  hasAccess: boolean;
}) {
  return null;
}

export default VisitorLanguageCard;
