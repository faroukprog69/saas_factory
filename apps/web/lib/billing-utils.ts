// apps/web/lib/billing-utils.ts
export function getPlanFromPriceId(priceId: string | null): string {
  const prices = {
    price_123_pro: "pro",
    price_456_enterprise: "enterprise",
  };
  return priceId ? prices[priceId as keyof typeof prices] || "free" : "free";
}
