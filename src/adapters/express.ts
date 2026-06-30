import type { Request, Response } from "express";
import type { Bold } from "../bold";
import type { WebhookNotification } from "../schemas/webhooks";
import {
  handleWebhookRequest,
  SIGNATURE_HEADER,
  type WebhookHandlerOptions
} from "./core";

export type { WebhookHandlerOptions } from "./core";

function extractRawBody(req: Request): string {
  const body: unknown = req.body;
  if (Buffer.isBuffer(body)) return body.toString("utf-8");
  if (typeof body === "string") return body;
  // Fallback: the body was already JSON-parsed. The signature is computed over
  // the raw bytes, so re-stringifying may not match — mount `express.raw()`.
  return body != null ? JSON.stringify(body) : "";
}

/**
 * Express 5 webhook handler for Bold events.
 *
 * IMPORTANT: mount the raw body parser on this route so the signature is
 * verified over the exact bytes Bold sent:
 *
 * @example
 * ```ts
 * import express from "express";
 * import { Bold } from "@pulgueta/bold";
 * import { boldWebhookHandler } from "@pulgueta/bold/express";
 *
 * const bold = new Bold({ identityKey: process.env.BOLD_PAYMENT_BUTTON_IDENTITY_KEY! });
 * const app = express();
 * app.post(
 *   "/webhook/bold",
 *   express.raw({ type: () => true }),
 *   boldWebhookHandler(bold, { onEvent: (e) => console.log(e.type) })
 * );
 * ```
 */
export function boldWebhookHandler<TEvent = WebhookNotification>(
  bold: Bold,
  options: WebhookHandlerOptions<TEvent>
) {
  return async (req: Request, res: Response): Promise<void> => {
    const rawBody = extractRawBody(req);
    const signature = req.header(options.signatureHeader ?? SIGNATURE_HEADER);
    const result = await handleWebhookRequest<TEvent>({
      bold,
      rawBody,
      signature,
      options
    });
    res.status(result.status).json(result.body);
  };
}
