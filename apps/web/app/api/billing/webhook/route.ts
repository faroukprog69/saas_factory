import { headers } from "next/headers";
import { billingService } from "@/lib/billing";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature")!;
  const result = await billingService.handleWebhook(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (!result.ok) {
    return new Response(result.error.message, { status: 400 });
  }

  return new Response(JSON.stringify(result.data), { status: 200 });
}
