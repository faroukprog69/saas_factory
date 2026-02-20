import Stripe from "stripe";

export const createStripeInstance = (apiKey: string) => {
  return new Stripe(apiKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
};

export const createCheckoutSession = async (
  stripe: Stripe,
  params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    targetId: string;
    metadata?: Record<string, string>;
  },
) => {
  return await stripe.checkout.sessions.create({
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      targetId: params.targetId,
      ...params.metadata,
    },
    subscription_data: {
      metadata: {
        targetId: params.targetId,
        ...params.metadata,
      },
    },
  });
};

export const createBillingPortalSession = async (
  stripe: Stripe,
  params: {
    customerId: string;
    returnUrl: string;
  },
) => {
  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
};
