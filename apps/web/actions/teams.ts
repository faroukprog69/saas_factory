"use server";

// apps/web/actions/teams.ts
import { flags } from "@/lib/flags";
import { db } from "@/lib/db";
import { eq, count, and, not } from "drizzle-orm";
import { team, subscription, teamMember } from "@/lib/schema";
import { getPlanFromPriceId } from "@/lib/billing-utils";

export async function inviteMember(teamId: string, email: string) {
  // 1. جلب بيانات الفريق والاشتراك
  const teamWithSub = await db
    .select()
    .from(team)
    .leftJoin(subscription, eq(subscription.targetId, team.id))
    .where(eq(team.id, teamId))
    .limit(1);

  const teamRow = teamWithSub[0];

  if (!teamRow) {
    return { error: "Team not found" };
  }

  // 2. فحص هل ميزة "إدارة الأعضاء" مفعلة أصلاً لهذا الفريق/الخطة
  // نستخدم نفس المفتاح max_team_members كـ Boolean Flag هنا
  const canManageMembers = await flags.isEnabled("max_team_members", {
    teamId,
  });

  if (!canManageMembers) {
    return {
      error: "ميزة إضافة الأعضاء غير متاحة في خطتك الحالية أو معطلة مؤقتاً.",
    };
  }

  // 3. حساب عدد الأعضاء الحاليين (باستثناء المالك Owner)
  const [memberCountRes] = await db
    .select({ value: count() })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        not(eq(teamMember.userId, teamRow.team.ownerId)),
      ),
    );

  const currentMembersCount = memberCountRes?.value ?? 0;

  // 4. تحديد الخطة (Plan Mapping)
  const stripePriceId = teamRow.subscription?.stripePriceId ?? null;
  const planId = stripePriceId ? getPlanFromPriceId(stripePriceId) : "free";

  // 5. جلب الحد الرقمي المسموح به من الـ Flags
  const maxAllowed = await flags.getLimit("max_team_members", {
    teamId,
    planId,
  });

  // 6. التحقق من تجاوز الحد
  if (currentMembersCount >= maxAllowed) {
    return {
      error: `لقد وصلت للحد الأقصى (${maxAllowed} أعضاء). يرجى الترقية لخطة PRO لإضافة المزيد.`,
    };
  }

  // --- سيتم وضع كود إرسال الإيميل (Mail Package) هنا لاحقاً ---

  return {
    success: true,
    message: `تم التحقق بنجاح. سيتم إرسال الدعوة إلى ${email} قريباً.`,
  };
}
