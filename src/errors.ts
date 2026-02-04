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

export type BoldError = { kind: Kind } & (
  | NetworkError
  | HttpError
  | InvalidResponseError
  | ApiError
  | ConfigError
  | TimeoutError
  | AbortedError
);
