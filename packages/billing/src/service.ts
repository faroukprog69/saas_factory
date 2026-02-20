import { Stripe } from "stripe";
import type { DBInstance, ServiceResult } from "./types";
import { eq } from "drizzle-orm";

/**
 * 1. إنشاء جلسة الدفع (Checkout)
 */
export async function createCheckout<
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
>(
  stripeConfig: {
    targetId: string;
    priceId: string;
    stripe: Stripe;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
  },
  dbConfig: {
    db: DBInstance<any, TFullSchema>;
    subscription: any;
  },
): Promise<ServiceResult<string>> {
  if (!stripeConfig.targetId || !stripeConfig.priceId) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    };
  }
  return dbConfig.db.transaction(async (tx: any) => {
    const sub = await tx.query.subscription.findFirst({
      where: eq(dbConfig.subscription.targetId, stripeConfig.targetId),
    });

    if (sub?.status === "active") {
      return {
        ok: false,
        error: {
          code: "INVALID_ACTION",
          message: "You are already subscribed",
        },
      };
    }

    let stripeCustomerId = sub?.stripeCustomerId;

    // إذا لم يكن له حساب في سترايب، ننشئ واحدًا جديدًا
    if (!stripeCustomerId) {
      const customer = await stripeConfig.stripe.customers.create({
        email: stripeConfig.customerEmail,
        metadata: { targetId: stripeConfig.targetId },
      });
      stripeCustomerId = customer.id;
    }

    // إنشاء الجلسة
    const session = await stripeConfig.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: stripeConfig.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
      metadata: { targetId: stripeConfig.targetId },
      subscription_data: { metadata: { targetId: stripeConfig.targetId } },
    });
    if (!session || !session.url) {
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create checkout session",
        },
      };
    }

    return {
      ok: true,
      data: session.url,
    };
  });
}

/**
 * 2. إنشاء بوابة الإدارة (Billing Portal)
 */
export const createPortal = async <
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
>(
  stripeConfig: {
    targetId: string;
    returnUrl: string;
    stripe: Stripe;
  },
  dbConfig: {
    db: DBInstance<any, TFullSchema>;
    subscription: any;
  },
): Promise<ServiceResult<string>> => {
  if (!stripeConfig.targetId || !stripeConfig.returnUrl) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    };
  }

  return dbConfig.db.transaction(async (tx: any) => {
    const sub = await tx.query.subscription.findFirst({
      where: eq(dbConfig.subscription.targetId, stripeConfig.targetId),
    });

    if (!sub?.stripeCustomerId) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Subscription not found" },
      };
    }

    const portalSession =
      await stripeConfig.stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: stripeConfig.returnUrl,
      });

    return {
      ok: true,
      data: portalSession.url,
    };
  });
};

/**
 * 3. جلب بيانات الاشتراك الحالية
 */
export const getSubscription = async <
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
>(
  stripeConfig: {
    targetId: string;
  },
  dbConfig: {
    db: DBInstance<any, TFullSchema>;
    subscription: any;
  },
): Promise<ServiceResult<any>> => {
  if (!stripeConfig.targetId) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    };
  }

  return dbConfig.db.transaction(async (tx: any) => {
    const data = await tx.query.subscription.findFirst({
      where: eq(dbConfig.subscription.targetId, stripeConfig.targetId),
    });

    if (!data)
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Subscription not found" },
      };

    return {
      ok: true,
      data: {
        status: data.status,
        priceId: data.stripePriceId,
        currentPeriodEnd: data.currentPeriodEnd,
        isCanceled: data.cancelAtPeriodEnd,
      },
    };
  });
};
