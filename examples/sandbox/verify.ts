/**
 * Sandbox verification app.
 *
 * Exercises every Bold integration surface the configured sandbox keys allow
 * and prints a pass/fail report. Run with: `pnpm sandbox`.
 *
 * Reads credentials from `.env` (see `.env.example`). Surfaces with no key are
 * skipped. Exits non-zero if any executed check fails.
 */
import { existsSync } from "node:fs";
import type { BoldError } from "../../src/index";
import { Bold } from "../../src/index";

if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // ignore
  }
}

const env = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

const bold = new Bold({
  identityKey:
    env("BOLD_API_INTEGRATIONS_IDENTITY_KEY") ??
    env("BOLD_PAYMENT_BUTTON_IDENTITY_KEY") ??
    "",
  secretKey: env("BOLD_API_INTEGRATIONS_SECRET_KEY"),
  apiIntegrations: {
    identityKey: env("BOLD_API_INTEGRATIONS_IDENTITY_KEY"),
    secretKey: env("BOLD_API_INTEGRATIONS_SECRET_KEY")
  },
  paymentButton: {
    identityKey: env("BOLD_PAYMENT_BUTTON_IDENTITY_KEY"),
    secretKey: env("BOLD_PAYMENT_BUTTON_SECRET_KEY")
  },
  online: {
    identityKey: env("BOLD_ONLINE_IDENTITY_KEY"),
    secretKey: env("BOLD_ONLINE_SECRET_KEY")
  },
  environment: "sandbox",
  retries: 1
});

const results: { name: string; ok: boolean }[] = [];

function report(name: string, ok: boolean, detail: string): void {
  results.push({ name, ok });
  console.log(`${ok ? "✅" : "❌"} ${name.padEnd(28)} ${detail}`);
}

function errText(error: BoldError): string {
  if (error.kind === "http") return `http ${error.status}`;
  if (error.kind === "invalid_response") return "invalid_response";
  return error.kind;
}

async function main(): Promise<void> {
  console.log("Bold sandbox verification\n");

  // 1) Local webhook signature roundtrip (no network).
  const body = JSON.stringify({ id: "evt", type: "SALE_APPROVED" });
  const signature = bold.webhooks.generateSignature(body, "demo-secret");
  const verified = bold.webhooks.verify(body, signature, "demo-secret").valid;
  report("webhook signature", verified, "HMAC-SHA256 generate + verify");

  // 2) API Integrations.
  if (env("BOLD_API_INTEGRATIONS_IDENTITY_KEY")) {
    const [err, data] = await bold.payments.getMethods();
    report(
      "payments.getMethods",
      err === null,
      err ? errText(err) : `${data.payload.payment_methods.length} methods`
    );

    const [tErr, tData] = await bold.terminals.list();
    report(
      "terminals.list",
      tErr === null || tErr.kind === "http",
      tErr
        ? errText(tErr)
        : `${tData.payload.available_terminals.length} terminals`
    );
  } else {
    console.log("⏭️  API Integrations skipped (no key)");
  }

  // 3) Payment links + voucher.
  if (env("BOLD_PAYMENT_BUTTON_IDENTITY_KEY")) {
    const [mErr, mData] = await bold.links.getPaymentMethods();
    report(
      "links.getPaymentMethods",
      mErr === null,
      mErr
        ? errText(mErr)
        : `${Object.keys(mData.payment_methods).length} methods`
    );

    const [cErr, created] = await bold.links.create({
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: 50000,
        tip_amount: 0,
        taxes: []
      },
      description: "Sandbox verification",
      payment_methods: ["CREDIT_CARD", "PSE", "NEQUI"]
    });
    report(
      "links.create",
      cErr === null && Boolean(created?.payment_link),
      cErr ? errText(cErr) : `${created.payment_link}`
    );

    if (cErr === null) {
      const [gErr, detail] = await bold.links.get(created.payment_link);
      report(
        "links.get",
        gErr === null,
        gErr ? errText(gErr) : `status=${detail.status}`
      );
    }

    const [vErr, voucher] = await bold.transactions.getStatus(
      "SANDBOX_VERIFY_UNKNOWN"
    );
    report(
      "transactions.getStatus",
      vErr?.kind === "http" ||
        voucher?.payment_status === "NO_TRANSACTION_FOUND",
      vErr ? errText(vErr) : `status=${voucher.payment_status}`
    );
  } else {
    console.log("⏭️  Payment links skipped (no key)");
  }

  // 4) Online Payments API (BETA, activated keys only).
  if (env("BOLD_ONLINE_IDENTITY_KEY")) {
    const reference = `SANDBOX-VERIFY-${Math.floor(Date.now() / 1000)}`;
    const [iErr, intent] = await bold.online.createIntent({
      reference_id: reference,
      amount: { currency: "COP", total_amount: 100000 },
      description: "Sandbox verification"
    });
    report(
      "online.createIntent",
      iErr === null,
      iErr ? errText(iErr) : `${intent.reference_id}`
    );

    const [bErr, banks] = await bold.online.listPseBanks();
    report(
      "online.listPseBanks",
      bErr === null,
      bErr ? errText(bErr) : `${banks.banks.length} banks`
    );
  } else {
    console.log("⏭️  Online Payments API skipped (no key)");
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed.`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
