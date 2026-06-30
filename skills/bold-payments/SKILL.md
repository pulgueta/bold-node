---
name: bold-payments
description: Integrate Bold (Colombia) payments with the @pulgueta/bold Node SDK — client setup, per-surface API keys, the Online Payments API (cards/PSE/Nequi/Bancolombia/QR), payment links, and POS app-checkout. Use when adding Bold payments to a Node/TypeScript backend.
---

# Integrating Bold payments with @pulgueta/bold

`@pulgueta/bold` is an ESM Node SDK for the Bold payments API (Colombia). Every
async method returns a result tuple `[error, data]` — it never throws.

```bash
npm i @pulgueta/bold zod
```

## Credentials (important)

Each Bold integration surface has its **own** identity + secret key pair in the
dashboard (panel.bold.co › Integraciones › Llaves de integración). They are
different values. Configure a primary key and override per surface as needed:

```ts
import { Bold } from "@pulgueta/bold";

const bold = new Bold({
  identityKey: process.env.BOLD_API_INTEGRATIONS_IDENTITY_KEY!, // default for all surfaces
  secretKey: process.env.BOLD_API_INTEGRATIONS_SECRET_KEY,
  environment: "sandbox", // or "production" — selected by the key, not the URL
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

Surfaces and which key they use:
- `bold.payments`, `bold.terminals` → **API Integrations** key
- `bold.links`, `bold.transactions` → **Payment Button** key
- `bold.online` → **Online Payments API** key (BETA; activated separately)

## Handle every result as a tuple

```ts
const [error, data] = await bold.payments.getMethods();
if (error) {
  if (error.kind === "http") console.error(error.status, error.body);
  return;
}
console.log(data.payload.payment_methods);
```

`error.kind` is one of `network | http | invalid_response | api_error | config | timeout | aborted` (discriminated, so `error.kind === "http"` narrows to `error.status`).

## Online Payments API (custom checkout: cards, PSE, Nequi, Bancolombia, QR)

Typical flow: create an intent → execute the payment → handle `next_actions`
(3DS redirect, PSE/Bancolombia redirect, or QR) → confirm status.

```ts
// 1. Create a payment intent
const [e1, intent] = await bold.online.createIntent({
  reference_id: "ORD-12345",
  amount: { currency: "COP", total_amount: 100000, tip_amount: 0 },
  description: "Order 12345",
  callback_url: "https://shop.com/return" // required for PSE & Bancolombia
});

// 2. Execute the payment with a method
const [e2, attempt] = await bold.online.pay({
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

// 3. Handle 3DS / redirect / QR
if (attempt?.next_actions?.redirect_url) {
  // redirect the buyer to attempt.next_actions.redirect_url, then on return:
  const [, status] = await bold.online.getPayment("ORD-12345");
}
```

Other methods: `getIntent(ref)`, `updateIntent(input)`, `listPseBanks()`,
`voidPayment(transactionId)`, `refund({ reference_id, transaction_id, reason })`,
`getRefund(transactionId)`.

Sandbox 3DS/fraud triggers via `total_amount`: `555001` approve-3DS, `555002`
reject-3DS, `555020` challenge, `555040` approve-no-3DS, `555042` reject-fraud.

## Payment links (hosted checkout, no PCI scope)

```ts
const [, link] = await bold.links.create({
  amount_type: "CLOSE", // or "OPEN" (buyer chooses amount)
  amount: { currency: "COP", total_amount: 50000, tip_amount: 0, taxes: [] },
  description: "Order 12345",
  payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"]
});
// link.payment_link === "LNK_...", link.url === "https://checkout.bold.co/..."

const [, methods] = await bold.links.getPaymentMethods(); // with min/max limits
const [, detail] = await bold.links.get(link!.payment_link);
```

## POS app-checkout (datáfono)

```ts
const [, terminals] = await bold.terminals.list();
const [, payment] = await bold.payments.create({
  amount: { currency: "COP", total_amount: 50000, tip_amount: 0, taxes: [] },
  payment_method: "POS", // or "" to show the selector on the terminal
  terminal_model: "N86",
  terminal_serial: "N860W000000",
  reference: "ORD-12345",
  user_email: "seller@shop.com"
});
```

## Transaction status

Prefer webhooks (see the `bold-webhooks` skill). Active fallback:

```ts
const [error, voucher] = await bold.transactions.getStatus(saleId);
// voucher.payment_status: NO_TRANSACTION_FOUND | PROCESSING | PENDING | APPROVED | REJECTED | FAILED | VOIDED
```

## Request options

Every method accepts a final options arg: `{ timeoutMs, retries, retryDelayMs, signal, idempotencyKey }`.
