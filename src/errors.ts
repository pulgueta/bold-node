import type { core } from "zod";

export type ResultTuple<Error, Success> = [Error, null] | [null, Success];

export type Kind =
  | "network"
  | "http"
  | "invalid_response"
  | "api_error"
  | "config"
  | "timeout"
  | "aborted";

export interface NetworkError {
  readonly message: string;
  readonly cause?: unknown;
}

export interface HttpError {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;
}

export interface InvalidResponseError {
  readonly issues: core.$ZodIssue[];
  readonly raw: unknown;
}

export interface ApiError {
  readonly errors: unknown[];
}

export interface ConfigError {
  readonly message: string;
  readonly field?: string;
}

export interface TimeoutError {
  readonly message: string;
  readonly timeoutMs: number;
}

export interface AbortedError {
  readonly message: string;
}

/**
 * A discriminated union on `kind` so `error.kind === "http"` narrows to the
 * matching shape (e.g. `error.status`).
 */
export type BoldError =
  | ({ kind: "network" } & NetworkError)
  | ({ kind: "http" } & HttpError)
  | ({ kind: "invalid_response" } & InvalidResponseError)
  | ({ kind: "api_error" } & ApiError)
  | ({ kind: "config" } & ConfigError)
  | ({ kind: "timeout" } & TimeoutError)
  | ({ kind: "aborted" } & AbortedError);
