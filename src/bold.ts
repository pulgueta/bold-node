import type {
  BoldOptions,
  ResolvedCredential,
  ResourceContext
} from "./config";
import { BASE_URLS, resolveCredential } from "./config";
import type { RequestConfig } from "./http";
import { LinksResource } from "./resources/links";
import { OAuthResource } from "./resources/oauth";
import { OnlineResource } from "./resources/online";
import { PaymentsResource } from "./resources/payments";
import { TerminalsResource } from "./resources/terminals";
import { TransactionsResource } from "./resources/transactions";
import { WebhooksResource } from "./resources/webhooks";

/**
 * The Bold client. Wires up one resource per integration surface, each using
 * the credential resolved for that surface (per-surface override, else the
 * top-level `identityKey`/`secretKey`).
 *
 * @example
 * ```ts
 * const bold = new Bold({ identityKey: process.env.BOLD_API_INTEGRATIONS_IDENTITY_KEY! });
 * const [err, methods] = await bold.payments.getMethods();
 * ```
 */
export class Bold {
  /** OAuth client-credentials token. */
  readonly oauth: OAuthResource;
  /** API Integrations app-checkout (datáfono). */
  readonly payments: PaymentsResource;
  /** API Integrations bound terminals. */
  readonly terminals: TerminalsResource;
  /** Online Payments API (BETA): intents, payments, refunds, voids, PSE banks. */
  readonly online: OnlineResource;
  /** API Link de pagos: create/query payment links. */
  readonly links: LinksResource;
  /** Voucher/status polling for Payment Button & Link sales. */
  readonly transactions: TransactionsResource;
  /** Webhook verification + fallback notification lookup. */
  readonly webhooks: WebhooksResource;

  readonly environment: "sandbox" | "production";
  readonly integrationsBaseUrl: string;
  readonly paymentsBaseUrl: string;
  readonly onlineBaseUrl: string;

  constructor(opts: BoldOptions) {
    this.environment = opts.environment ?? "sandbox";

    const defaultConfig: RequestConfig = {
      timeoutMs: opts.timeoutMs ?? 30000,
      retries: opts.retries ?? 0,
      retryDelayMs: opts.retryDelayMs ?? 1000
    };

    const primaryCred = resolveCredential(opts);
    const apiCred = resolveCredential(opts, opts.apiIntegrations);
    const buttonCred = resolveCredential(opts, opts.paymentButton);
    const onlineCred = resolveCredential(opts, opts.online);

    this.integrationsBaseUrl = BASE_URLS.integrations[this.environment];
    this.paymentsBaseUrl = BASE_URLS.payments[this.environment];
    this.onlineBaseUrl = BASE_URLS.online[this.environment];
    const oauthBaseUrl = BASE_URLS.oauth[this.environment];

    const ctx = (
      baseUrl: string,
      cred: ResolvedCredential
    ): ResourceContext => ({
      baseUrl,
      identityKey: cred.identityKey,
      secretKey: cred.secretKey,
      defaultConfig
    });

    this.oauth = new OAuthResource(
      oauthBaseUrl,
      opts.clientId,
      opts.clientSecret,
      defaultConfig
    );
    this.transactions = new TransactionsResource(
      ctx(this.paymentsBaseUrl, buttonCred)
    );
    this.payments = new PaymentsResource(
      ctx(this.integrationsBaseUrl, apiCred),
      this.transactions
    );
    this.terminals = new TerminalsResource(
      ctx(this.integrationsBaseUrl, apiCred)
    );
    this.online = new OnlineResource(ctx(this.onlineBaseUrl, onlineCred));
    this.links = new LinksResource(ctx(this.integrationsBaseUrl, buttonCred));
    this.webhooks = new WebhooksResource(
      ctx(this.integrationsBaseUrl, primaryCred)
    );
  }
}
