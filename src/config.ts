import type { RequestConfig } from "./http";

export type BoldEnvironment = "sandbox" | "production";

/** A per-surface identity/secret key override. */
export interface BoldCredential {
  /** Identity key (a.k.a. API key) sent as `Authorization: x-api-key <key>`. */
  identityKey?: string;
  /** Secret key used to sign/verify webhooks for this surface. */
  secretKey?: string;
}

export interface BoldOptions {
  /** Default identity key used by every surface that has no override. */
  identityKey: string;
  /** Default secret key (webhook verification). */
  secretKey?: string;
  /** Selects sandbox vs production. Default: "sandbox". */
  environment?: BoldEnvironment;

  /** Credentials for API Integrations (datáfono app-checkout / terminals). */
  apiIntegrations?: BoldCredential;
  /** Credentials for the Payment Button / Link de pagos / voucher status. */
  paymentButton?: BoldCredential;
  /** Credentials for the Online Payments API (api.online.payments.bold.co). */
  online?: BoldCredential;

  /** OAuth client credentials (optional, legacy). */
  clientId?: string;
  clientSecret?: string;

  /** Request timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
  /** Retry attempts for transient failures. Default: 0. */
  retries?: number;
  /** Base delay in ms for exponential backoff. Default: 1000. */
  retryDelayMs?: number;
}

export const BASE_URLS = {
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
  },
  online: {
    sandbox: "https://api.online.payments.bold.co",
    production: "https://api.online.payments.bold.co"
  }
} as const;

export function authHeaders(identityKey: string): Record<string, string> {
  return { Authorization: `x-api-key ${identityKey}` };
}

export interface ResolvedCredential {
  identityKey: string;
  secretKey: string;
}

/** Resolve a surface's credential, falling back to the top-level keys. */
export function resolveCredential(
  opts: BoldOptions,
  surface?: BoldCredential
): ResolvedCredential {
  return {
    identityKey: surface?.identityKey ?? opts.identityKey,
    secretKey: surface?.secretKey ?? opts.secretKey ?? ""
  };
}

/** Shared context handed to every resource. */
export interface ResourceContext {
  baseUrl: string;
  identityKey: string;
  secretKey: string;
  defaultConfig: RequestConfig;
}
