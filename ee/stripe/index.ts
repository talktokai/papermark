import Stripe from "stripe";

// The installed SDK's types are generated for this API version. Papermark
// pins an older one on purpose (changing it changes Stripe's runtime
// behaviour, not just these types), so the pin is cast to satisfy the
// generated signature.
const STRIPE_TYPES_API_VERSION = "2026-06-24.dahlia";

const stripeConfig = {
  // Pinned deliberately: changing the API version changes Stripe's runtime
  // behaviour, not just these types. The installed SDK's types are generated
  // for a newer version, so the pin is cast rather than bumped.
  apiVersion: "2024-06-20" as unknown as typeof STRIPE_TYPES_API_VERSION,
  appInfo: {
    name: "Papermark.io",
    version: "0.1.0",
  },
  typescript: true as const,
};

/**
 * Stripe clients, constructed on first use.
 *
 * The SDK's constructor throws when the secret key is missing or empty, and
 * Next evaluates route modules while collecting page data during
 * `next build`. Clients built at module scope therefore break the build of
 * any deployment without Stripe keys — including self-hosted ones that never
 * take payments. Deferring construction keeps the build free of that
 * requirement while still failing at the point a billing route is called.
 */
let stripeOld: Stripe | null = null;
let stripeNew: Stripe | null = null;

export const stripeInstance = (account: boolean = false): Stripe => {
  if (account) {
    if (!stripeOld) {
      stripeOld = new Stripe(
        process.env.STRIPE_SECRET_KEY_LIVE_OLD ??
          process.env.STRIPE_SECRET_KEY_OLD ??
          "",
        stripeConfig,
      );
    }
    return stripeOld;
  }

  if (!stripeNew) {
    stripeNew = new Stripe(
      process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? "",
      stripeConfig,
    );
  }
  return stripeNew;
};

export async function cancelSubscription(
  customer?: string,
  isOldAccount: boolean = false,
) {
  if (!customer) return;

  try {
    const stripe = stripeInstance(isOldAccount);
    const subscriptionId = await stripe.subscriptions
      .list({
        customer,
      })
      .then((res) => res.data[0].id);

    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: "Customer deleted their Papermark instance.",
      },
    });
  } catch (error) {
    return;
  }
}
