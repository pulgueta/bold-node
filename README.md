# Bold Node.js SDK

Implement Bold in your Node.js applications.

## Installation

```bash
bun add @pulgueta/bold zod
```

## Quick Start

```typescript
import { Bold } from "@pulgueta/bold";

const bold = new Bold({
  identityKey: process.env.BOLD_IDENTITY_KEY!,
  secretKey: process.env.BOLD_SECRET_KEY, // Optional, for webhook verification
  environment: "sandbox", // or "production"
});

// Create a payment
const [error, payment] = await bold.payments.create({
  amount: {
    currency: "COP",
    total_amount: 50000,
    taxes: [],
    tip_amount: 0,
  },
  payment_method: "POS",
  terminal_model: "P400",
  terminal_serial: "12345678",
  reference: "ORDER-123",
  user_email: "customer@example.com",
});

if (error) {
  console.error("Payment failed:", error);
} else {
  console.log("Payment created:", payment.payload.integration_id);
}
```

## Configuration

### SDK Options

```typescript
interface BoldOptions {
  // Required: Your Bold API identity key
  identityKey: string;

  // Optional: Secret key for webhook verification
  secretKey?: string;

  // Optional: OAuth client credentials
  clientId?: string;
  clientSecret?: string;

  // Optional: Environment (default: "sandbox")
  environment?: "sandbox" | "production";

  // Optional: Request timeout in milliseconds (default: 30000)
  timeoutMs?: number;

  // Optional: Number of retry attempts (default: 0)
  retries?: number;

  // Optional: Delay between retries in milliseconds (default: 1000)
  retryDelayMs?: number;
}
```

### Example Configuration

```typescript
const bold = new Bold({
  identityKey: process.env.BOLD_IDENTITY_KEY!,
  secretKey: process.env.BOLD_SECRET_KEY,
  clientId: process.env.BOLD_CLIENT_ID,
  clientSecret: process.env.BOLD_CLIENT_SECRET,
  environment: "production",
  timeoutMs: 15000,
  retries: 3,
  retryDelayMs: 2000,
});
```

## API Reference

### OAuth

Get an OAuth access token using client credentials.

```typescript
const [error, token] = await bold.oauth.getToken();

if (error) {
  console.error("Failed to get token:", error);
} else {
  console.log("Access token:", token.access_token);
  console.log("Expires in:", token.expires_in);
}
```

### Payments

#### Create Payment

Create a payment through the API Integrations (App Checkout).

```typescript
import type { AppCheckoutRequest } from "@pulgueta/bold";

const paymentRequest: AppCheckoutRequest = {
  amount: {
    currency: "COP",
    total_amount: 100000,
    taxes: [
      {
        type: "VAT",
        base: 84034,
        value: 15966,
      },
    ],
    tip_amount: 5000,
  },
  payment_method: "NEQUI",
  terminal_model: "SMARTPHONE",
  terminal_serial: "123456789",
  reference: "ORDER-001",
  user_email: "customer@example.com",
  description: "Product purchase",
  payer: {
    email: "customer@example.com",
    phone_number: "+573001234567",
    document: {
      document_type: "CEDULA",
      document_number: "1234567890",
    },
  },
};

const [error, payment] = await bold.payments.create(paymentRequest, {
  // Optional request config
  idempotencyKey: "unique-request-id",
  timeoutMs: 15000,
});
```

#### Get Payment Methods

Get available payment methods for the merchant.

```typescript
const [error, methods] = await bold.payments.getMethods();

if (error) {
  console.error("Failed to get payment methods:", error);
} else {
  console.log("Available methods:", methods.payload.payment_methods);
}
```

#### Get Payment Status

Get the payment voucher / transaction status for a sale.

```typescript
const [error, status] = await bold.payments.getStatus("sale-id-123");

if (error) {
  console.error("Failed to get payment status:", error);
} else {
  console.log("Payment status:", status.payment_status);
  console.log("Transaction ID:", status.transaction_id);
}
```

### Terminals

#### List Terminals

Get available payment terminals (dataphones) for the merchant.

```typescript
const [error, terminals] = await bold.terminals.list();

if (error) {
  console.error("Failed to get terminals:", error);
} else {
  for (const terminal of terminals.payload.available_terminals) {
    console.log(`${terminal.name}: ${terminal.terminal_serial}`);
  }
}
```

### Webhooks

#### Verify Webhook Signature

Verify the authenticity of a webhook payload using HMAC-SHA256.

```typescript
import express from "express";

const app = express();

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-bold-signature"] as string;

  // Verify the webhook signature
  const result = bold.webhooks.verify(req.body, signature);

  if (!result.valid) {
    console.error("Invalid webhook signature:", result.error);
    return res.status(400).json({ error: result.error });
  }

  // Parse the webhook payload
  const notification = bold.webhooks.parse<WebhookNotification>(
    req.body.toString()
  );

  if (!notification) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // Process the webhook
  console.log("Webhook received:", notification.type);
  console.log("Payment ID:", notification.data.payment_id);

  res.status(200).json({ received: true });
});
```

#### Generate Webhook Signature (for testing)

Generate a webhook signature for testing purposes.

```typescript
const payload = JSON.stringify({
  id: "evt_123",
  type: "SALE_APPROVED",
  data: {
    payment_id: "pay_123",
    merchant_id: "merchant_123",
    amount: { total: 50000, currency: "COP" },
  },
});

const signature = bold.webhooks.generateSignature(payload);

// Use in tests
const response = await fetch("http://localhost:3000/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-bold-signature": signature,
  },
  body: payload,
});
```

#### Get Webhook Notifications

Get webhook notifications for a payment (fallback service).

```typescript
// By payment ID
const [error, notifications] = await bold.webhooks.getNotifications("pay_123");

// By external reference
const [error2, notifications2] = await bold.webhooks.getNotifications(
  "ORDER-123",
  { isExternalReference: true }
);

if (error) {
  console.error("Failed to get notifications:", error);
} else {
  for (const notification of notifications.notifications) {
    console.log(`${notification.type} at ${notification.time}`);
  }
}
```

## Error Handling

The SDK uses a **Result Tuple** pattern for explicit error handling. All async methods return `[error, null]` on failure or `[null, result]` on success.

### Result Tuple Pattern

```typescript
import type { BoldError } from "@pulgueta/bold";

const [error, payment] = await bold.payments.create(paymentRequest);

if (error) {
  // Handle error based on type
  switch (error.kind) {
    case "network":
      console.error("Network error:", error.message);
      break;
    case "http":
      console.error(`HTTP ${error.status}: ${error.statusText}`);
      break;
    case "invalid_response":
      console.error("Invalid response:", error.issues);
      break;
    case "api_error":
      console.error("API error:", error.errors);
      break;
    case "config":
      console.error("Configuration error:", error.message);
      break;
    case "timeout":
      console.error(`Request timeout after ${error.timeoutMs}ms`);
      break;
    case "aborted":
      console.error("Request aborted:", error.message);
      break;
  }
  return;
}

// Success - payment is guaranteed to be non-null
console.log("Payment ID:", payment.payload.integration_id);
```

### Error Types

```typescript
type BoldError = { kind: Kind } & (
  | NetworkError // Fetch failed (network issues, timeout, abort)
  | HttpError // Non-2xx HTTP status
  | InvalidResponseError // Response failed Zod validation
  | ApiError // Bold API returned errors
  | ConfigError // SDK misconfiguration
  | TimeoutError // Request timeout
  | AbortedError
); // Request aborted
```

## TypeScript Support

The SDK is fully typed with TypeScript and exports all schemas and types.

### Using Types

```typescript
import type {
  AppCheckoutRequest,
  AppCheckoutResponse,
  PaymentStatus,
  WebhookNotification,
  WebhookEventType,
  BoldError,
} from "@pulgueta/bold";

const payment: AppCheckoutRequest = {
  amount: {
    currency: "COP",
    total_amount: 50000,
    taxes: [],
    tip_amount: 0,
  },
  payment_method: "POS",
  terminal_model: "P400",
  terminal_serial: "12345678",
  reference: "ORDER-123",
  user_email: "customer@example.com",
};
```

### Using Schemas (Runtime Validation)

```typescript
import { AppCheckoutRequestSchema } from "@pulgueta/bold";

const result = AppCheckoutRequestSchema.safeParse(unknownData);

if (result.success) {
  const payment = result.data;
  // payment is now typed as AppCheckoutRequest
} else {
  console.error("Validation errors:", result.error.issues);
}
```

## Advanced Features

### Request Configuration

All methods accept optional request configuration:

```typescript
interface RequestConfig {
  // Custom timeout for this request
  timeoutMs?: number;

  // AbortSignal for request cancellation
  signal?: AbortSignal;

  // Number of retry attempts
  retries?: number;

  // Delay between retries in milliseconds
  retryDelayMs?: number;

  // Idempotency key for safe retries (payments only)
  idempotencyKey?: string;
}
```

### Request Cancellation

```typescript
const controller = new AbortController();

// Cancel request after 5 seconds
setTimeout(() => controller.abort(), 5000);

const [error, payment] = await bold.payments.create(paymentRequest, {
  signal: controller.signal,
});

if (error?.kind === "aborted") {
  console.log("Request was cancelled");
}
```

### Idempotent Requests

```typescript
import { randomUUID } from "crypto";

const idempotencyKey = randomUUID();

// First attempt
const [error1, payment1] = await bold.payments.create(paymentRequest, {
  idempotencyKey,
});

// Retry with same key - will not create duplicate payment
const [error2, payment2] = await bold.payments.create(paymentRequest, {
  idempotencyKey,
});
```

## Webhook Event Types

```typescript
type WebhookEventType =
  | "SALE_APPROVED"
  | "SALE_REJECTED"
  | "VOID_APPROVED"
  | "VOID_REJECTED";
```

## Payment Methods

```typescript
type PaymentMethod = "DAVIPLATA" | "NEQUI" | "PAY_BY_LINK" | "POS";
```

## Payment Status

```typescript
type PaymentStatus =
  | "NO_TRANSACTION_FOUND"
  | "PROCESSING"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "VOIDED";
```

## Document Types

```typescript
type DocumentType =
  | "CEDULA"
  | "NIT"
  | "CEDULA_EXTRANJERIA"
  | "PEP"
  | "PASAPORTE"
  | "NUIP"
  | "REGISTRO_CIVIL"
  | "DOCUMENTO_EXTRANJERIA"
  | "TARJETA_IDENTIDAD"
  | "PPT";
```

## Development

### Building

```bash
pnpm install
pnpm build
```

### Linting and Formatting

```bash
pnpm lint
pnpm format
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT © Andrés Rodríguez

## Links

- [GitHub Repository](https://github.com/pulgueta/bold-node)
- [npm Package](https://www.npmjs.com/package/@pulgueta/bold)
- [Bold API Documentation](https://bold.co/developers)
