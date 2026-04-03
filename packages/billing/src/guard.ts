import type { ServiceResult } from "@faroukprog69/types";

export type PlanConfig = {
  name: string;
  features: string[];
  quota?: Record<string, number>;
};

export type PlansConfig = Record<string, PlanConfig>;

export function checkEntitlement(
  subscription: any,
  plansConfig: PlansConfig,
  featureName: string,
): ServiceResult<boolean> {
  if (!subscription || subscription.status !== "active") {
    return {
      ok: true,
      data: false,
    };
  }

  // ✅ Single source of truth: direct lookup by priceId
  const plan = plansConfig[subscription.priceId];

  if (!plan) {
    return {
      ok: true,
      data: false,
    };
  }

  // ✅ Safe feature check
  const hasFeature = plan.features?.includes(featureName) ?? false;

  return {
    ok: true,
    data: hasFeature,
  };
}
