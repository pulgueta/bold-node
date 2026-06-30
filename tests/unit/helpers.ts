import { vi } from "vitest";

export interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockResponse {
  status?: number;
  json?: unknown;
  text?: string;
}

const NO_BODY_STATUS = new Set([204, 205, 304]);

/**
 * Stub global `fetch`. The responder receives the request URL + init and
 * returns a `{ status, json }` description. Every call is recorded in `calls`.
 */
export function mockFetch(
  responder: (url: string, init: RequestInit) => MockResponse
): { calls: MockCall[]; fn: ReturnType<typeof vi.fn> } {
  const calls: MockCall[] = [];

  const fn = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const headers = (init?.headers ?? {}) as Record<string, string>;

      let body: unknown;
      if (typeof init?.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }

      calls.push({ url, method: init?.method ?? "GET", headers, body });

      const result = responder(url, init ?? {});
      const status = result.status ?? 200;
      const payload =
        result.text ??
        (result.json !== undefined ? JSON.stringify(result.json) : "");
      const bodyInit = NO_BODY_STATUS.has(status) ? null : payload;

      return new Response(bodyInit, {
        status,
        headers: { "content-type": "application/json" }
      });
    }
  );

  vi.stubGlobal("fetch", fn);
  return { calls, fn };
}
