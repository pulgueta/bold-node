import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Notification Types
// ─────────────────────────────────────────────────────────────────────────────

export const WebhookEventTypeSchema = z.enum([
  "SALE_APPROVED",
  "SALE_REJECTED",
  "VOID_APPROVED",
  "VOID_REJECTED"
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

export const TaxTypeSchema = z.enum(["VAT", "CONSUMPTION"]);

export type TaxType = z.infer<typeof TaxTypeSchema>;

export const WebhookTaxSchema = z.object({
  base: z.number(),
  type: TaxTypeSchema,
  value: z.number()
});

export type WebhookTax = z.infer<typeof WebhookTaxSchema>;

export const WebhookAmountSchema = z.object({
  currency: z.string().optional(),
  total: z.number(),
  taxes: z.array(WebhookTaxSchema).optional(),
  tip: z.number().optional()
});

export type WebhookAmount = z.infer<typeof WebhookAmountSchema>;

export const CardBrandSchema = z.enum([
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
  "UNKOWN"
]);

export type CardBrand = z.infer<typeof CardBrandSchema>;

export const CaptureModeSchema = z.enum(["CHIP", "CONTACTLESS_CHIP"]);

export type CaptureMode = z.infer<typeof CaptureModeSchema>;

export const CardTypeSchema = z.enum(["DEBIT", "CREDIT"]);

export type CardType = z.infer<typeof CardTypeSchema>;

export const WebhookCardSchema = z.object({
  capture_mode: CaptureModeSchema.optional(),
  brand: CardBrandSchema.optional(),
  franchise: CardBrandSchema.optional(), // Alternative field name in some responses
  cardholder_name: z.string().optional(),
  terminal_id: z.string().optional(),
  masked_pan: z.string().optional(),
  installments: z.number().optional(),
  card_type: CardTypeSchema.optional()
});

export type WebhookCard = z.infer<typeof WebhookCardSchema>;

export const PaymentMethodTypeSchema = z.enum([
  "CARD",
  "CARD_WEB",
  "SOFT_POS",
  "NEQUI",
  "BOTON_BANCOLOMBIA",
  "PSE"
]);

export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

export const IntegrationTypeSchema = z.enum([
  "POS",
  "SOFT_POS",
  "API_INTEGRATIONS",
  "LINK"
]);

export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;

export const WebhookMetadataSchema = z
  .object({
    reference: z.string().optional()
  })
  .passthrough();

export type WebhookMetadata = z.infer<typeof WebhookMetadataSchema>;

export const WebhookDataSchema = z
  .object({
    payment_id: z.string(),
    merchant_id: z.string(),
    created_at: z.string(),
    amount: WebhookAmountSchema,
    user_id: z.string().optional(),
    metadata: WebhookMetadataSchema.optional(),
    bold_code: z.string().optional(),
    payer_email: z.string().optional(),
    payment_method: PaymentMethodTypeSchema.optional(),
    card: WebhookCardSchema.optional(),
    approval_number: z.string().optional(),
    integration: IntegrationTypeSchema.optional()
  })
  .passthrough();

export type WebhookData = z.infer<typeof WebhookDataSchema>;

export const WebhookNotificationSchema = z
  .object({
    id: z.string(),
    type: WebhookEventTypeSchema,
    subject: z.string(),
    source: z.string(),
    spec_version: z.string(),
    time: z.number(),
    data: WebhookDataSchema,
    datacontenttype: z.string()
  })
  .passthrough();

export type WebhookNotification = z.infer<typeof WebhookNotificationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Notifications Fallback API Response
// ─────────────────────────────────────────────────────────────────────────────

export const WebhookNotificationsResponseSchema = z.object({
  notifications: z.array(WebhookNotificationSchema)
});

export type WebhookNotificationsResponse = z.infer<
  typeof WebhookNotificationsResponseSchema
>;
