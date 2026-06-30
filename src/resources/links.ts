import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { requestJson } from "../http";
import type { CreateLinkRequest } from "../schemas/links";
import {
  CreateLinkEnvelopeSchema,
  LinkDetailEnvelopeSchema,
  LinkPaymentMethodsEnvelopeSchema
} from "../schemas/links";

/**
 * API Link de pagos (https://integrations.api.bold.co/online/link/v1).
 *
 * Programmatically create and query Bold payment links. Uses the Payment Button
 * identity key.
 */
export class LinksResource {
  constructor(private readonly ctx: ResourceContext) {}

  private get headers() {
    return authHeaders(this.ctx.identityKey);
  }

  /** Enabled payment methods with their min/max limits. `GET /online/link/v1/payment_methods` */
  getPaymentMethods(options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/online/link/v1/payment_methods`,
      method: "GET",
      headers: this.headers,
      schema: LinkPaymentMethodsEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Create a payment link. `POST /online/link/v1` → `{ payment_link, url }` */
  create(input: CreateLinkRequest, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/online/link/v1`,
      method: "POST",
      headers: this.headers,
      body: input,
      schema: CreateLinkEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }

  /** Get a payment link's status and data. `GET /online/link/v1/{payment_link}` */
  get(paymentLink: string, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/online/link/v1/${encodeURIComponent(
        paymentLink
      )}`,
      method: "GET",
      headers: this.headers,
      schema: LinkDetailEnvelopeSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }
}
