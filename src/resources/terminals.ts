import type { ResourceContext } from "../config";
import { authHeaders } from "../config";
import type { RequestConfig } from "../http";
import { hasApiErrors, requestJson } from "../http";
import { BindedTerminalsResponseSchema } from "../schemas/integrations";

/**
 * API Integrations terminals — list the Bold POS terminals (datáfonos) bound to
 * the merchant and enabled for API Integrations.
 */
export class TerminalsResource {
  constructor(private readonly ctx: ResourceContext) {}

  /** List bound/available terminals. `GET /payments/binded-terminals` */
  async list(options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.ctx.baseUrl}/payments/binded-terminals`,
      method: "GET",
      headers: authHeaders(this.ctx.identityKey),
      schema: BindedTerminalsResponseSchema,
      ...this.ctx.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }
}
