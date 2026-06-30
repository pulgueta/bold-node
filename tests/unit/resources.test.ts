import { afterEach, describe, expect, it, vi } from "vitest";
import { Bold } from "../../src/index";
import { mockFetch } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

const bold = new Bold({ identityKey: "ID", secretKey: "SEC" });

describe("online payments resource", () => {
  it("creates a payment intent", async () => {
    const { calls } = mockFetch(() => ({
      json: { reference_id: "ORD-1", status: "ACTIVE" }
    }));
    const [err, data] = await bold.online.createIntent({
      reference_id: "ORD-1",
      amount: { currency: "COP", total_amount: 100000 }
    });
    expect(err).toBeNull();
    expect(data?.reference_id).toBe("ORD-1");
    expect(calls[0]?.url).toBe(
      "https://api.online.payments.bold.co/v1/payment-intent"
    );
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.headers["Authorization"]).toBe("x-api-key ID");
    expect((calls[0]?.body as { reference_id: string }).reference_id).toBe(
      "ORD-1"
    );
  });

  it("gets a payment intent by reference", async () => {
    const { calls } = mockFetch(() => ({
      json: { payload: { reference_id: "ORD 1", status: "PAID" }, errors: [] }
    }));
    const [err, data] = await bold.online.getIntent("ORD 1");
    expect(err).toBeNull();
    expect(data?.status).toBe("PAID");
    expect(calls[0]?.url).toBe(
      "https://api.online.payments.bold.co/v1/payment-intent/ORD%201"
    );
  });

  it("executes a payment attempt", async () => {
    const { calls } = mockFetch(() => ({
      json: { transaction_id: "TXN1", status: "RUNNING" }
    }));
    const [err, data] = await bold.online.pay({
      reference_id: "ORD-1",
      payer: { name: "Jane" },
      payment_method: {
        name: "CREDIT_CARD",
        card_number: "4111111111111111",
        cardholder_name: "Jane",
        expiration_month: 12,
        expiration_year: 2035,
        cvc: "123"
      }
    });
    expect(err).toBeNull();
    expect(data?.transaction_id).toBe("TXN1");
    expect(calls[0]?.url).toBe(
      "https://api.online.payments.bold.co/v1/payment"
    );
  });

  it("lists PSE banks (enveloped)", async () => {
    mockFetch(() => ({
      json: { payload: { banks: [{ bank_code: "1", bank_name: "BOLD CF" }] } }
    }));
    const [err, data] = await bold.online.listPseBanks();
    expect(err).toBeNull();
    expect(data?.banks[0]?.bank_name).toBe("BOLD CF");
  });

  it("voids a payment (204 no content)", async () => {
    const { calls } = mockFetch(() => ({ status: 204 }));
    const [err, data] = await bold.online.voidPayment("TXN1");
    expect(err).toBeNull();
    expect(data).toBeUndefined();
    expect(calls[0]?.url).toBe(
      "https://api.online.payments.bold.co/v1/payment/void"
    );
    expect((calls[0]?.body as { transaction_id: string }).transaction_id).toBe(
      "TXN1"
    );
  });

  it("refunds a payment (204 no content)", async () => {
    const { calls } = mockFetch(() => ({ status: 204 }));
    const [err] = await bold.online.refund({
      reference_id: "ORD-1",
      transaction_id: "TXN1",
      reason: "customer request"
    });
    expect(err).toBeNull();
    expect(calls[0]?.url).toBe(
      "https://api.online.payments.bold.co/v1/payment/refund"
    );
  });

  it("gets a refund status", async () => {
    mockFetch(() => ({
      json: { payload: { transaction_id: "TXN1", status: "PROCESSING" } }
    }));
    const [err, data] = await bold.online.getRefund("TXN1");
    expect(err).toBeNull();
    expect(data?.status).toBe("PROCESSING");
  });
});

describe("payment links resource", () => {
  it("creates a link", async () => {
    const { calls } = mockFetch(() => ({
      json: {
        payload: { payment_link: "LNK_1", url: "https://checkout" },
        errors: []
      }
    }));
    const [err, data] = await bold.links.create({ amount_type: "OPEN" });
    expect(err).toBeNull();
    expect(data?.payment_link).toBe("LNK_1");
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/online/link/v1"
    );
  });

  it("lists payment methods with limits", async () => {
    mockFetch(() => ({
      json: {
        payload: {
          payment_methods: { CREDIT_CARD: { max: 5000000, min: 1000 } }
        },
        errors: []
      }
    }));
    const [err, data] = await bold.links.getPaymentMethods();
    expect(err).toBeNull();
    expect(data?.payment_methods.CREDIT_CARD?.max).toBe(5000000);
  });

  it("gets a link by id", async () => {
    const { calls } = mockFetch(() => ({
      json: { id: "LNK_1", status: "ACTIVE" }
    }));
    const [err, data] = await bold.links.get("LNK_1");
    expect(err).toBeNull();
    expect(data?.status).toBe("ACTIVE");
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/online/link/v1/LNK_1"
    );
  });
});

describe("api integrations resources", () => {
  it("gets payment methods", async () => {
    const { calls } = mockFetch(() => ({
      json: {
        payload: { payment_methods: [{ name: "POS", enabled: true }] },
        errors: []
      }
    }));
    const [err, data] = await bold.payments.getMethods();
    expect(err).toBeNull();
    expect(data?.payload.payment_methods[0]?.name).toBe("POS");
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/payments/payment-methods"
    );
  });

  it("surfaces API errors as api_error", async () => {
    mockFetch(() => ({
      json: { payload: { integration_id: "" }, errors: [{ code: "X" }] }
    }));
    const [err] = await bold.payments.create({
      amount: { currency: "COP", taxes: [], tip_amount: 0, total_amount: 1000 },
      payment_method: "POS",
      terminal_model: "N86",
      terminal_serial: "N860W000000",
      reference: "ref",
      user_email: "a@b.com"
    });
    expect(err?.kind).toBe("api_error");
  });

  it("lists terminals", async () => {
    const { calls } = mockFetch(() => ({
      json: {
        payload: {
          available_terminals: [
            {
              terminal_model: "N86",
              terminal_serial: "N860",
              status: "BINDED",
              name: "S"
            }
          ]
        },
        errors: []
      }
    }));
    const [err, data] = await bold.terminals.list();
    expect(err).toBeNull();
    expect(data?.payload.available_terminals).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/payments/binded-terminals"
    );
  });
});

describe("transactions resource", () => {
  it("gets voucher status", async () => {
    const { calls } = mockFetch(() => ({
      json: {
        link_id: "BTN_1",
        total: 1000,
        subtotal: 900,
        payment_status: "NO_TRANSACTION_FOUND"
      }
    }));
    const [err, data] = await bold.transactions.getStatus("BTN_1");
    expect(err).toBeNull();
    expect(data?.payment_status).toBe("NO_TRANSACTION_FOUND");
    expect(calls[0]?.url).toBe(
      "https://payments.api.bold.co/v2/payment-voucher/BTN_1"
    );
  });

  it("payments.getStatus delegates to transactions", async () => {
    const { calls } = mockFetch(() => ({
      json: {
        link_id: "BTN_2",
        total: 1,
        subtotal: 1,
        payment_status: "APPROVED"
      }
    }));
    const [err, data] = await bold.payments.getStatus("BTN_2");
    expect(err).toBeNull();
    expect(data?.payment_status).toBe("APPROVED");
    expect(calls[0]?.url).toBe(
      "https://payments.api.bold.co/v2/payment-voucher/BTN_2"
    );
  });
});

describe("webhooks resource fallback lookup", () => {
  it("queries notifications by payment id", async () => {
    const { calls } = mockFetch(() => ({ json: { notifications: [] } }));
    const [err, data] = await bold.webhooks.getNotifications("pay_1");
    expect(err).toBeNull();
    expect(data?.notifications).toEqual([]);
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/payments/webhook/notifications/pay_1"
    );
  });

  it("queries notifications by external reference", async () => {
    const { calls } = mockFetch(() => ({ json: { notifications: [] } }));
    await bold.webhooks.getNotifications("ORD-1", {
      isExternalReference: true
    });
    expect(calls[0]?.url).toBe(
      "https://integrations.api.bold.co/payments/webhook/notifications/ORD-1?is_external_reference=true"
    );
  });
});
