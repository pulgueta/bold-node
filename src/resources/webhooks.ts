import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { requestJson } from "../http";
import { WebhookNotificationsResponseSchema } from "../schemas/webhooks";
import type { WebhookVerificationResult } from "../webhooks";
import {
  generateWebhookSignature,
  parseWebhookPayload,
  verifyWebhookSignature
} from "../webhooks";

/**
 * Webhook helpers + the active fallback notification lookup.
 *
 * Bold signs each event with the secret key of the integration that produced
 * the payment (API Datáfono for API Integrations payments, Payment Button
 * otherwise). Pass the matching secret key via `secretKeyOverride` if it differs
 * from the SDK default. Sandbox events are signed with an empty secret key.
 */
export class WebhooksResource {
  constructor(private readonly ctx: ResourceContext) {}

  /** Verify the `x-bold-signature` HMAC of a raw webhook body. */
  verify(
    payload: string | Buffer,
    signature: string,
    secretKeyOverride?: string
  ): WebhookVerificationResult {
    return verifyWebhookSignature(
      payload,
      signature,
      secretKeyOverride ?? this.ctx.secretKey
    );
  }

  /** Generate a signature (useful for tests). */
  generateSignature(
    payload: string | Buffer,
    secretKeyOverride?: string
  ): string {
    return generateWebhookSignature(
      payload,
      secretKeyOverride ?? this.ctx.secretKey
    );
  }

  /** Parse a raw JSON webhook body into a typed object (no validation). */
  parse<T = unknown>(payload: string): T | null {
    return parseWebhookPayload<T>(payload);
  }

  /**
   * Active fallback: query the last notification(s) for a payment.
   * `GET /payments/webhook/notifications/{paymentId}` (use only as a backup).
   */
  getNotifications(
    paymentId: string,
    options?: { isExternalReference?: boolean } & RequestConfig
  ) {
    const queryParams = new URLSearchParams();

    if (options?.isExternalReference) {
      queryParams.set("is_external_reference", "true");
    }

    const queryString = queryParams.toString();
    const url = `${
      this.ctx.baseUrl
    }/payments/webhook/notifications/${encodeURIComponent(paymentId)}${
      queryString ? `?${queryString}` : ""
    }`;

    return requestJson({
      url,
      method: "GET",
      headers: authHeaders(this.ctx.identityKey),
      schema: WebhookNotificationsResponseSchema,
      ...this.ctx.defaultConfig,
      timeoutMs: options?.timeoutMs,
      signal: options?.signal,
      retries: options?.retries,
      retryDelayMs: options?.retryDelayMs
    });
  }
}
