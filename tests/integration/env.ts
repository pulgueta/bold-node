import { Bold } from "../../src/index";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const creds = {
  apiIdentity: env("BOLD_API_INTEGRATIONS_IDENTITY_KEY"),
  apiSecret: env("BOLD_API_INTEGRATIONS_SECRET_KEY"),
  buttonIdentity: env("BOLD_PAYMENT_BUTTON_IDENTITY_KEY"),
  buttonSecret: env("BOLD_PAYMENT_BUTTON_SECRET_KEY"),
  onlineIdentity: env("BOLD_ONLINE_IDENTITY_KEY"),
  onlineSecret: env("BOLD_ONLINE_SECRET_KEY")
};

export const hasApiIntegrations = Boolean(creds.apiIdentity);
export const hasPaymentButton = Boolean(creds.buttonIdentity);
export const hasOnline = Boolean(creds.onlineIdentity);

/** A Bold client wired with whichever sandbox credentials are present. */
export function makeBold(): Bold {
  return new Bold({
    identityKey: creds.apiIdentity ?? creds.buttonIdentity ?? "missing-key",
    secretKey: creds.apiSecret ?? creds.buttonSecret,
    apiIntegrations: {
      identityKey: creds.apiIdentity,
      secretKey: creds.apiSecret
    },
    paymentButton: {
      identityKey: creds.buttonIdentity,
      secretKey: creds.buttonSecret
    },
    online: {
      identityKey: creds.onlineIdentity,
      secretKey: creds.onlineSecret
    },
    environment: "sandbox",
    timeoutMs: 25000,
    retries: 1
  });
}
