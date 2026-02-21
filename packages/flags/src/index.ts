import { eq, and, or } from "drizzle-orm";
import { FlagEngine } from "./engine";
import { featureFlags, flagOverrides } from "./schema";
import { FlagContext, DBInstance } from "./types";

export interface FlagClientConfig {
  db: DBInstance<any, any>;
}

export type FlagClient = ReturnType<typeof createFlagClient>;

export const createFlagClient = (config: FlagClientConfig) => {
  const { db } = config;

  return {
    /**
     * التحقق مما إذا كانت الميزة مفعلة
     */
    isEnabled: async (key: string, context: FlagContext): Promise<boolean> => {
      const result = await evaluateFlag(db, key, context);
      return !!result;
    },

    /**
     * الحصول على قيمة رقمية (مثل حدود الاستخدام)
     */
    getLimit: async (key: string, context: FlagContext): Promise<number> => {
      const result = await evaluateFlag(db, key, context);
      return Number(result);
    },

    /**
     * الحصول على قيمة نصية (للـ A/B Testing)
     */
    getVariant: async (key: string, context: FlagContext): Promise<string> => {
      const result = await evaluateFlag(db, key, context);
      return String(result);
    },
  };
};

/**
 * وظيفة داخلية لجلب البيانات من الـ DB وتشغيل المحرك
 */
async function evaluateFlag(db: any, key: string, context: FlagContext) {
  // 1. جلب الـ Flag والـ Override في وقت واحد لتقليل الطلبات
  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(and(eq(featureFlags.key, key), eq(featureFlags.isActive, true)))
    .limit(1);

  if (!flag) return null;

  // 2. البحث عن Overrides لهذا الـ Flag
  let overrideValue: string | undefined;

  const conditions = [];
  if (context.userId) {
    conditions.push(
      and(
        eq(flagOverrides.targetType, "user"),
        eq(flagOverrides.targetId, context.userId),
      ),
    );
  }
  if (context.teamId) {
    conditions.push(
      and(
        eq(flagOverrides.targetType, "team"),
        eq(flagOverrides.targetId, context.teamId),
      ),
    );
  }

  if (conditions.length > 0) {
    const [override] = await db
      .select()
      .from(flagOverrides)
      .where(and(eq(flagOverrides.flagKey, key), or(...conditions)))
      .limit(1);

    if (override) overrideValue = override.value;
  }

  // 3. استخدام المحرك لتقييم النتيجة
  return FlagEngine.evaluate(
    {
      key: flag.key,
      rules: flag.rules as any,
      defaultValue: flag.defaultValue,
      type: flag.type,
    },
    context,
    overrideValue,
  );
}
