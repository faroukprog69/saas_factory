"use server";
import { billingService } from "@/lib/billing";
import { redirect } from "next/navigation";

export async function createTeamSubscription(teamId: string, email: string) {
  // 1. جلب بيانات الاشتراك الحالية للفريق من قاعدة البيانات
  const subscriptionResult = await billingService.getSubscription(teamId);

  // 2. إذا كان مشتركاً بالفعل وحالة الاشتراك "active"
  if (
    subscriptionResult.ok &&
    subscriptionResult.data &&
    subscriptionResult.data.status === "active"
  ) {
    // بدلاً من الدفع مرة أخرى، نوجهه لصفحة الإدارة (Billing Portal) لتعديل اشتراكه
    const portal = await billingService.createPortal(
      teamId,
      "http://localhost:3000/dashboard/billing",
    );

    if (portal.ok && portal.data) {
      redirect(portal.data);
    }
    return;
  }

  // 3. إذا لم يكن مشتركاً، نفتح له صفحة الدفع
  const checkoutResult = await billingService.createCheckout(
    teamId,
    process.env.STRIPE_PRO_PRICE_ID!,
    {
      successUrl: "http://localhost:3000/dashboard/billing?success=true",
      cancelUrl: "http://localhost:3000/dashboard/billing?canceled=true",
      customerEmail: "test@example.com",
    },
  );

  if (checkoutResult.ok && checkoutResult.data) {
    redirect(checkoutResult.data);
  }
}
