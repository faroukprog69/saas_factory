````markdown
# @faroukprog69/billing

Stripe subscription billing service for SaaS apps — checkout, portal, webhook handling, and feature entitlement checks wired to any Drizzle target table.

---

## Why This Exists

Every SaaS needs the same Stripe plumbing: create a checkout session, open the billing portal, sync subscription state via webhooks, and gate features by plan. This package ships all of that as a single typed factory that attaches to any entity (team, user, org) via a generic `targetId` — no assumptions about your data model.

Use it when:

- You need Stripe subscriptions attached to teams or users
- You want webhook sync handled and tested in one place
- You need feature/plan gating without a third-party service

---

## Installation

```bash
pnpm add @faroukprog69/billing drizzle-orm stripe
```

---

## Quick Start

```typescript
// lib/billing.ts
import { createBilling } from "@faroukprog69/billing";
import { db } from "./db"; // your @faroukprog69/db instance
import { team } from "./schema"; // the table subscriptions attach to

export const billing = createBilling({
  db,
  apiKey: process.env.STRIPE_SECRET_KEY!,
  targetTable: team,
});

// Merge billing schema into your full DB schema for migrations
export const billingSchema = billing.schema;
```

```typescript
// Create a checkout session for a team
const result = await billing.createCheckout(teamId, priceId, {
  successUrl: "https://app.example.com/billing/success",
  cancelUrl: "https://app.example.com/billing/cancel",
  customerEmail: "owner@example.com",
});

if (result.ok) {
  redirect(result.data); // Stripe checkout URL
}
```

---

## Core Concepts

**`createBilling({ db, apiKey, targetTable })`** — factory that binds Stripe and your DB. Returns a `BillingService` with all methods pre-wired. Call once at module level.

**`targetId`** — the primary key of whatever entity owns the subscription (team, user, org). The subscription table references it via a foreign key. The package never assumes what that entity is.

**Schema is dynamic** — `getBillingSchema(targetTable)` generates the `subscription` table at runtime referencing your target table's `id`. Merge it into your full schema for Drizzle migrations.

**Webhook sync** — `handleWebhook` processes three Stripe events: `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. It upserts subscription state directly from Stripe — your DB is always the source of truth after webhook delivery.

**`ServiceResult<T>`** — every method returns `{ ok: true, data }` or `{ ok: false, error: AppError }`. No throws.

---

## API Overview

### `createBilling(deps)`

```typescript
const billing = createBilling({
  db, // DBInstance
  apiKey: process.env.STRIPE_SECRET_KEY!,
  targetTable: team, // any Drizzle table with an `id` column
});
```

---

### `billing.createCheckout(targetId, priceId, opts)`

Creates a Stripe Checkout session. Auto-creates a Stripe customer if none exists. Blocks if already `active`.

```typescript
const result = await billing.createCheckout(teamId, "price_xxx", {
  successUrl: "https://app.example.com/success",
  cancelUrl: "https://app.example.com/cancel",
  customerEmail: "user@example.com", // optional
});
// result.data → Stripe checkout URL (string)
```

---

### `billing.createPortal(targetId, returnUrl)`

Opens the Stripe Billing Portal for an existing customer to manage their subscription.

```typescript
const result = await billing.createPortal(
  teamId,
  "https://app.example.com/billing",
);
// result.data → Stripe portal URL (string)
```

---

### `billing.getSubscription(targetId)`

Fetches the current subscription from your DB (not Stripe).

```typescript
const result = await billing.getSubscription(teamId);
if (result.ok) {
  const { status, priceId, currentPeriodEnd, isCanceled } = result.data;
}
```

---

### `billing.handleWebhook(body, signature, webhookSecret)`

Verifies and processes a Stripe webhook. Mount in your API route.

```typescript
// app/api/webhooks/stripe/route.ts
import { billing } from "@/lib/billing";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  const result = await billing.handleWebhook(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (!result.ok) return new Response("Webhook error", { status: 400 });
  return new Response(null, { status: 200 });
}
```

**Handled events:**

| Event                           | Effect                                               |
| ------------------------------- | ---------------------------------------------------- |
| `checkout.session.completed`    | Upserts subscription as `active` with price + period |
| `customer.subscription.updated` | Updates status, price, period end, cancel flag       |
| `customer.subscription.deleted` | Sets status to `canceled`                            |

---

### `checkEntitlement(subscription, plansConfig, featureName)`

Checks whether an active subscription includes a named feature.

```typescript
import { checkEntitlement } from "@faroukprog69/billing";

const PLANS = {
  pro: {
    name: "price_pro_monthly",
    features: ["analytics", "custom-domain", "api-access"],
  },
  free: {
    name: "price_free",
    features: ["analytics"],
  },
};

const sub = await billing.getSubscription(teamId);
const result = checkEntitlement(sub.data, PLANS, "api-access");
// result.data → true | false
```

> `subscription.priceId` must match a key in `plansConfig`. See the note below on the current matching behavior.

---

## Example Use Case

**Full subscription flow: checkout → webhook → gate**

```typescript
// 1. User clicks "Upgrade" — create checkout
const checkout = await billing.createCheckout(team.id, "price_pro_monthly", {
  successUrl: `${BASE_URL}/billing/success`,
  cancelUrl: `${BASE_URL}/billing/cancel`,
  customerEmail: user.email,
});
redirect(checkout.data);

// 2. Stripe calls your webhook → subscription saved automatically

// 3. Gate a feature in your API
const sub = await billing.getSubscription(team.id);
const { data: canUseApi } = checkEntitlement(sub.data, PLANS, "api-access");

if (!canUseApi) {
  return Response.json({ error: "Upgrade required" }, { status: 403 });
}

// 4. User wants to manage billing
const portal = await billing.createPortal(team.id, `${BASE_URL}/settings`);
redirect(portal.data);
```

---

## Folder Structure

```
src/
├── index.ts      # createBilling factory + BillingService type
├── service.ts    # createCheckout, createPortal, getSubscription
├── webhook.ts    # handleStripeWebhook — event processing
├── stripe.ts     # createStripeInstance + low-level session helpers
├── schema.ts     # getBillingSchema() — dynamic subscription table
├── guard.ts      # checkEntitlement()
└── types.ts      # DBInstance, BillingDeps, BillingService
```

Two export paths:

- `@faroukprog69/billing` → factory, service, guard, types
- `@faroukprog69/billing/schema` → Drizzle schema for migrations

---

## Notes

- **`targetTable` must have an `id: text` primary key.** The subscription table references it via a cascade foreign key.
- **`billing.stripe`** is exposed on the returned service if you need direct Stripe API access beyond what the service provides.
- **Webhook endpoint must receive the raw body** (`req.text()`), not parsed JSON. Stripe signature verification will fail on a parsed body.
- **`getSubscription` reads from your DB, not Stripe.** It reflects whatever state the last webhook delivered. If a webhook is missed, the DB may lag behind Stripe.

---
````
