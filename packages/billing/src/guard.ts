import type { ServiceResult } from "./types";

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

  const plan = Object.values(plansConfig).find(
    (p) => p.name.toLowerCase() === subscription.priceId?.toLowerCase(),
  );

  const hasFeature =
    plansConfig[subscription.priceId]?.features.includes(featureName);

  return {
    ok: true,
    data: !!hasFeature,
  };
}
