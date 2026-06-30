import type { Bold } from "../bold";
import type { WebhookNotification } from "../schemas/webhooks";
import {
  handleWebhookRequest,
  SIGNATURE_HEADER,
  type WebhookHandlerOptions
} from "./core";

export type { WebhookHandlerOptions } from "./core";

/**
 * TanStack Start server-route / API-route handler for Bold webhooks.
 * Works with any handler that receives a Web `Request` in `{ request }`.
 *
 * @example
 * ```ts
 * // src/routes/api/bold.webhook.ts
 * import { createServerFileRoute } from "@tanstack/react-start/server";
 * import { Bold } from "@pulgueta/bold";
 * import { createBoldWebhookHandler } from "@pulgueta/bold/tanstack";
 *
 * const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
 * const handler = createBoldWebhookHandler(bold, {
 *   onEvent: (event) => console.log(event.type, event.data.payment_id)
 * });
 *
 * export const ServerRoute = createServerFileRoute().methods({ POST: handler });
 * ```
 */
export function createBoldWebhookHandler<TEvent = WebhookNotification>(
  bold: Bold,
  options: WebhookHandlerOptions<TEvent>
) {
  return async (ctx: { request: Request }): Promise<Response> => {
    const rawBody = await ctx.request.text();
    const signature = ctx.request.headers.get(
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
