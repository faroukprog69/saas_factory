# @faroukprog69/mail

Thin Resend wrapper for sending React Email templates — typed, framework-agnostic, and monorepo-ready.

---

## Why This Exists

Calling Resend directly in application code means scattering `render()` calls, duplicating `from` config, and losing the ability to swap providers later. This package:

- Wraps Resend with a single `createMailClient` factory
- Handles both `html` and `text` rendering from a single React component automatically
- Validates config at construction time (fails loudly, not silently at send time)
- Integrates with `@faroukprog69/errors` so missing config throws a typed `ValidationError`

Use it in any server-side context: API routes, background jobs, webhooks, queue workers.

---

## Installation

```bash
pnpm add @faroukprog69/mail
# or
npm install @faroukprog69/mail
```

**Peer dependencies:** `react >=18`

---

## Quick Start

```typescript
import { createMailClient } from "@faroukprog69/mail";
import { WelcomeEmail } from "@/emails/WelcomeEmail"; // your React Email component

const mail = createMailClient({
  apiKey: process.env.RESEND_API_KEY!,
  from: "Acme <noreply@acme.com>",
});

await mail.send({
  to: "user@example.com",
  subject: "Welcome to Acme!",
  component: <WelcomeEmail name="Sarah" />,
});
```

Both `html` and plain `text` versions are rendered and sent automatically from the same component.

---

## Core Concepts

**`createMailClient`** — factory function. Takes your Resend API key and a default `from` address. Throws a `ValidationError` immediately if `apiKey` is missing — catches misconfiguration at startup, not at runtime.

**`send`** — the only method on the client. Accepts a React component (your email template), renders it via `@react-email/render`, and dispatches via Resend. Returns Resend's raw response.

**React Email components** — your email templates are standard React components. This library has no opinion on how they're built — use `@react-email/components` or write plain JSX.

---

## API Overview

### `createMailClient(config)`

```typescript
const mail = createMailClient({
  apiKey: string, // Resend API key — throws ValidationError if missing
  from: string, // "Name <email@domain.com>" format
});
```

Returns a `MailClient` instance.

---

### `mail.send(options): Promise<ResendResponse>`

| Field       | Type                 | Required | Description                    |
| ----------- | -------------------- | -------- | ------------------------------ |
| `to`        | `string \| string[]` | ✅       | Recipient(s)                   |
| `subject`   | `string`             | ✅       | Email subject line             |
| `component` | `ReactNode`          | ✅       | React Email template to render |

Returns Resend's response object directly. Errors from Resend are not caught — handle them at the call site.

---

## Example Use Case

**Sending emails from a background job after signup:**

```typescript
// lib/mail.ts — instantiate once, reuse everywhere
import { createMailClient } from "@faroukprog69/mail";

export const mail = createMailClient({
  apiKey: process.env.RESEND_API_KEY!,
  from: "Acme <noreply@acme.com>",
});
```

```typescript
// jobs/onboarding.ts
import { mail } from "@/lib/mail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { InviteEmail } from "@/emails/InviteEmail";

async function runOnboardingJob(user: User, invitees: string[]) {
  // Welcome the new user
  await mail.send({
    to: user.email,
    subject: "Welcome to Acme!",
    component: <WelcomeEmail name={user.name} />,
  });

  // Invite their teammates
  await Promise.all(
    invitees.map((email) =>
      mail.send({
        to: email,
        subject: `${user.name} invited you to Acme`,
        component: <InviteEmail inviterName={user.name} teamName={user.teamName} />,
      })
    )
  );
}
```

---

## Folder Structure

```
src/
└── index.ts   # createMailClient, SendEmailOptions, MailClient type
```

---

## Notes & Design Decisions

- **Single file.** The package is intentionally minimal — one factory, one method. Email sending is not a complex domain; the value is in the consistent interface and monorepo integration, not abstraction.
- **`from` is fixed at client creation**, not per-send. This enforces a single sending identity per client instance. If you need multiple `from` addresses (transactional vs. marketing), create two clients.
- **Both `html` and `text` are always sent.** `@react-email/render` is called twice per send — once for HTML, once for plain text. This is the correct behavior for deliverability but means 2× render cost per email. For high-volume sends, pre-render and cache.
- **Resend errors bubble up unmodified.** The library does not wrap Resend's error format in `AppError`. Handle Resend-specific errors (rate limits, invalid addresses) at the call site.
- **React 19 in devDependencies, `>=18` as peer.** Compatible with both React 18 and 19 at runtime.
