import type { Bold } from "../bold";
import type { WebhookNotification } from "../schemas/webhooks";

/** Default header carrying the Bold webhook HMAC signature. */
export const SIGNATURE_HEADER = "x-bold-signature";

export interface WebhookHandlerOptions<TEvent = WebhookNotification> {
  /**
   * Called with the verified, parsed event. Throw to signal a processing
   * failure (the adapter responds 500 so Bold retries).
   */
  onEvent: (event: TEvent) => void | Promise<void>;
  /**
   * Secret key override used to verify the signature. Defaults to the SDK's
   * configured secret. Use this when different surfaces sign with different
   * keys (API Datáfono vs Payment Button). In sandbox the key is "".
   */
  secretKey?: string;
  /** Disable signature verification (NOT recommended). Default: verify. */
  verifySignature?: boolean;
  /** Override the signature header name. Default: `x-bold-signature`. */
  signatureHeader?: string;
}

export interface WebhookHandlerResult {
  status: number;
  body: { received: boolean; error?: string };
}

/**
 * Framework-agnostic core for handling a Bold webhook. Verifies the HMAC
 * signature over the RAW body, parses the event, dispatches `onEvent`, and maps
 * the outcome to an HTTP status. Every framework adapter is a thin shell over
 * this single tested function.
 *
 * - Invalid signature → 401
 * - Unparseable body → 400
 * - `onEvent` throws → 500 (so Bold retries)
 * - Success → 200
 */
export async function handleWebhookRequest<TEvent = WebhookNotification>(args: {
  bold: Bold;
  rawBody: string;
  signature: string | null | undefined;
  options: WebhookHandlerOptions<TEvent>;
}): Promise<WebhookHandlerResult> {
  const { bold, rawBody, signature, options } = args;

  if (options.verifySignature !== false) {
    const result = bold.webhooks.verify(
      rawBody,
      signature ?? "",
      options.secretKey
    );
    if (!result.valid) {
      return {
        status: 401,
        body: { received: false, error: result.error ?? "Invalid signature" }
      };
    }
  }

  const event = bold.webhooks.parse<TEvent>(rawBody);
  if (event === null) {
    return {
      status: 400,
      body: { received: false, error: "Invalid JSON payload" }
    };
  }

  try {
    await options.onEvent(event);
  } catch (error) {
    return {
      status: 500,
      body: {
        received: false,
        error: error instanceof Error ? error.message : "Handler error"
      }
    };
  }

  return { status: 200, body: { received: true } };
}
