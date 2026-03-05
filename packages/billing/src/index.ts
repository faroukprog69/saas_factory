import type { DBInstance } from "./types";
import type { ServiceResult } from "@faroukprog69/types";

import { getBillingSchema } from "./schema";
import { createCheckout, createPortal, getSubscription } from "./service";
import { createStripeInstance } from "./stripe";
import { handleStripeWebhook } from "./webhook";

export type BillingDeps = {
  targetTable: any;
  db: DBInstance<any, any>;
  apiKey: string;
};
export type BillingService = {
  schema: ReturnType<typeof getBillingSchema>;
  stripe: ReturnType<typeof createStripeInstance>;
  handleWebhook: (
    body: string,
    signature: string,
    webhookSecret: string,
  ) => Promise<ServiceResult<any>>;
  createCheckout: (
    targetId: string,
    priceId: string,
    opts: { successUrl: string; cancelUrl: string; customerEmail?: string },
  ) => Promise<ServiceResult<any>>;
  createPortal: (
    targetId: string,
    returnUrl: string,
  ) => Promise<ServiceResult<any>>;
  getSubscription: (targetId: string) => Promise<ServiceResult<any>>;
};
export function createBilling(deps: BillingDeps): BillingService {
  const schema = getBillingSchema(deps.targetTable);
  const stripe = createStripeInstance(deps.apiKey);
  return {
    schema,
    stripe,

    createCheckout: (
      targetId: string,
      priceId: string,
      opts: { successUrl: string; cancelUrl: string; customerEmail?: string },
    ) =>
      createCheckout(
        {
          targetId,
          priceId,
          stripe,
          successUrl: opts.successUrl,
          cancelUrl: opts.cancelUrl,
          customerEmail: opts.customerEmail,
        },
        {
          db: deps.db,
          subscription: schema.subscription,
        },
      ),

    createPortal: (targetId: string, returnUrl: string) =>
      createPortal(
        {
          targetId,
          returnUrl,
          stripe,
        },
        {
          db: deps.db,
          subscription: schema.subscription,
        },
      ),
    getSubscription: (targetId: string) =>
      getSubscription(
        {
          targetId,
        },
        {
          db: deps.db,
          subscription: schema.subscription,
        },
      ),
    handleWebhook: (body: string, signature: string, webhookSecret: string) => {
      return handleStripeWebhook({
        payload: body,
        signature,
        stripe,
        webhookSecret,
        db: deps.db,
        subscriptionTable: schema.subscription,
      });
    },
  };
}

export * from "./types";
export { getBillingSchema } from "./schema";
