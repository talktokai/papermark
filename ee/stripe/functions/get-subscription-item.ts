import Stripe from "stripe";

import { stripeInstance } from "..";

export interface SubscriptionDiscount {
  couponId: string;
  percentOff?: number;
  amountOff?: number;
  duration: string;
  durationInMonths?: number;
  valid: boolean;
  end?: number;
}

export default async function getSubscriptionItem(
  subscriptionId: string,
  isOldAccount: boolean,
) {
  const stripe = stripeInstance(isOldAccount);
  // Stripe SDK v22 replaced the singular `discount` with a `discounts` array
  // whose entries are ids unless expanded.
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discounts.source.coupon"],
  });
  const subscriptionItem = subscription.items.data[0];

  // Extract discount information if available. Papermark applies at most one
  // subscription-level discount, so the first expanded entry is the one.
  let discount: SubscriptionDiscount | null = null;
  // v22 also moved the coupon behind `source`, expandable via
  // `discounts.source.coupon`.
  const appliedDiscount = subscription.discounts?.find(
    (entry): entry is Stripe.Discount =>
      typeof entry !== "string" &&
      !!entry.source?.coupon &&
      typeof entry.source.coupon !== "string",
  );
  const coupon =
    appliedDiscount && typeof appliedDiscount.source.coupon !== "string"
      ? appliedDiscount.source.coupon
      : null;
  if (appliedDiscount && coupon) {
    discount = {
      couponId: coupon.id,
      percentOff: coupon.percent_off || undefined,
      amountOff: coupon.amount_off || undefined,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months || undefined,
      valid: coupon.valid,
      end: appliedDiscount.end || undefined,
    };
  }

  return {
    id: subscriptionItem.id,
    // Stripe SDK v22 moved the billing period from the subscription onto
    // each subscription item; Papermark bills a single item per subscription.
    currentPeriodStart: subscriptionItem.current_period_start,
    currentPeriodEnd: subscriptionItem.current_period_end,
    discount,
  };
}
