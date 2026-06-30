import type { output } from "zod";
import {
  array,
  boolean,
  enum as enumZod,
  number,
  object,
  string,
  union,
  unknown
} from "zod";
import { envelopeOrBare } from "./common";

// --- Enums ---------------------------------------------------------------

export const OnlineCurrencySchema = enumZod(["COP", "USD"]);
export type OnlineCurrency = output<typeof OnlineCurrencySchema>;

export const OnlineTaxTypeSchema = enumZod(["VAT", "CONSUMPTION"]);
export type OnlineTaxType = output<typeof OnlineTaxTypeSchema>;

export const PaymentIntentStatusSchema = enumZod([
  "ACTIVE",
  "PROCESSING",
  "PENDING",
  "DISABLED",
  "PAID",
  "EXPIRED"
]);
export type PaymentIntentStatus = output<typeof PaymentIntentStatusSchema>;

export const PaymentAttemptStatusSchema = enumZod([
  "APPROVED",
  "REJECTED",
  "RUNNING"
]);
export type PaymentAttemptStatus = output<typeof PaymentAttemptStatusSchema>;

export const PaymentQueryStatusSchema = enumZod([
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "PENDING"
]);
export type PaymentQueryStatus = output<typeof PaymentQueryStatusSchema>;

export const RefundStatusSchema = enumZod([
  "APPROVED",
  "REJECTED",
  "PROCESSING"
]);
export type RefundStatus = output<typeof RefundStatusSchema>;

export const PersonTypeSchema = enumZod(["NATURAL_PERSON", "LEGAL_PERSON"]);
export type PersonType = output<typeof PersonTypeSchema>;

export const OnlineDocumentTypeSchema = enumZod([
  "CEDULA",
  "CEDULA_EXTRANJERIA",
  "TARJETA_IDENTIDAD",
  "PASAPORTE",
  "NIT"
]);
export type OnlineDocumentType = output<typeof OnlineDocumentTypeSchema>;

export const RedirectMethodSchema = enumZod(["POST", "GET"]);
export type RedirectMethod = output<typeof RedirectMethodSchema>;

export const QrFormatSchema = enumZod(["TEXT", "PLAIN_BASE64", "BOLD_BASE64"]);
export type QrFormat = output<typeof QrFormatSchema>;

export const OnlinePaymentMethodNameSchema = enumZod([
  "CREDIT_CARD",
  "PSE",
  "NEQUI",
  "BOTON_BANCOLOMBIA",
  "QR"
]);
export type OnlinePaymentMethodName = output<
  typeof OnlinePaymentMethodNameSchema
>;

// --- Shared value objects -----------------------------------------------

export const OnlineTaxSchema = object({
  type: OnlineTaxTypeSchema,
  base: number(),
  value: number()
});
export type OnlineTax = output<typeof OnlineTaxSchema>;

export const OnlineAmountSchema = object({
  currency: OnlineCurrencySchema,
  total_amount: number(),
  tip_amount: number().optional(),
  taxes: array(OnlineTaxSchema).optional()
});
export type OnlineAmount = output<typeof OnlineAmountSchema>;

/**
 * Address shape is loose: the docs alternate between `zip_code`/`postal_code`
 * and `country`/`country_code` across examples, so both spellings are accepted.
 */
export const OnlineAddressSchema = object({
  street1: string(),
  street2: string().optional(),
  city: string(),
  zip_code: string().optional(),
  postal_code: string().optional(),
  province: string().optional(),
  state: string().optional(),
  country: string().optional(),
  country_code: string().optional(),
  phone: string().optional()
}).loose();
export type OnlineAddress = output<typeof OnlineAddressSchema>;

export const MetadataEntrySchema = object({
  key: string().optional(),
  value: string().optional()
}).loose();
export type MetadataEntry = output<typeof MetadataEntrySchema>;

/** Metadata is sent as a single object or a list of up to 3 entries. */
export const MetadataSchema = union([
  array(MetadataEntrySchema),
  MetadataEntrySchema
]);
export type Metadata = output<typeof MetadataSchema>;

export const OnlineCustomerSchema = object({
  name: string(),
  phone: string().optional(),
  email: string().optional(),
  billing_address: OnlineAddressSchema.optional(),
  shipping_address: OnlineAddressSchema.optional()
}).loose();
export type OnlineCustomer = output<typeof OnlineCustomerSchema>;

export const OnlinePayerSchema = object({
  person_type: PersonTypeSchema.optional(),
  name: string(),
  phone: string().optional(),
  email: string().optional(),
  document_type: OnlineDocumentTypeSchema.optional(),
  document_number: string().optional(),
  billing_address: OnlineAddressSchema.optional()
}).loose();
export type OnlinePayer = output<typeof OnlinePayerSchema>;

/**
 * Device data used by the fraud engine / 3DS challenge. Sizes, OS and browser
 * should be the REAL device values so 3DS can render correctly. Several fields
 * are required only when a 3DS challenge is triggered.
 */
export const DeviceFingerprintSchema = object({
  ip: string().optional(),
  device_type: string().optional(),
  os: string().optional(),
  browser: string().optional(),
  accept_header: string().optional(),
  user_agent: string().optional(),
  java_enabled: boolean().optional(),
  language: string().optional(),
  color_depth: number().optional(),
  screen_height: number().optional(),
  screen_width: number().optional(),
  time_zone_offset: number().optional(),
  latitude: string().nullable().optional(),
  longitude: string().nullable().optional(),
  model: string().nullable().optional(),
  platform: string().nullable().optional()
}).loose();
export type DeviceFingerprint = output<typeof DeviceFingerprintSchema>;

// --- Payment methods (request) ------------------------------------------

export const CreditCardMethodSchema = object({
  name: enumZod(["CREDIT_CARD"]),
  card_number: string(),
  cardholder_name: string(),
  expiration_month: union([string(), number()]),
  expiration_year: union([string(), number()]),
  installments: number().optional(),
  cvc: string(),
  billing_address: OnlineAddressSchema.optional()
});
export type CreditCardMethod = output<typeof CreditCardMethodSchema>;

export const PseMethodSchema = object({
  name: enumZod(["PSE"]),
  bank_code: union([string(), number()]),
  bank_name: string().optional()
});
export type PseMethod = output<typeof PseMethodSchema>;

export const NequiMethodSchema = object({ name: enumZod(["NEQUI"]) }).loose();
export type NequiMethod = output<typeof NequiMethodSchema>;

export const BancolombiaMethodSchema = object({
  name: enumZod(["BOTON_BANCOLOMBIA"])
}).loose();
export type BancolombiaMethod = output<typeof BancolombiaMethodSchema>;

export const QrMethodSchema = object({
  name: enumZod(["QR"]),
  qr_format: QrFormatSchema.optional()
});
export type QrMethod = output<typeof QrMethodSchema>;

export const OnlinePaymentMethodSchema = union([
  CreditCardMethodSchema,
  PseMethodSchema,
  NequiMethodSchema,
  BancolombiaMethodSchema,
  QrMethodSchema
]);
export type OnlinePaymentMethod = output<typeof OnlinePaymentMethodSchema>;

// --- Requests ------------------------------------------------------------

export const PaymentIntentRequestSchema = object({
  reference_id: string(),
  amount: OnlineAmountSchema,
  expiration_date: string().optional(),
  description: string().optional(),
  metadata: MetadataSchema.optional(),
  customer: OnlineCustomerSchema.optional(),
  payment_method: OnlinePaymentMethodSchema.optional(),
  callback_url: string().optional(),
  device_fingerprint: DeviceFingerprintSchema.optional()
});
export type PaymentIntentRequest = output<typeof PaymentIntentRequestSchema>;

export const PaymentAttemptRequestSchema = object({
  reference_id: string(),
  metadata: MetadataSchema.optional(),
  payer: OnlinePayerSchema,
  payment_method: OnlinePaymentMethodSchema,
  device_fingerprint: DeviceFingerprintSchema.optional()
});
export type PaymentAttemptRequest = output<typeof PaymentAttemptRequestSchema>;

export const PaymentVoidRequestSchema = object({ transaction_id: string() });
export type PaymentVoidRequest = output<typeof PaymentVoidRequestSchema>;

export const PaymentRefundRequestSchema = object({
  reference_id: string(),
  transaction_id: string(),
  reason: string()
});
export type PaymentRefundRequest = output<typeof PaymentRefundRequestSchema>;

// --- Responses (loose: BETA API may add fields) -------------------------

export const PaymentIntentResponseSchema = object({
  reference_id: string(),
  amount: OnlineAmountSchema.optional(),
  description: string().nullable().optional(),
  creation_date: union([string(), number()]).optional(),
  expiration_date: union([string(), number()]).nullable().optional(),
  status: PaymentIntentStatusSchema.optional(),
  status_detail: string().optional(),
  bold_transaction_id: string().nullable().optional(),
  callback_url: string().nullable().optional(),
  metadata: unknown().optional(),
  customer: OnlineCustomerSchema.optional(),
  test: boolean().optional()
}).loose();
export type PaymentIntentResponse = output<typeof PaymentIntentResponseSchema>;

export const NextActionSchema = object({
  redirect_url: string().optional(),
  redirect_method: RedirectMethodSchema.optional(),
  qr_payload: string().optional(),
  expires_at: union([string(), number()]).optional()
}).loose();
export type NextAction = output<typeof NextActionSchema>;

export const PaymentAttemptResponseSchema = object({
  transaction_id: string(),
  next_actions: NextActionSchema.nullable().optional(),
  status: union([PaymentAttemptStatusSchema, string()]),
  status_detail: string().optional(),
  uuid_token: string().optional()
}).loose();
export type PaymentAttemptResponse = output<
  typeof PaymentAttemptResponseSchema
>;

export const PaymentAttemptStatusResponseSchema = object({
  transaction_id: string(),
  reference_id: string().optional(),
  status: union([PaymentQueryStatusSchema, string()]),
  amount: OnlineAmountSchema.optional(),
  payment_method: string().optional(),
  payer: OnlinePayerSchema.optional(),
  attempt_date: string().optional(),
  metadata: unknown().optional()
}).loose();
export type PaymentAttemptStatusResponse = output<
  typeof PaymentAttemptStatusResponseSchema
>;

export const PaymentRefundResponseSchema = object({
  transaction_id: string(),
  status: RefundStatusSchema,
  date_applied: string().optional()
}).loose();
export type PaymentRefundResponse = output<typeof PaymentRefundResponseSchema>;

export const PseBankSchema = object({
  bank_code: string(),
  bank_name: string()
});
export type PseBank = output<typeof PseBankSchema>;

export const PseBankListSchema = object({ banks: array(PseBankSchema) });
export type PseBankList = output<typeof PseBankListSchema>;

// --- Envelope-tolerant response schemas used by the resource ------------

export const PaymentIntentEnvelopeSchema = envelopeOrBare(
  PaymentIntentResponseSchema
);
export const PaymentAttemptEnvelopeSchema = envelopeOrBare(
  PaymentAttemptResponseSchema
);
export const PaymentAttemptStatusEnvelopeSchema = envelopeOrBare(
  PaymentAttemptStatusResponseSchema
);
export const PaymentRefundEnvelopeSchema = envelopeOrBare(
  PaymentRefundResponseSchema
);
export const PseBankListEnvelopeSchema = envelopeOrBare(PseBankListSchema);
