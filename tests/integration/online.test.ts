import { beforeAll, describe, expect, it } from "vitest";
import type { Bold } from "../../src/index";
import { hasOnline, makeBold } from "./env";

let bold: Bold;
beforeAll(() => {
  bold = makeBold();
});

// The Online Payments API requires separately-activated keys
// (BOLD_ONLINE_IDENTITY_KEY). These run only when those are present.
describe.skipIf(!hasOnline)("Online Payments API (sandbox)", () => {
  const reference = `SDK-IT-${Math.floor(Date.now() / 1000)}`;

  it("creates a payment intent", async () => {
    const [err, data] = await bold.online.createIntent({
      reference_id: reference,
      amount: { currency: "COP", total_amount: 100000, tip_amount: 0 },
      description: "SDK online integration test"
    });
    expect(err).toBeNull();
    expect(data?.reference_id).toBe(reference);
  });

  it("reads the payment intent back", async () => {
    const [err, data] = await bold.online.getIntent(reference);
    expect(err === null || err.kind === "http").toBe(true);
    if (err === null) {
      expect(data?.reference_id).toBe(reference);
    }
  });

  it("lists PSE banks", async () => {
    const [err, data] = await bold.online.listPseBanks();
    expect(err).toBeNull();
    expect(Array.isArray(data?.banks)).toBe(true);
  });
});
