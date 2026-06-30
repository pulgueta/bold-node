import { afterEach, describe, expect, it, vi } from "vitest";
import { Bold } from "../../src/index";
import { mockFetch } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("http error mapping", () => {
  const bold = new Bold({ identityKey: "ID" });

  it("maps a non-2xx response to an http error with body", async () => {
    mockFetch(() => ({
      status: 400,
      json: { payload: { status_code: "X", message: "bad" }, errors: [] }
    }));
    const [err] = await bold.online.getIntent("ORD-1");
    expect(err?.kind).toBe("http");
    if (err?.kind === "http") {
      expect(err.status).toBe(400);
      expect((err.body as { errors: unknown[] }).errors).toEqual([]);
    }
  });

  it("maps a schema mismatch to invalid_response", async () => {
    mockFetch(() => ({ json: { totally: "wrong" } }));
    const [err] = await bold.online.listPseBanks();
    expect(err?.kind).toBe("invalid_response");
  });

  it("maps a non-JSON success body to a network error", async () => {
    mockFetch(() => ({ text: "<html>not json</html>" }));
    const [err] = await bold.online.getIntent("ORD-1");
    expect(err?.kind).toBe("network");
  });
});

describe("http retries", () => {
  it("retries retryable status codes then succeeds", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      return calls < 3
        ? { status: 503 }
        : { json: { reference_id: "ORD-1", status: "ACTIVE" } };
    });
    const bold = new Bold({ identityKey: "ID", retries: 3, retryDelayMs: 1 });
    const [err, data] = await bold.online.getIntent("ORD-1");
    expect(err).toBeNull();
    expect(data?.reference_id).toBe("ORD-1");
    expect(calls).toBe(3);
  });

  it("gives up after exhausting retries", async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      return { status: 503 };
    });
    const bold = new Bold({ identityKey: "ID", retries: 1, retryDelayMs: 1 });
    const [err] = await bold.online.getIntent("ORD-1");
    expect(err?.kind).toBe("http");
    expect(calls).toBe(2);
  });
});

describe("http timeout and abort", () => {
  function stubAbortAwareFetch() {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal;
            const fail = () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            };
            if (signal?.aborted) {
              fail();
              return;
            }
            signal?.addEventListener("abort", fail);
          })
      )
    );
  }

  it("returns a timeout error", async () => {
    stubAbortAwareFetch();
    const bold = new Bold({ identityKey: "ID", timeoutMs: 20 });
    const [err] = await bold.online.getIntent("ORD-1");
    expect(err?.kind).toBe("timeout");
  });

  it("returns an aborted error for a caller signal", async () => {
    stubAbortAwareFetch();
    const bold = new Bold({ identityKey: "ID" });
    const controller = new AbortController();
    controller.abort();
    const [err] = await bold.online.getIntent("ORD-1", {
      signal: controller.signal
    });
    expect(err?.kind).toBe("aborted");
  });
});
