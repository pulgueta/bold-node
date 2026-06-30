import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { hasApiErrors, requestJson } from "../http";
import type { AppCheckoutRequest } from "../schemas/integrations";
import {
  AppCheckoutResponseSchema,
  PaymentMethodsResponseSchema
} from "../schemas/integrations";
import type { TransactionsResource } from "./transactions";

/**
 * API Integrations payments (https://integrations.api.bold.co) — dispatch a
 * charge to a bound Bold POS terminal (datáfono).
 */
export class PaymentsResource {
  constructor(
    private readonly ctx: ResourceContext,
    private readonly transactions: TransactionsResource
  ) {}

  private get headers() {
    return authHeaders(this.ctx.identityKey);
  }

  /** Create an app-checkout payment on a terminal. `POST /payments/app-checkout` */
  async create(input: AppCheckoutRequest, options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.ctx.baseUrl}/payments/app-checkout`,
      method: "POST",
      headers: this.headers,
      body: input,
      schema: AppCheckoutResponseSchema,
      ...this.ctx.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }

  /** Get the merchant's enabled payment methods. `GET /payments/payment-methods` */
  async getMethods(options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.ctx.baseUrl}/payments/payment-methods`,
      method: "GET",
      headers: this.headers,
      schema: PaymentMethodsResponseSchema,
      ...this.ctx.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }

  /**
   * Get the payment voucher / transaction status for a sale.
   * @deprecated Use `bold.transactions.getStatus` instead.
   */
  getStatus(saleId: string, options?: RequestConfig) {
    return this.transactions.getStatus(saleId, options);
  }
}
