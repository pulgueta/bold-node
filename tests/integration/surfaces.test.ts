import { beforeAll, describe, expect, it } from "vitest";
import type { Bold } from "../../src/index";
import { hasApiIntegrations, hasPaymentButton, makeBold } from "./env";

let bold: Bold;
beforeAll(() => {
  bold = makeBold();
});

describe.skipIf(!hasApiIntegrations)("API Integrations (sandbox)", () => {
  it("lists payment methods", async () => {
    const [err, data] = await bold.payments.getMethods();
    expect(err).toBeNull();
    expect(Array.isArray(data?.payload.payment_methods)).toBe(true);
  });

  it("lists bound terminals (or reports none)", async () => {
    const [err, data] = await bold.terminals.list();
    // Sandbox merchants may have no bound terminals → a 404 http error is OK.
    expect(err === null || err.kind === "http").toBe(true);
    if (err === null) {
      expect(Array.isArray(data?.payload.available_terminals)).toBe(true);
    }
  });
});

describe.skipIf(!hasPaymentButton)("Payment links (sandbox)", () => {
  it("lists payment methods with limits", async () => {
    const [err, data] = await bold.links.getPaymentMethods();
    expect(err).toBeNull();
    expect(data?.payment_methods).toBeDefined();
  });

  it("creates and reads a payment link", async () => {
    const [createErr, created] = await bold.links.create({
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: 50000,
        tip_amount: 0,
        taxes: []
      },
      description: "SDK integration test",
      payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"]
    });
    expect(createErr).toBeNull();
    expect(created?.payment_link).toMatch(/^LNK_/);
    expect(created?.url).toContain("checkout.bold.co");

    const [getErr, detail] = await bold.links.get(created?.payment_link ?? "");
    expect(getErr).toBeNull();
    expect(detail?.status).toBeDefined();
  });
});

describe.skipIf(!hasPaymentButton)("Transaction voucher (sandbox)", () => {
  it("returns NOT_FOUND for an unknown reference", async () => {
    const [err, data] = await bold.transactions.getStatus(
      "SDK_INTEGRATION_UNKNOWN"
    );
    // Unknown reference → 404 http error or a NO_TRANSACTION_FOUND voucher.
    expect(
      err?.kind === "http" || data?.payment_status === "NO_TRANSACTION_FOUND"
    ).toBe(true);
  });
});

describe.skipIf(!hasApiIntegrations)(
  "Webhook fallback lookup (sandbox)",
  () => {
    it("queries notifications without a transport error", async () => {
      const [err] = await bold.webhooks.getNotifications(
        "SDK_INTEGRATION_UNKNOWN"
      );
      // Either an empty result (200) or a 4xx — never a network/parse failure.
      expect(err === null || err.kind === "http").toBe(true);
    });
  }
);
