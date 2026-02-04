import { requestJson, requestForm, hasApiErrors } from "./http";
import type { RequestConfig } from "./http";
import {
  OAuthTokenSchema,
  PaymentMethodsResponseSchema,
  BindedTerminalsResponseSchema,
  AppCheckoutResponseSchema,
  WebhookNotificationsResponseSchema,
  PaymentVoucherResponseSchema
} from "./schemas";
import type { AppCheckoutRequest } from "./schemas";
import {
  verifyWebhookSignature,
  generateWebhookSignature,
  parseWebhookPayload
} from "./webhooks";
import type { WebhookVerificationResult } from "./webhooks";

export interface BoldOptions {
  identityKey: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
  environment?: "sandbox" | "production";
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const BASE_URLS = {
  oauth: {
    sandbox: "https://api.sandbox.bold.co",
    production: "https://api.bold.co"
  },
  integrations: {
    sandbox: "https://integrations.api.bold.co",
    production: "https://integrations.api.bold.co"
  },
  payments: {
    sandbox: "https://payments.api.bold.co",
    production: "https://payments.api.bold.co"
  }
} as const;

class PaymentsResource {
  constructor(
    private readonly client: Bold,
    private readonly baseUrl: string,
    private readonly headers: Record<string, string>,
    private readonly defaultConfig: RequestConfig
  ) {}

  /**
   * Create a payment through the API Integrations (App Checkout).
   * @param input - Payment request details
   * @param options - Optional request configuration including idempotency key
   */
  async create(input: AppCheckoutRequest, options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.baseUrl}/payments/app-checkout`,
      method: "POST",
      headers: this.headers,
      body: input,
      schema: AppCheckoutResponseSchema,
      ...this.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }

  /**
   * Get available payment methods for the merchant.
   */
  async getMethods(options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.baseUrl}/payments/payment-methods`,
      method: "GET",
      headers: this.headers,
      schema: PaymentMethodsResponseSchema,
      ...this.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }

  /**
   * Get the payment voucher / transaction status for a sale.
   * @param saleId - The unique sale identifier
   */
  async getStatus(saleId: string, options?: RequestConfig) {
    return requestJson({
      url: `${
        this.client.paymentsBaseUrl
      }/v2/payment-voucher/${encodeURIComponent(saleId)}`,
      method: "GET",
      headers: this.headers,
      schema: PaymentVoucherResponseSchema,
      ...this.defaultConfig,
      ...options
    });
  }
}

class TerminalsResource {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: Record<string, string>,
    private readonly defaultConfig: RequestConfig
  ) {}

  /**
   * Get available payment terminals (dataphones) for the merchant.
   */
  async list(options?: RequestConfig) {
    const result = await requestJson({
      url: `${this.baseUrl}/payments/binded-terminals`,
      method: "GET",
      headers: this.headers,
      schema: BindedTerminalsResponseSchema,
      ...this.defaultConfig,
      ...options
    });

    if (result[1] && hasApiErrors(result[1])) {
      return [{ kind: "api_error", errors: result[1].errors }, null] as const;
    }

    return result;
  }
}

class WebhooksResource {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: Record<string, string>,
    private readonly secretKey: string,
    private readonly defaultConfig: RequestConfig
  ) {}

  /**
   * Verify the signature of a webhook payload.
   * Uses HMAC-SHA256 with Base64-encoded payload.
   *
   * @param payload - The raw request body
   * @param signature - The signature from the `x-bold-signature` header
   * @param secretKeyOverride - Optional secret key override (defaults to SDK config)
   */
  verify(
    payload: string | Buffer,
    signature: string,
    secretKeyOverride?: string
  ): WebhookVerificationResult {
    return verifyWebhookSignature(
      payload,
      signature,
      secretKeyOverride ?? this.secretKey
    );
  }

  /**
   * Generate a webhook signature for testing purposes.
   *
   * @param payload - The request body to sign
   * @param secretKeyOverride - Optional secret key override (defaults to SDK config)
   */
  generateSignature(
    payload: string | Buffer,
    secretKeyOverride?: string
  ): string {
    return generateWebhookSignature(
      payload,
      secretKeyOverride ?? this.secretKey
    );
  }

  /**
   * Parse a webhook payload into a typed object.
   *
   * @param payload - The raw JSON string payload
   */
  parse<T = unknown>(payload: string): T | null {
    return parseWebhookPayload<T>(payload);
  }

  /**
   * Get webhook notifications for a payment (fallback service).
   * Use this to actively query the notification for a transaction.
   *
   * @param paymentId - The payment ID or external reference
   * @param options - Query options and request configuration
   */
  async getNotifications(
    paymentId: string,
    options?: { isExternalReference?: boolean } & RequestConfig
  ) {
    const queryParams = new URLSearchParams();

    if (options?.isExternalReference) {
      queryParams.set("is_external_reference", "true");
    }

    const queryString = queryParams.toString();
    const url = `${
      this.baseUrl
    }/payments/webhook/notifications/${encodeURIComponent(paymentId)}${
      queryString ? `?${queryString}` : ""
    }`;

    return requestJson({
      url,
      method: "GET",
      headers: this.headers,
      schema: WebhookNotificationsResponseSchema,
      ...this.defaultConfig,
      timeoutMs: options?.timeoutMs,
      signal: options?.signal,
      retries: options?.retries,
      retryDelayMs: options?.retryDelayMs
    });
  }
}

class OAuthResource {
  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string | undefined,
    private readonly clientSecret: string | undefined,
    private readonly defaultConfig: RequestConfig
  ) {}

  /**
   * Get an OAuth access token using client credentials.
   * Requires clientId and clientSecret to be configured.
   */
  async getToken(options?: RequestConfig) {
    if (!this.clientId || !this.clientSecret) {
      return [
        {
          kind: "config",
          message: "clientId and clientSecret are required for OAuth token",
          field: !this.clientId ? "clientId" : "clientSecret"
        },
        null
      ] as const;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    return requestForm({
      url: `${this.baseUrl}/oauth/token`,
      method: "POST",
      body,
      schema: OAuthTokenSchema,
      ...this.defaultConfig,
      ...options
    });
  }
}

export class Bold {
  private readonly identityKey: string;
  private readonly secretKey: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly environment: "sandbox" | "production";
  private readonly defaultConfig: RequestConfig;
  readonly oauth: OAuthResource;
  readonly payments: PaymentsResource;
  readonly terminals: TerminalsResource;
  readonly webhooks: WebhooksResource;

  constructor(opts: BoldOptions) {
    this.identityKey = opts.identityKey;
    this.secretKey = opts.secretKey ?? "";
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.environment = opts.environment ?? "sandbox";

    this.defaultConfig = {
      timeoutMs: opts.timeoutMs ?? 30000,
      retries: opts.retries ?? 0,
      retryDelayMs: opts.retryDelayMs ?? 1000
    };

    const headers = this.authHeaders;

    this.oauth = new OAuthResource(
      this.oauthBaseUrl,
      this.clientId,
      this.clientSecret,
      this.defaultConfig
    );

    this.payments = new PaymentsResource(
      this,
      this.integrationsBaseUrl,
      headers,
      this.defaultConfig
    );

    this.terminals = new TerminalsResource(
      this.integrationsBaseUrl,
      headers,
      this.defaultConfig
    );

    this.webhooks = new WebhooksResource(
      this.integrationsBaseUrl,
      headers,
      this.secretKey,
      this.defaultConfig
    );
  }

  private get oauthBaseUrl() {
    return BASE_URLS.oauth[this.environment];
  }

  get integrationsBaseUrl() {
    return BASE_URLS.integrations[this.environment];
  }

  get paymentsBaseUrl() {
    return BASE_URLS.payments[this.environment];
  }

  private get authHeaders() {
    return {
      Authorization: `x-api-key ${this.identityKey}`
    };
  }
}
