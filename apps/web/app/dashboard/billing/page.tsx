import { createTeamSubscription } from "@/actions/billing";

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;

  async function handleSubscribe(formData: FormData) {
    "use server";

    const teamId = formData.get("teamId") as string;
    const email = formData.get("email") as string;

    if (!teamId) {
      throw new Error("Team ID is required");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    // الـ Action الآن هو المسؤول عن تمرير الروابط لـ Stripe
    await createTeamSubscription(teamId, email);
  }

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">اختر خطتك</h1>
      <p className="text-gray-500 mb-8">اشترك الآن للحصول على مميزات الـ Pro</p>

      {/* عرض رسالة نجاح إذا عاد المستخدم من Stripe بنجاح */}
      {params.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 max-w-md mx-auto">
          تم الاشتراك بنجاح! شكراً لك.
        </div>
      )}

      {/* عرض رسالة تنبيه إذا ألغى المستخدم العملية */}
      {params.canceled && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 max-w-md mx-auto">
          تم إلغاء عملية الدفع، يمكنك المحاولة مرة أخرى.
        </div>
      )}

      <div className="border p-6 rounded-xl shadow-sm w-80 mx-auto">
        <h2 className="text-xl font-semibold">الخطة الاحترافية</h2>
        <p className="text-4xl font-bold my-4">
          $20<span className="text-sm">/شهر</span>
        </p>

        <form action={handleSubscribe} className="space-y-4">
          <input
            type="text"
            name="teamId"
            placeholder="أدخل Team ID"
            required
            className="w-full border px-4 py-2 rounded-lg text-black"
          />

          <input
            type="email"
            name="email"
            placeholder="أدخل Email"
            required
            className="w-full border px-4 py-2 rounded-lg text-black"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full font-medium"
          >
            اشترك الآن
          </button>
        </form>
      </div>
    </div>
  );
}
