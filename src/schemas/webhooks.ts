import { enum as enumZod, number, object, string, array } from "zod";
import type { output } from "zod";

export const WebhookEventTypeSchema = enumZod([
  "SALE_APPROVED",
  "SALE_REJECTED",
  "VOID_APPROVED",
  "VOID_REJECTED"
]);

export type WebhookEventType = output<typeof WebhookEventTypeSchema>;

export const TaxTypeSchema = enumZod(["VAT", "CONSUMPTION"]);

export type TaxType = output<typeof TaxTypeSchema>;

export const WebhookTaxSchema = object({
  base: number(),
  type: TaxTypeSchema,
  value: number()
});

export type WebhookTax = output<typeof WebhookTaxSchema>;

export const WebhookAmountSchema = object({
  currency: string().optional(),
  total: number(),
  taxes: array(WebhookTaxSchema).optional(),
  tip: number().optional()
});

export type WebhookAmount = output<typeof WebhookAmountSchema>;

export const CardBrandSchema = enumZod([
  "VISA",
  "VISA_ELECTRON",
  "MASTERCARD",
  "MAESTRO",
  "AMERICAN_EXPRESS",
  "CODENSA",
  "DINERS",
  "DISCOVER",
  "TUYA",
  "SODEXO",
  "OLIMPICA",
  "UNKNOWN"
]);

export type CardBrand = output<typeof CardBrandSchema>;

export const CaptureModeSchema = enumZod(["CHIP", "CONTACTLESS_CHIP"]);

export type CaptureMode = output<typeof CaptureModeSchema>;

export const CardTypeSchema = enumZod(["DEBIT", "CREDIT"]);

export type CardType = output<typeof CardTypeSchema>;

export const WebhookCardSchema = object({
  capture_mode: CaptureModeSchema.optional(),
  brand: CardBrandSchema.optional(),
  franchise: CardBrandSchema.optional(), // Alternative field name in some responses
  cardholder_name: string().optional(),
  terminal_id: string().optional(),
  masked_pan: string().optional(),
  installments: number().optional(),
  card_type: CardTypeSchema.optional()
});

export type WebhookCard = output<typeof WebhookCardSchema>;

export const PaymentMethodTypeSchema = enumZod([
  "CARD",
  "CARD_WEB",
  "SOFT_POS",
  "NEQUI",
  "BOTON_BANCOLOMBIA",
  "PSE"
]);

export type PaymentMethodType = output<typeof PaymentMethodTypeSchema>;

export const IntegrationTypeSchema = enumZod([
  "POS",
  "SOFT_POS",
  "API_INTEGRATIONS",
  "LINK"
]);

export type IntegrationType = output<typeof IntegrationTypeSchema>;

export const WebhookMetadataSchema = object({
  reference: string().optional()
}).loose();

export type WebhookMetadata = output<typeof WebhookMetadataSchema>;

export const WebhookDataSchema = object({
  payment_id: string(),
  merchant_id: string(),
  created_at: string(),
  amount: WebhookAmountSchema,
  user_id: string().optional(),
  metadata: WebhookMetadataSchema.optional(),
  bold_code: string().optional(),
  payer_email: string().optional(),
  payment_method: PaymentMethodTypeSchema.optional(),
  card: WebhookCardSchema.optional(),
  approval_number: string().optional(),
  integration: IntegrationTypeSchema.optional()
}).loose();

export type WebhookData = output<typeof WebhookDataSchema>;

export const WebhookNotificationSchema = object({
  id: string(),
  type: WebhookEventTypeSchema,
  subject: string(),
  source: string(),
  spec_version: string(),
  time: number(),
  data: WebhookDataSchema,
  datacontenttype: string()
}).loose();

export type WebhookNotification = output<typeof WebhookNotificationSchema>;

export const WebhookNotificationsResponseSchema = object({
  notifications: array(WebhookNotificationSchema)
});

export type WebhookNotificationsResponse = output<
  typeof WebhookNotificationsResponseSchema
>;
