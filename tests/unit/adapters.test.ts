import express from "express";
import { Hono } from "hono";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { boldWebhookHandler } from "../../src/adapters/express";
import { boldWebhook } from "../../src/adapters/hono";
import { createBoldWebhookRoute } from "../../src/adapters/next";
import { createBoldWebhookHandler } from "../../src/adapters/tanstack";
import { Bold } from "../../src/index";

const bold = new Bold({ identityKey: "ID", secretKey: "SEC" });
const event = {
  id: "evt_1",
  type: "SALE_APPROVED",
  data: { payment_id: "p1" }
};
const body = JSON.stringify(event);
const sign = (b: string = body, secret?: string) =>
  bold.webhooks.generateSignature(b, secret);

function webRequest(b: string, signature: string | null): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature !== null) headers.set("x-bold-signature", signature);
  return new Request("https://example.com/webhook", {
    method: "POST",
    body: b,
    headers
  });
}

describe("next adapter", () => {
  it("accepts a valid event", async () => {
    const onEvent = vi.fn();
    const route = createBoldWebhookRoute(bold, { onEvent });
    const res = await route(webRequest(body, sign()));
    expect(res.status).toBe(200);
    expect(onEvent).toHaveBeenCalledOnce();
  });

  it("rejects an invalid signature with 401", async () => {
    const route = createBoldWebhookRoute(bold, { onEvent: vi.fn() });
    const res = await route(webRequest(body, "deadbeef"));
    expect(res.status).toBe(401);
  });

  it("rejects an unparseable body with 400", async () => {
    const bad = "not json";
    const route = createBoldWebhookRoute(bold, { onEvent: vi.fn() });
    const res = await route(webRequest(bad, sign(bad)));
    expect(res.status).toBe(400);
  });

  it("returns 500 when the handler throws", async () => {
    const route = createBoldWebhookRoute(bold, {
      onEvent: () => {
        throw new Error("boom");
      }
    });
    const res = await route(webRequest(body, sign()));
    expect(res.status).toBe(500);
  });

  it("can skip verification", async () => {
    const onEvent = vi.fn();
    const route = createBoldWebhookRoute(bold, {
      onEvent,
      verifySignature: false
    });
    const res = await route(webRequest(body, null));
    expect(res.status).toBe(200);
    expect(onEvent).toHaveBeenCalledOnce();
  });
});

describe("tanstack adapter", () => {
  it("accepts a valid event", async () => {
    const onEvent = vi.fn();
    const handler = createBoldWebhookHandler(bold, { onEvent });
    const res = await handler({ request: webRequest(body, sign()) });
    expect(res.status).toBe(200);
    expect(onEvent).toHaveBeenCalledOnce();
  });

  it("rejects an invalid signature", async () => {
    const handler = createBoldWebhookHandler(bold, { onEvent: vi.fn() });
    const res = await handler({ request: webRequest(body, "bad") });
    expect(res.status).toBe(401);
  });
});

describe("hono adapter", () => {
  const app = new Hono();
  const seen: string[] = [];
  app.post(
    "/wh",
    boldWebhook(bold, {
      onEvent: (e) => {
        seen.push(e.type);
      }
    })
  );

  it("accepts a valid event", async () => {
    const res = await app.request("/wh", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/json",
        "x-bold-signature": sign()
      }
    });
    expect(res.status).toBe(200);
    expect(seen).toContain("SALE_APPROVED");
  });

  it("rejects an invalid signature", async () => {
    const res = await app.request("/wh", {
      method: "POST",
      body,
      headers: { "x-bold-signature": "bad" }
    });
    expect(res.status).toBe(401);
  });
});

describe("express adapter", () => {
  const app = express();
  app.post(
    "/wh",
    express.raw({ type: () => true }),
    boldWebhookHandler(bold, { onEvent: () => {} })
  );

  it("accepts a valid event", async () => {
    const res = await request(app)
      .post("/wh")
      .set("content-type", "application/json")
      .set("x-bold-signature", sign())
      .send(event);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it("rejects an invalid signature", async () => {
    const res = await request(app)
      .post("/wh")
      .set("content-type", "application/json")
      .set("x-bold-signature", "bad")
      .send(event);
    expect(res.status).toBe(401);
  });
});
