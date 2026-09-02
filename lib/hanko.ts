import { tenant } from "@teamhanko/passkeys-next-auth-provider";

/**
 * Hanko passkey tenant.
 *
 * `PasskeyProvider` reads `tenant.config` synchronously while
 * lib/auth/auth-options.ts is being loaded, and nearly every authenticated
 * route imports that module — so this cannot be deferred behind a proxy, and
 * throwing here breaks `next build` for deployments that don't use passkeys.
 *
 * `tenant()` itself only requires a tenant id (the API key is used per
 * request), so the tenant object is always constructed. When the Hanko
 * variables are unset, the placeholder id below keeps the provider
 * constructible while every actual passkey call fails against a tenant that
 * does not exist — passkey sign-in is simply unavailable, and email and OAuth
 * sign-in are unaffected.
 */
// Compared for truthiness rather than against undefined: NEXT_PUBLIC_* values
// are inlined at build time, so an unset variable arrives as an empty string.
const apiKey = process.env.HANKO_API_KEY || "";
const tenantId = process.env.NEXT_PUBLIC_HANKO_TENANT_ID || "";

export const isPasskeysConfigured = Boolean(apiKey && tenantId);

if (!isPasskeysConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "[hanko] HANKO_API_KEY / NEXT_PUBLIC_HANKO_TENANT_ID are not set; passkey sign-in is disabled.",
  );
}

const hanko = tenant({
  apiKey,
  // A syntactically valid but unroutable id, so `tenant()` can build its URLs.
  tenantId: tenantId || "00000000-0000-0000-0000-000000000000",
});

export default hanko;
