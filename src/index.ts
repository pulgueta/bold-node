// --- Client ---------------------------------------------------------------
export { Bold } from "./bold";
export type {
  BoldCredential,
  BoldEnvironment,
  BoldOptions,
  ResolvedCredential,
  ResourceContext
} from "./config";
// --- Config / options -----------------------------------------------------
export {
  authHeaders,
  BASE_URLS,
  resolveCredential
} from "./config";
export type {
  AbortedError,
  ApiError,
  BoldError,
  ConfigError,
  HttpError,
  InvalidResponseError,
  Kind,
  NetworkError,
  ResultTuple,
  TimeoutError
} from "./errors";
export type { RequestConfig } from "./http";
// --- HTTP / errors --------------------------------------------------------
export { hasApiErrors } from "./http";
export { LinksResource } from "./resources/links";
// --- Resource classes (for typing / advanced use) -------------------------
export { OAuthResource } from "./resources/oauth";
export { OnlineResource } from "./resources/online";
export { PaymentsResource } from "./resources/payments";
export { TerminalsResource } from "./resources/terminals";
export { TransactionsResource } from "./resources/transactions";
export { WebhooksResource } from "./resources/webhooks";
// --- Schemas + inferred types ---------------------------------------------
export * from "./schemas";
export type { WebhookVerificationResult } from "./webhooks";
// --- Webhook utilities ----------------------------------------------------
export {
  generateWebhookSignature,
  parseWebhookPayload,
  verifyWebhookSignature
} from "./webhooks";
