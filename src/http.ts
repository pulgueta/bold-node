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

interface BaseRequestOptions<T> extends RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  schema: ZodType<T>;
}

interface JsonRequestOptions<T> extends BaseRequestOptions<T> {
  body?: unknown;
  contentType?: "json";
}

interface FormRequestOptions<T> extends BaseRequestOptions<T> {
  body: URLSearchParams;
  contentType: "form";
}

type RequestOptions<T> = JsonRequestOptions<T> | FormRequestOptions<T>;

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

async function executeRequest<T>(options: RequestOptions<T>) {
  const {
    url,
    method,
    headers = {},
    body,
    schema,
    timeoutMs = 30000,
    signal: externalSignal,
    retries = 0,
    retryDelayMs = 1000,
    idempotencyKey
  } = options;

  const contentType =
    "contentType" in options && options.contentType === "form"
      ? "application/x-www-form-urlencoded"
      : "application/json";

  const requestHeaders: Record<string, string> = {
    "Content-Type": contentType,
    Accept: "application/json",
    ...headers
  };

  if (idempotencyKey) {
    requestHeaders["Idempotency-Key"] = idempotencyKey;
  }

  const requestBody =
    body !== undefined
      ? contentType === "application/json"
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

      let raw: unknown;
      try {
        raw = await response.json();
      } catch (cause) {
        return [
          {
            kind: "network",
            message: "Failed to parse JSON response",
            cause
          },
          null
        ] as const;
      }

      const result = schema.safeParse(raw);

      if (!result.success) {
        return [
          {
            kind: "invalid_response",
            issues: result.error.issues,
            raw
          },
          null
        ] as const;
      }

      return [null, result.data] as const;
    } catch (cause) {
      cleanup();

      if (cause instanceof Error && cause.name === "AbortError") {
        if (externalSignal?.aborted) {
          return [
            {
              kind: "aborted",
              message: "Request was cancelled"
            },
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

export async function requestJson<const T>(
  options: Omit<JsonRequestOptions<T>, "contentType">
) {
  return executeRequest<T>({ ...options, contentType: "json" });
}

export async function requestForm<const T>(
  options: Omit<FormRequestOptions<T>, "contentType">
) {
  return executeRequest<T>({ ...options, contentType: "form" });
}

export function hasApiErrors(response: { errors?: unknown[] }) {
  return Array.isArray(response.errors) && response.errors.length > 0;
}
