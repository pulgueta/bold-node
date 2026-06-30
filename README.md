# Bold Node.js SDK

[![npm](https://img.shields.io/npm/v/@pulgueta/bold.svg)](https://www.npmjs.com/package/@pulgueta/bold)

ESM Node.js SDK for the [Bold](https://bold.co) payments API (Colombia). Covers
**App Integrations (datáfono/POS)**, the **Online Payments API** (cards, PSE,
Nequi, Botón Bancolombia, QR Bre‑B), **payment links**, **transaction status**,
and **webhooks** — plus thin **framework adapters** for Next.js, TanStack Start,
Express, and Hono.

- Result‑tuple API (`[error, data]`) — nothing throws.
- Runtime response validation with `zod`.
- Per‑surface credentials, timeouts, retries, idempotency keys, and `AbortSignal`.

```bash
npm i @pulgueta/bold zod
# pnpm add @pulgueta/bold zod · bun add @pulgueta/bold zod
```

## Credentials

Each Bold integration surface has its **own** identity + secret key pair in the
dashboard (panel.bold.co › Integraciones › Llaves de integración) — they are
**different values**. Provide a primary key and override per surface as needed.
See [`.env.example`](./.env.example).

```ts
import { Bold } from "@pulgueta/bold";

export const bold = new Bold({
  // Default identity/secret used by every surface without an override:
  identityKey: process.env.BOLD_API_INTEGRATIONS_IDENTITY_KEY!,
  secretKey: process.env.BOLD_API_INTEGRATIONS_SECRET_KEY,
  environment: "sandbox", // or "production" — chosen by the key, not the URL

  // Optional per‑surface overrides:
  paymentButton: {
    identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY,
    secretKey: process.env.BOLD_PAYMENT_BUTTON_SECRET_KEY
  },
  online: {
    identityKey: process.env.BOLD_ONLINE_IDENTITY_KEY,
    secretKey: process.env.BOLD_ONLINE_SECRET_KEY
  }
});
```

| Resource | Surface | Key used |
| --- | --- | --- |
| `bold.payments`, `bold.terminals` | App Integrations (datáfono) | `apiIntegrations` |
| `bold.links` | API Link de pagos | `paymentButton` |
| `bold.transactions` | Voucher status | `paymentButton` |
| `bold.online` | Online Payments API (BETA) | `online` |
| `bold.webhooks` | Webhooks | primary (`secretKey`) |
| `bold.oauth` | OAuth client credentials | `clientId`/`clientSecret` |

## Result tuples

Every async method returns `[error, null]` or `[null, data]`:

```ts
const [error, methods] = await bold.payments.getMethods();
if (error) {
  switch (error.kind) {
    case "http": console.error(error.status, error.body); break;       // non‑2xx
    case "invalid_response": console.error(error.issues); break;        // failed zod
    case "api_error": console.error(error.errors); break;               // 2xx with errors[]
    case "timeout": console.error(error.timeoutMs); break;
    default: console.error(error);                                      // network|config|aborted
  }
  return;
}
console.log(methods.payload.payment_methods);
```

`BoldError` is a discriminated union on `kind`, so `error.kind === "http"`
narrows to `error.status`.

## Online Payments API (cards, PSE, Nequi, Bancolombia, QR Bre‑B)

> BETA — requires the "API Pagos en Línea" key, activated separately in the dashboard.

```ts
// 1) Create an intent
const [, intent] = await bold.online.createIntent({
  reference_id: "ORD-12345",
  amount: { currency: "COP", total_amount: 100000, tip_amount: 0 },
  callback_url: "https://shop.com/return" // required for PSE & Bancolombia
});

// 2) Execute the payment
const [, attempt] = await bold.online.pay({
  reference_id: "ORD-12345",
  payer: { name: "Laura Gómez", document_type: "CEDULA", document_number: "1012345678" },
  payment_method: {
    name: "CREDIT_CARD",
    card_number: "4111111111111111",
    cardholder_name: "Laura Gomez",
    expiration_month: 12,
    expiration_year: 2035,
    installments: 1,
    cvc: "123"
  }
});

// 3) Handle 3DS / PSE / QR via attempt.next_actions, then confirm:
const [, status] = await bold.online.getPayment("ORD-12345");
```

Also: `getIntent`, `updateIntent`, `listPseBanks`, `voidPayment`, `refund`,
`getRefund`. Sandbox 3DS/fraud is triggered by special `total_amount` values
(`555001` approve‑3DS, `555002` reject‑3DS, `555020` challenge, `555040`
approve‑no‑3DS, `555042` reject‑fraud).

## Payment links

```ts
const [, link] = await bold.links.create({
  amount_type: "CLOSE", // or "OPEN" (buyer chooses the amount)
  amount: { currency: "COP", total_amount: 50000, tip_amount: 0, taxes: [] },
  description: "Order 12345",
  payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"]
});
// link.payment_link → "LNK_…", link.url → "https://checkout.bold.co/…"

const [, methods] = await bold.links.getPaymentMethods(); // limits per method
const [, detail] = await bold.links.get(link!.payment_link);
```

## App‑checkout (datáfono / POS)

```ts
const [, terminals] = await bold.terminals.list();
const [, payment] = await bold.payments.create({
  amount: { currency: "COP", total_amount: 50000, tip_amount: 0, taxes: [] },
  payment_method: "POS", // "" shows the selector on the terminal
  terminal_model: "N86",
  terminal_serial: "N860W000000",
  reference: "ORD-12345",
  user_email: "seller@shop.com"
});
```

## Transaction status

```ts
const [error, voucher] = await bold.transactions.getStatus(saleId);
// voucher.payment_status: NO_TRANSACTION_FOUND | PROCESSING | PENDING | APPROVED | REJECTED | FAILED | VOIDED
```

## Webhooks

Verify the `x-bold-signature` HMAC over the **raw** request body, then respond
`200` within ~2s. Sandbox uses an empty secret key.

```ts
const result = bold.webhooks.verify(rawBody, signature); // { valid, error? }
const event = bold.webhooks.parse(rawBody);
```

### Framework adapters

Drop‑in handlers that read the raw body, verify, parse, dispatch, and map errors
to status codes. Imported from subpaths (only `express`/`hono` pull a peer dep):

```ts
// Next.js — app/api/bold/webhook/route.ts
import { createBoldWebhookRoute } from "@pulgueta/bold/next";
export const POST = createBoldWebhookRoute(bold, {
  onEvent: (event) => { /* event.type, event.data.payment_id */ }
});
```

```ts
// Hono
import { boldWebhook } from "@pulgueta/bold/hono";
app.post("/webhook/bold", boldWebhook(bold, { onEvent }));
```

```ts
// Express 5 — mount a raw parser so bytes match the signature
import { boldWebhookHandler } from "@pulgueta/bold/express";
app.post("/webhook/bold", express.raw({ type: () => true }), boldWebhookHandler(bold, { onEvent }));
```

```ts
// TanStack Start
import { createBoldWebhookHandler } from "@pulgueta/bold/tanstack";
export const ServerRoute = createServerFileRoute().methods({
  POST: createBoldWebhookHandler(bold, { onEvent })
});
```

If a webhook is missed, query actively (use sparingly):

```ts
const [error, data] = await bold.webhooks.getNotifications(paymentId);
```

## Request options

Every method accepts a final options argument:

```ts
await bold.online.createIntent(input, {
  timeoutMs: 15000,
  retries: 3,
  retryDelayMs: 1000,
  idempotencyKey: crypto.randomUUID(),
  signal: controller.signal
});
```

## TypeScript & schemas

All request/response types and their Zod schemas are exported, e.g.
`PaymentIntentRequest`/`PaymentIntentRequestSchema`, `CreateLinkRequest`,
`AppCheckoutRequest`, `WebhookNotification`. Schemas are usable for your own
runtime validation.

## Skills

This package ships [agent skills](https://agentskills.io) under `skills/`. Install
them into your coding agent with [`skills-npm`](https://npmx.dev/package/skills-npm):

```bash
npm i -D skills-npm && npx skills-npm
```

## Development

```bash
pnpm build              # tsup → dist/
pnpm typecheck          # tsc --noEmit
pnpm test:unit          # deterministic unit tests
pnpm test:integration   # live Bold sandbox (needs .env; surfaces self‑skip)
pnpm sandbox            # runnable end‑to‑end check
```

Releases are automated with semantic-release; `prepack` rebuilds `dist/` on every
publish so the shipped code is always current.

## License

MIT © Andrés Rodríguez · [GitHub](https://github.com/pulgueta/bold-node) · [Bold docs](https://developers.bold.co)
