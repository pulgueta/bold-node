import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_URLS, Bold, resolveCredential } from "../../src/index";
import { mockFetch } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("credential resolution", () => {
  it("falls back to the top-level keys", () => {
    expect(resolveCredential({ identityKey: "ID", secretKey: "S" })).toEqual({
      identityKey: "ID",
      secretKey: "S"
    });
  });

  it("prefers surface overrides", () => {
    const resolved = resolveCredential(
      { identityKey: "ID" },
      { identityKey: "OVERRIDE" }
    );
    expect(resolved.identityKey).toBe("OVERRIDE");
  });

  it("defaults the secret to an empty string", () => {
    expect(resolveCredential({ identityKey: "ID" }).secretKey).toBe("");
  });
});

describe("Bold base urls", () => {
  it("uses sandbox by default", () => {
    const bold = new Bold({ identityKey: "ID" });
    expect(bold.environment).toBe("sandbox");
    expect(bold.onlineBaseUrl).toBe("https://api.online.payments.bold.co");
    expect(bold.integrationsBaseUrl).toBe("https://integrations.api.bold.co");
    expect(bold.paymentsBaseUrl).toBe("https://payments.api.bold.co");
  });

  it("exposes distinct oauth hosts per environment", () => {
    expect(BASE_URLS.oauth.production).toBe("https://api.bold.co");
    expect(BASE_URLS.oauth.sandbox).toBe("https://api.sandbox.bold.co");
  });
});

describe("per-surface credentials", () => {
  it("the online resource sends its override identity key", async () => {
    const bold = new Bold({
      identityKey: "MAIN",
      online: { identityKey: "ONLINE_KEY" }
    });
    const { calls } = mockFetch(() => ({
      json: { reference_id: "R", status: "ACTIVE" }
    }));
    await bold.online.createIntent({
      reference_id: "R",
      amount: { currency: "COP", total_amount: 1 }
    });
    expect(calls[0]?.headers["Authorization"]).toBe("x-api-key ONLINE_KEY");
  });

  it("api integrations and online use different keys", async () => {
    const bold = new Bold({
      identityKey: "MAIN",
      apiIntegrations: { identityKey: "API_KEY" },
      online: { identityKey: "ONLINE_KEY" }
    });
    const { calls } = mockFetch(() => ({
      json: { payload: { payment_methods: [] }, errors: [] }
    }));
    await bold.payments.getMethods();
    expect(calls[0]?.headers["Authorization"]).toBe("x-api-key API_KEY");
  });
});

describe("oauth config guard", () => {
  it("returns a config error without client credentials", async () => {
    const bold = new Bold({ identityKey: "ID" });
    const [err] = await bold.oauth.getToken();
    expect(err?.kind).toBe("config");
  });
});
