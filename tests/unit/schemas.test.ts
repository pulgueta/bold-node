import { describe, expect, it } from "vitest";
import {
  AppCheckoutRequestSchema,
  CreateLinkRequestSchema,
  OnlineAmountSchema,
  PaymentAttemptEnvelopeSchema,
  PaymentIntentEnvelopeSchema,
  PaymentIntentRequestSchema,
  PaymentMethodsResponseSchema,
  PseBankListEnvelopeSchema,
  WebhookNotificationSchema
} from "../../src/index";

describe("online payments schemas", () => {
  it("parses a minimal payment intent request", () => {
    const result = PaymentIntentRequestSchema.safeParse({
      reference_id: "ORD-1",
      amount: { currency: "COP", total_amount: 100000 }
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported currency", () => {
    const result = OnlineAmountSchema.safeParse({
      currency: "EUR",
      total_amount: 1
    });
    expect(result.success).toBe(false);
  });

  it("unwraps both bare and enveloped intent responses", () => {
    const bare = PaymentIntentEnvelopeSchema.safeParse({
      reference_id: "ORD-1",
      status: "ACTIVE"
    });
    expect(bare.success && bare.data.reference_id).toBe("ORD-1");

    const enveloped = PaymentIntentEnvelopeSchema.safeParse({
      payload: { reference_id: "ORD-2", status: "PAID" },
      errors: []
    });
    expect(enveloped.success && enveloped.data.reference_id).toBe("ORD-2");
  });

  it("parses a 3DS payment attempt response (enveloped)", () => {
    const result = PaymentAttemptEnvelopeSchema.safeParse({
      payload: {
        transaction_id: "CN123",
        next_actions: { redirect_method: "GET", redirect_url: "https://3ds" },
        status: "running"
      },
      errors: []
    });
    expect(result.success && result.data.transaction_id).toBe("CN123");
  });

  it("parses an enveloped PSE bank list", () => {
    const result = PseBankListEnvelopeSchema.safeParse({
      payload: { banks: [{ bank_code: "1234", bank_name: "BOLD CF" }] }
    });
    expect(result.success && result.data.banks[0]?.bank_name).toBe("BOLD CF");
  });
});

describe("payment link schemas", () => {
  it("requires amount_type", () => {
    expect(CreateLinkRequestSchema.safeParse({}).success).toBe(false);
    expect(
      CreateLinkRequestSchema.safeParse({ amount_type: "OPEN" }).success
    ).toBe(true);
  });

  it("rejects a too-long reference", () => {
    const result = CreateLinkRequestSchema.safeParse({
      amount_type: "CLOSE",
      reference: "x".repeat(61)
    });
    expect(result.success).toBe(false);
  });
});

describe("api integrations schemas", () => {
  it("accepts the empty payment_method selector", () => {
    const result = AppCheckoutRequestSchema.safeParse({
      amount: { currency: "COP", taxes: [], tip_amount: 0, total_amount: 1000 },
      payment_method: "",
      terminal_model: "N86",
      terminal_serial: "N860W000000",
      reference: "ref-1",
      user_email: "seller@shop.com"
    });
    expect(result.success).toBe(true);
  });

  it("parses a payment-methods response including PAY_BY_QR_BOLD", () => {
    const result = PaymentMethodsResponseSchema.safeParse({
      payload: {
        payment_methods: [
          { name: "POS", enabled: true },
          { name: "PAY_BY_QR_BOLD", enabled: false }
        ]
      },
      errors: []
    });
    expect(result.success).toBe(true);
  });
});

describe("webhook notification schema", () => {
  it("parses the documented CARD notification", () => {
    const sample = {
      id: "e4f8c1b9-3d02-4a7c-8e51-f672a9b3d0e4",
      type: "SALE_APPROVED",
      subject: "F8A5D6B7G2H1",
      source: "/payments",
      spec_version: "1.0",
      time: 1761060600000000000,
      data: {
        payment_id: "F8A5D6B7G2H1",
        merchant_id: "PQR6Y4T8Z3",
        created_at: "2025-10-21T11:30:15-05:00",
        amount: {
          currency: "COP",
          total: 1000,
          taxes: [{ base: 810, type: "VAT", value: 190 }],
          tip: 0
        },
        metadata: { reference: "ORD-20251021-00145" },
        payment_method: "CARD",
        card: {
          capture_mode: "CHIP",
          brand: "VISA",
          masked_pan: "451732******0019",
          installments: 1,
          card_type: "CREDIT"
        },
        integration: "POS"
      },
      datacontenttype: "application/json"
    };
    const result = WebhookNotificationSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });
});
