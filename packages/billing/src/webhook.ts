// packages/billing/src/webhook.ts
import { Stripe } from "stripe";
import { eq } from "drizzle-orm";
import type { DBInstance } from "./types";
import type { ServiceResult } from "@faroukprog69/types";
import { AppError } from "@faroukprog69/errors";

export async function handleStripeWebhook<
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
>(params: {
  payload: string;
  signature: string;
  stripe: Stripe;
  webhookSecret: string;
  db: DBInstance<any, TFullSchema>;
  subscriptionTable: any;
}): Promise<ServiceResult<{ received: boolean }>> {
  const { payload, signature, stripe, webhookSecret, db, subscriptionTable } =
    params;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return {
      ok: false,
      error: new AppError({
        code: "WEBHOOK_ERROR",
        message: `Webhook Error: ${err.message}`,
      }),
    };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const targetId = session.metadata?.targetId;
      const stripeSubscriptionId = session.subscription as string;

      if (!targetId || !stripeSubscriptionId) break;

      const subDetail =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      const firstItem = subDetail.items?.data?.[0];
      const periodEnd = firstItem?.current_period_end;
      const priceId = firstItem?.price.id;

      if (!periodEnd || !priceId) {
        return {
          ok: false,
          error: new AppError({
            code: "INVALID_SUBSCRIPTION",
            message: "Invalid subscription details",
          }),
        };
      }

      const periodEndDate = new Date(periodEnd * 1000);

      await db
        .insert(subscriptionTable)
        .values({
          id: crypto.randomUUID(),
          targetId: targetId,
          stripeSubscriptionId: stripeSubscriptionId,
          stripeCustomerId: session.customer as string,
          stripePriceId: priceId,
          status: "active",
          currentPeriodEnd: periodEndDate,
        })
        .onConflictDoUpdate({
          target: subscriptionTable.targetId,
          set: {
            status: "active",
            stripePriceId: priceId,
            currentPeriodEnd: periodEndDate,
          },
        });

      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const targetId = stripeSub.metadata?.targetId;

      const firstItem = stripeSub.items?.data?.[0];
      const priceId = firstItem?.price.id;
      const periodEnd = firstItem?.current_period_end;

      if (!targetId || !priceId || !periodEnd) break;

      const periodEndDate = new Date(periodEnd * 1000);

      await db
        .update(subscriptionTable)
        .set({
          status: stripeSub.status,
          stripePriceId: priceId,
          currentPeriodEnd: periodEndDate,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        })
        .where(eq(subscriptionTable.targetId, targetId));
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const targetId = stripeSub.metadata?.targetId;

      if (!targetId) break;

      await db
        .update(subscriptionTable)
        .set({
          status: "canceled",
          currentPeriodEnd: new Date(),
        })
        .where(eq(subscriptionTable.targetId, targetId));
      break;
    }
  }

  return { ok: true, data: { received: true } };
}
