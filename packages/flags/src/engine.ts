import { murmurhash } from "./murmurhash";
import { FlagContext, FlagRule } from "./types";

const MAX_UINT_32 = 4294967295;

export class FlagEngine {
  private static isWithinPercentage(
    flagKey: string,
    targetId: string,
    percentage?: number,
  ) {
    if (percentage === undefined || percentage === null) return true;
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    const hash = murmurhash(`${flagKey}-${targetId}`);
    return hash / MAX_UINT_32 < percentage / 100;
  }

  static evaluate(
    flag: {
      key: string;
      rules: FlagRule | null;
      defaultValue: string;
      type: string;
    },
    context: FlagContext,
    overrideValue?: string,
  ) {
    // أولوية 1: إذا كان هناك Override يدوي
    if (overrideValue !== undefined) {
      return this.parseValue(overrideValue, flag.type);
    }

    const { rules } = flag;
    if (!rules) return this.parseValue(flag.defaultValue, flag.type);

    // أولوية 2: فحص المستخدمين المحددين (Whitelist)
    if (context.userId && rules.users?.includes(context.userId)) {
      return this.parseValue("true", flag.type); // أو القيمة المخصصة
    }

    // أولوية 3: فحص الأدوار (Roles)
    if (context.userRole && rules.roles?.includes(context.userRole)) {
      return this.parseValue("true", flag.type);
    }

    // أولوية 4: فحص الخطط والحدود (Plans & Quotas)
    if (
      context.planId &&
      rules.plans &&
      rules.plans[context.planId] !== undefined
    ) {
      const planValue = rules.plans[context.planId];
      // إذا كان boolean
      if (typeof planValue === "boolean") return planValue;
      // إذا كان numeric (Limit)
      return planValue;
    }

    // أولوية 5: فحص النسبة المئوية (Rollout)
    const targetId = context.teamId || context.userId;
    if (targetId && rules.percentage !== undefined) {
      if (!this.isWithinPercentage(flag.key, targetId, rules.percentage)) {
        return this.parseValue(flag.defaultValue, flag.type);
      }
    }

    // العودة للقيمة الافتراضية
    return this.parseValue(flag.defaultValue, flag.type);
  }

  private static parseValue(value: string, type: string) {
    if (type === "boolean") return value === "true";
    if (type === "numeric") return Number(value);
    return value;
  }
}
