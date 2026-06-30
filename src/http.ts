import type { ZodType } from "zod";

export interface RequestConfig {
  /** Request timeout in milliseconds. Default: 30000 (30 seconds) */
  timeoutMs?: number;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Number of retry attempts for transient failures. Default: 0 */
  retries?: number;
  /** Base delay in ms for exponential backoff. Default: 1000 */
  retryDelayMs?: number;
  /** Idempotency key for safe retries on POST/PUT requests */
  idempotencyKey?: string;
}

interface RequestInput extends RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  contentType?: "json" | "form";
}

interface JsonRequestOptions<T> extends RequestInput {
  schema: ZodType<T>;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused")
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTimeoutSignal(
  timeoutMs: number,
  externalSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanup = () => clearTimeout(timeoutId);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true
      });
    }
  }

  return { signal: controller.signal, cleanup };
}

/**
 * Shared transport: handles timeout, exponential-backoff retries and network
 * errors, returning the OK `Response` for the caller to read, or a `BoldError`
 * tuple. Non-2xx responses become `http` errors (after reading the body).
 */
async function performRequest(options: RequestInput) {
  const {
    url,
    method,
    headers = {},
    body,
    contentType = "json",
    timeoutMs = 30000,
    signal: externalSignal,
    retries = 0,
    retryDelayMs = 1000,
    idempotencyKey
  } = options;

  const contentTypeHeader =
    contentType === "form"
      ? "application/x-www-form-urlencoded"
      : "application/json";

  const requestHeaders: Record<string, string> = {
    "Content-Type": contentTypeHeader,
    Accept: "application/json",
    ...headers
  };

  if (idempotencyKey) {
    requestHeaders["Idempotency-Key"] = idempotencyKey;
  }

  const requestBody =
    body !== undefined
      ? contentType === "json"
        ? JSON.stringify(body)
        : (body as URLSearchParams).toString()
      : undefined;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= retries) {
    const { signal, cleanup } = createTimeoutSignal(timeoutMs, externalSignal);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal
      });

      cleanup();

      if (!response.ok) {
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < retries) {
          const delay = retryDelayMs * 2 ** attempt;
          await sleep(delay);
          attempt++;
          continue;
        }

        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          try {
            responseBody = await response.text();
          } catch {
            responseBody = null;
          }
        }

        return [
          {
            kind: "http",
            status: response.status,
            statusText: response.statusText,
            body: responseBody
          },
          null
        ] as const;
      }

      return [null, response] as const;
    } catch (cause) {
      cleanup();

      if (cause instanceof Error && cause.name === "AbortError") {
        if (externalSignal?.aborted) {
          return [
            { kind: "aborted", message: "Request was cancelled" },
            null
          ] as const;
        }

        return [
          {
            kind: "timeout",
            message: `Request timed out after ${timeoutMs}ms`,
            timeoutMs
          },
          null
        ] as const;
      }

      lastError = cause;

      if (isRetryableError(cause) && attempt < retries) {
        const delay = retryDelayMs * 2 ** attempt;
        await sleep(delay);
        attempt++;
        continue;
      }

      return [
        {
          kind: "network",
          message:
            cause instanceof Error ? cause.message : "Network request failed",
          cause
        },
        null
      ] as const;
    }
  }

  return [
    {
      kind: "network",
      message:
        lastError instanceof Error
          ? lastError.message
          : "Network request failed after retries",
      cause: lastError
    },
    null
  ] as const;
}

/** Perform a request and validate the JSON response body with a Zod schema. */
export async function requestJson<const T>(
  options: Omit<JsonRequestOptions<T>, "contentType"> & {
    contentType?: "json";
  }
) {
  const [error, response] = await performRequest({
    ...options,
    contentType: "json"
  });

  if (error) {
    return [error, null] as const;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (cause) {
    return [
      { kind: "network", message: "Failed to parse JSON response", cause },
      null
    ] as const;
  }

  const result = options.schema.safeParse(raw);

  if (!result.success) {
    return [
      { kind: "invalid_response", issues: result.error.issues, raw },
      null
    ] as const;
  }

  return [null, result.data] as const;
}

/** Perform a `application/x-www-form-urlencoded` request (used by OAuth). */
export async function requestForm<const T>(
  options: Omit<JsonRequestOptions<T>, "contentType"> & {
    body: URLSearchParams;
  }
) {
  const [error, response] = await performRequest({
    ...options,
    contentType: "form"
  });

  if (error) {
    return [error, null] as const;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (cause) {
    return [
      { kind: "network", message: "Failed to parse JSON response", cause },
      null
    ] as const;
  }

  const result = options.schema.safeParse(raw);

  if (!result.success) {
    return [
      { kind: "invalid_response", issues: result.error.issues, raw },
      null
    ] as const;
  }

  return [null, result.data] as const;
}

/**
 * Perform a request that returns no content (HTTP 204), e.g. void/refund.
 * On success resolves to `[null, undefined]`.
 */
export async function requestNoContent(
  options: Omit<RequestInput, "contentType"> & { contentType?: "json" }
) {
  const [error, response] = await performRequest({
    ...options,
    contentType: "json"
  });

  if (error) {
    return [error, null] as const;
  }

  // Drain any body so the connection can be reused.
  try {
    await response.arrayBuffer();
  } catch {
    // ignore
  }

  return [null, undefined] as const;
}

export function hasApiErrors(response: { errors?: unknown[] }) {
  return Array.isArray(response.errors) && response.errors.length > 0;
}
