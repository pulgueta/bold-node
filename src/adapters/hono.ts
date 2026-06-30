import type { Context } from "hono";
import type { Bold } from "../bold";
import type { WebhookNotification } from "../schemas/webhooks";
import {
  handleWebhookRequest,
  SIGNATURE_HEADER,
  type WebhookHandlerOptions
} from "./core";

export type { WebhookHandlerOptions } from "./core";

/**
 * Hono webhook handler for Bold events.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { Bold } from "@pulgueta/bold";
 * import { boldWebhook } from "@pulgueta/bold/hono";
 *
 * const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
 * const app = new Hono();
 * app.post("/webhook/bold", boldWebhook(bold, {
 *   onEvent: (event) => console.log(event.type)
 * }));
 * ```
 */
export function boldWebhook<TEvent = WebhookNotification>(
  bold: Bold,
  options: WebhookHandlerOptions<TEvent>
) {
  return async (c: Context): Promise<Response> => {
    const rawBody = await c.req.text();
    const signature = c.req.header(options.signatureHeader ?? SIGNATURE_HEADER);
    const result = await handleWebhookRequest<TEvent>({
      bold,
      rawBody,
      signature,
      options
    });
    // status is a runtime-valid HTTP code; cast to satisfy Hono's literal union.
    return c.json(result.body, result.status as 200);
  };
}
