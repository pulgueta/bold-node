---
name: bold-webhooks
description: Receive and verify Bold (Colombia) payment webhooks with @pulgueta/bold across Next.js, TanStack Start, Express, and Hono. Use when building a webhook endpoint for Bold events (SALE_APPROVED, SALE_REJECTED, VOID_APPROVED, VOID_REJECTED).
---

# Bold webhooks with @pulgueta/bold

Bold POSTs CloudEvents-style JSON to your endpoint and signs each request with
`x-bold-signature` = hex HMAC-SHA256 of the **Base64-encoded raw body** using the
secret key of the integration that produced the payment. Your endpoint must:

1. Read the **raw** body (not a re-serialized JSON object — the signature is over exact bytes).
2. Verify the signature.
3. Respond `200` within ~2 seconds (Bold retries at 15m, 1h, 4h, 8h, 24h).
4. Be idempotent on `data.payment_id` (duplicates happen).

In sandbox the signing key is the empty string `""`.

## Signing key selection

Bold signs with the **API Datáfono** key for API Integrations payments and the
**Payment Button** key otherwise. Configure the SDK's `secretKey` to the one you
expect, or pass `secretKey` per handler. The empty-string sandbox key is handled
automatically when your configured secret is `""`.

## Framework adapters (recommended)

Each adapter is a thin, tested wrapper that reads the raw body, verifies the
signature, parses the event, and maps failures to status codes (401 invalid
signature, 400 bad JSON, 500 handler error, 200 ok).

### Next.js (App Router)

```ts
// app/api/bold/webhook/route.ts
import { Bold } from "@pulgueta/bold";
import { createBoldWebhookRoute } from "@pulgueta/bold/next";

const bold = new Bold({
  identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY!,
  secretKey: process.env.BOLD_PAYMENT_BUTTON_SECRET_KEY
});

export const POST = createBoldWebhookRoute(bold, {
  onEvent: async (event) => {
    if (event.type === "SALE_APPROVED") {
      // fulfil the order; event.data.payment_id, event.data.metadata?.reference
    }
  }
});
```

### TanStack Start

```ts
import { createServerFileRoute } from "@tanstack/react-start/server";
import { Bold } from "@pulgueta/bold";
import { createBoldWebhookHandler } from "@pulgueta/bold/tanstack";

const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
const handler = createBoldWebhookHandler(bold, {
  onEvent: (event) => console.log(event.type, event.data.payment_id)
});

export const ServerRoute = createServerFileRoute().methods({ POST: handler });
```

### Hono

```ts
import { Hono } from "hono";
import { Bold } from "@pulgueta/bold";
import { boldWebhook } from "@pulgueta/bold/hono";

const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
const app = new Hono();
app.post("/webhook/bold", boldWebhook(bold, { onEvent: (e) => console.log(e.type) }));
```

### Express 5

Mount a raw body parser so the signature is verified over exact bytes:

```ts
import express from "express";
import { Bold } from "@pulgueta/bold";
import { boldWebhookHandler } from "@pulgueta/bold/express";

const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
const app = express();
app.post(
  "/webhook/bold",
  express.raw({ type: () => true }),
  boldWebhookHandler(bold, { onEvent: (e) => console.log(e.type) })
);
```

## Manual verification (any framework)

```ts
import { verifyWebhookSignature, parseWebhookPayload } from "@pulgueta/bold";
// or bold.webhooks.verify / bold.webhooks.parse

const result = verifyWebhookSignature(rawBody, signatureHeader, secretKey);
if (!result.valid) return new Response(result.error, { status: 401 });
const event = parseWebhookPayload(rawBody);
```

## Fallback lookup (use sparingly)

If a webhook was missed, actively query the last notification:

```ts
const [error, data] = await bold.webhooks.getNotifications(paymentId);
// or by your reference: getNotifications(reference, { isExternalReference: true })
```
