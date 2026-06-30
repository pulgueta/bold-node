import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { requestJson } from "../http";
import { PaymentVoucherResponseSchema } from "../schemas/transaction";

/**
 * Transaction voucher status (https://payments.api.bold.co/v2/payment-voucher).
 *
 * Active polling of a Payment Button / Link sale's status. Prefer webhooks; use
 * this as a fallback. The sale may take up to 10 minutes to appear and is then
 * queryable for 24 hours.
 */
export class TransactionsResource {
  constructor(private readonly ctx: ResourceContext) {}

  /** Get a sale's voucher/status by its unique sale id. `GET /v2/payment-voucher/{saleId}` */
  getStatus(saleId: string, options?: RequestConfig) {
    return requestJson({
      url: `${this.ctx.baseUrl}/v2/payment-voucher/${encodeURIComponent(
        saleId
      )}`,
      method: "GET",
      headers: authHeaders(this.ctx.identityKey),
      schema: PaymentVoucherResponseSchema,
      ...this.ctx.defaultConfig,
      ...options
    });
  }
}
