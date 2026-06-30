import { describe, expect, it } from "vitest";
import {
  Bold,
  generateWebhookSignature,
  parseWebhookPayload,
  verifyWebhookSignature
} from "../../src/index";

describe("webhook signature utilities", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ id: "evt_1", type: "SALE_APPROVED" });

  it("round-trips a generated signature", () => {
    const signature = generateWebhookSignature(payload, secret);
    expect(verifyWebhookSignature(payload, signature, secret).valid).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const signature = generateWebhookSignature(payload, secret);
    const result = verifyWebhookSignature(`${payload} `, signature, secret);
    expect(result.valid).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const signature = generateWebhookSignature(payload, secret);
    expect(verifyWebhookSignature(payload, signature, "nope").valid).toBe(
      false
    );
  });

  it("supports the empty-key sandbox mode", () => {
    const signature = generateWebhookSignature(payload, "");
    expect(verifyWebhookSignature(payload, signature, "").valid).toBe(true);
  });

  it("requires both payload and signature", () => {
    expect(verifyWebhookSignature("", "sig", secret).valid).toBe(false);
    expect(verifyWebhookSignature(payload, "", secret).valid).toBe(false);
  });

  it("accepts Buffer payloads", () => {
    const buffer = Buffer.from(payload, "utf-8");
    const signature = generateWebhookSignature(buffer, secret);
    expect(verifyWebhookSignature(buffer, signature, secret).valid).toBe(true);
  });

  it("parses JSON and returns null for invalid JSON", () => {
    expect(parseWebhookPayload<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(parseWebhookPayload("not json")).toBeNull();
  });
});

describe("bold.webhooks helpers", () => {
  const bold = new Bold({ identityKey: "id", secretKey: "s3cr3t" });

  it("verifies using the configured secret", () => {
    const payload = JSON.stringify({ ok: true });
    const signature = bold.webhooks.generateSignature(payload);
    expect(bold.webhooks.verify(payload, signature).valid).toBe(true);
  });

  it("supports a per-call secret override", () => {
    const payload = "{}";
    const signature = bold.webhooks.generateSignature(payload, "other");
    expect(bold.webhooks.verify(payload, signature, "other").valid).toBe(true);
    expect(bold.webhooks.verify(payload, signature).valid).toBe(false);
  });
});
