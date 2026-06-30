import type { Bold } from "../bold";
import type { WebhookNotification } from "../schemas/webhooks";
import {
  handleWebhookRequest,
  SIGNATURE_HEADER,
  type WebhookHandlerOptions
} from "./core";

export type { WebhookHandlerOptions } from "./core";

/**
 * Next.js (App Router) webhook route handler for Bold events.
 *
 * @example
 * ```ts
 * // app/api/bold/webhook/route.ts
 * import { Bold } from "@pulgueta/bold";
 * import { createBoldWebhookRoute } from "@pulgueta/bold/next";
 *
 * const bold = new Bold({
 *   identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY!,
 *   secretKey: process.env.BOLD_PAYMENT_BUTTON_SECRET_KEY
 * });
 *
 * export const POST = createBoldWebhookRoute(bold, {
 *   onEvent: async (event) => {
 *     if (event.type === "SALE_APPROVED") {
 *       // fulfil the order using event.data.payment_id
 *     }
 *   }
 * });
 * ```
 */
export function createBoldWebhookRoute<TEvent = WebhookNotification>(
  bold: Bold,
  options: WebhookHandlerOptions<TEvent>
) {
  return async (request: Request): Promise<Response> => {
    const rawBody = await request.text();
    const signature = request.headers.get(
      options.signatureHeader ?? SIGNATURE_HEADER
    );
    const result = await handleWebhookRequest<TEvent>({
      bold,
      rawBody,
      signature,
      options
    });
    return Response.json(result.body, { status: result.status });
  };
}
