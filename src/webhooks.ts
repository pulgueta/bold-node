import { createHmac, timingSafeEqual } from "node:crypto";

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifies the signature of a Bold webhook payload.
 *
 * Bold signs webhooks using HMAC-SHA256 with the following process:
 * 1. The raw request body is encoded to Base64
 * 2. The Base64 string is signed with your secret key using HMAC-SHA256
 * 3. The resulting signature is sent in the `x-bold-signature` header
 *
 * @param payload - The raw request body as a string or Buffer
 * @param signature - The signature from the `x-bold-signature` header
 * @param secretKey - Your Bold secret key (empty string for sandbox/test mode)
 * @returns Verification result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@pulgueta/bold';
 *
 * app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
 *   const signature = req.headers['x-bold-signature'] as string;
 *   const result = verifyWebhookSignature(req.body, signature, process.env.BOLD_SECRET_KEY!);
 *
 *   if (!result.valid) {
 *     return res.status(400).json({ error: result.error });
 *   }
 *
 *   // Process the webhook...
 *   res.status(200).json({ received: true });
 * });
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secretKey: string
): WebhookVerificationResult {
  if (!payload) {
    return { valid: false, error: "Payload is required" };
  }

  if (!signature) {
    return { valid: false, error: "Signature is required" };
  }

  try {
    const payloadBuffer =
      typeof payload === "string" ? Buffer.from(payload, "utf-8") : payload;
    const encoded = payloadBuffer.toString("base64");

    const expectedSignature = createHmac("sha256", secretKey)
      .update(encoded)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Invalid signature" };
    }

    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Signature verification failed"
    };
  }
}

/**
 * Generates a webhook signature for testing purposes.
 * This is useful for writing tests that simulate Bold webhook calls.
 *
 * @param payload - The request body to sign
 * @param secretKey - Your Bold secret key (empty string for sandbox/test mode)
 * @returns The HMAC-SHA256 signature in hexadecimal format
 *
 * @example
 * ```typescript
 * import { generateWebhookSignature } from '@pulgueta/bold';
 *
 * const payload = JSON.stringify({ type: 'SALE_APPROVED', ... });
 * const signature = generateWebhookSignature(payload, 'your-secret-key');
 *
 * // Use in tests
 * const response = await request(app)
 *   .post('/webhook')
 *   .set('x-bold-signature', signature)
 *   .send(payload);
 * ```
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secretKey: string
): string {
  const payloadBuffer =
    typeof payload === "string" ? Buffer.from(payload, "utf-8") : payload;
  const encoded = payloadBuffer.toString("base64");

  return createHmac("sha256", secretKey).update(encoded).digest("hex");
}

/**
 * Parses a webhook payload and returns the typed notification object.
 * Validates that the payload is valid JSON.
 *
 * @param payload - The raw request body as a string
 * @returns The parsed webhook notification or null if invalid
 */
export function parseWebhookPayload<T = unknown>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}
