import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { requestJson, requestNoContent } from "../http";
import type {
  PaymentAttemptRequest,
  PaymentIntentRequest,
  PaymentRefundRequest
} from "../schemas/online";
import {
  PaymentAttemptEnvelopeSchema,
  PaymentAttemptStatusEnvelopeSchema,
  PaymentIntentEnvelopeSchema,
  PaymentRefundEnvelopeSchema,
  PseBankListEnvelopeSchema
} from "../schemas/online";

/**
 * Online Payments API (https://api.online.payments.bold.co) — BETA.
 *
 * Full control over the payment experience for cards, PSE, Nequi, Botón
 * Bancolombia and QR Bre-B. A typical flow is: `createIntent` →
 * `pay` (handle `next_actions` for 3DS/PSE/QR) → `getPayment`.
 *
 * Requires the "API Pagos en Línea" identity key (activated separately in the
 * dashboard). Responses are accepted whether or not Bold wraps them in the
 * `{ payload, errors }` envelope.
 */
export class OnlineResource {
  constructor(private readonly ctx: ResourceContext) {}

  private get headers() {
    return authHeaders(this.ctx.identityKey);
  }

  /** Create a payment intent. `POST /v1/payment-intent` */
  createIntent(input: PaymentIntentRequest, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment-intent`,
      method: "POST",
      headers: this.headers,
      body: input,
      schema: PaymentIntentEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Get a payment intent by its `reference_id`. `GET /v1/payment-intent/{reference_id}` */
  getIntent(referenceId: string, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment-intent/${encodeURIComponent(
        referenceId
      )}`,
      method: "GET",
      headers: this.headers,
      schema: PaymentIntentEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Update an unpaid payment intent. `PUT /v1/payment-intent` */
  updateIntent(input: PaymentIntentRequest, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment-intent`,
      method: "PUT",
      headers: this.headers,
      body: input,
      schema: PaymentIntentEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /**
   * Execute a payment attempt against an intent. `POST /v1/payment`
   *
   * The response may carry `next_actions` (redirect for 3DS/PSE/Bancolombia, or
   * `qr_payload` for QR). Always be ready to handle a 3DS redirect.
   */
  pay(input: PaymentAttemptRequest, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment`,
      method: "POST",
      headers: this.headers,
      body: input,
      schema: PaymentAttemptEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Get a payment attempt's status by `reference_id`. `GET /v1/payment/{reference_id}` */
  getPayment(referenceId: string, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment/${encodeURIComponent(referenceId)}`,
      method: "GET",
      headers: this.headers,
      schema: PaymentAttemptStatusEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** List the banks available for PSE. `GET /v1/payment/pse/banks` */
  listPseBanks(options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment/pse/banks`,
      method: "GET",
      headers: this.headers,
      schema: PseBankListEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Void a (card) payment the same day. `POST /v1/payment/void` → 204 */
  voidPayment(transactionId: string, options?: RequestConfig) {
    return requestNoContent({
      url: `${this.ctx.baseUrl}/v1/payment/void`,
      method: "POST",
      headers: this.headers,
      body: { transaction_id: transactionId },
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Request a refund for a previously approved payment. `POST /v1/payment/refund` → 204 */
  refund(input: PaymentRefundRequest, options?: RequestConfig) {
    return requestNoContent({
      url: `${this.ctx.baseUrl}/v1/payment/refund`,
      method: "POST",
      headers: this.headers,
      body: input,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Get a refund's status. `GET /v1/payment/refund/{transaction_id}` */
  getRefund(transactionId: string, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v1/payment/refund/${encodeURIComponent(
        transactionId
      )}`,
      method: "GET",
      headers: this.headers,
      schema: PaymentRefundEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }
}
