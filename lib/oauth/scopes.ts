/**
 * API token scope vocabulary.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. Both lists are pinned by published code:
 *
 *   - The preset names and their precedence come from the token-creation
 *     handler (pages/api/teams/[teamId]/tokens/index.ts), which normalises to
 *     `apis.all` / `apis.read` and accepts the legacy `full-access` alias.
 *   - The granular names are the `<resource>.<action>` pairs enumerated by
 *     RESOURCE_OPTIONS in components/tokens/scopes.ts, which is the UI that
 *     offers them.
 *
 * These two lists together form the allowlist that handler validates against,
 * so a scope absent here is rejected at token-creation time.
 */
export const PRESET_SCOPES = ["apis.all", "apis.read"] as const;
export type PresetScope = (typeof PRESET_SCOPES)[number];

export const GRANULAR_SCOPES = [
  "documents.read",
  "documents.write",
  "links.read",
  "links.write",
  "datarooms.read",
  "datarooms.write",
  "analytics.read",
  "visitors.read",
] as const;
export type GranularScope = (typeof GRANULAR_SCOPES)[number];

export type Scope = PresetScope | GranularScope;

export const ALL_SCOPES: readonly Scope[] = [
  ...PRESET_SCOPES,
  ...GRANULAR_SCOPES,
];
