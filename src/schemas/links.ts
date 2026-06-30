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

export const AmountTypeSchema = enumZod(["OPEN", "CLOSE"]);
export type AmountType = output<typeof AmountTypeSchema>;

export const LinkPaymentMethodSchema = enumZod([
  "CREDIT_CARD",
  "PSE",
  "BOTON_BANCOLOMBIA",
  "NEQUI"
]);
export type LinkPaymentMethod = output<typeof LinkPaymentMethodSchema>;

export const LinkStatusSchema = enumZod([
  "ACTIVE",
  "PROCESSING",
  "PAID",
  "REJECTED",
  "CANCELLED",
  "EXPIRED"
]);
export type LinkStatus = output<typeof LinkStatusSchema>;

export const LinkTaxSchema = object({
  type: enumZod(["VAT", "CONSUMPTION"]),
  base: number(),
  value: number()
});
export type LinkTax = output<typeof LinkTaxSchema>;

export const LinkAmountSchema = object({
  currency: string().optional(),
  taxes: array(LinkTaxSchema).optional(),
  tip_amount: number().optional(),
  total_amount: number().optional()
});
export type LinkAmount = output<typeof LinkAmountSchema>;

export const CreateLinkRequestSchema = object({
  amount_type: AmountTypeSchema,
  amount: LinkAmountSchema.optional(),
  reference: string().max(60).optional(),
  description: string().min(2).max(100).optional(),
  expiration_date: number().optional(),
  callback_url: string().optional(),
  payment_methods: array(LinkPaymentMethodSchema).optional(),
  payer_email: string().optional(),
  image_url: string().optional()
});
export type CreateLinkRequest = output<typeof CreateLinkRequestSchema>;

export const CreateLinkResultSchema = object({
  payment_link: string(),
  url: string()
}).loose();
export type CreateLinkResult = output<typeof CreateLinkResultSchema>;

export const PaymentMethodLimitSchema = object({
  max: number(),
  min: number()
});
export type PaymentMethodLimit = output<typeof PaymentMethodLimitSchema>;

export const LinkPaymentMethodsSchema = object({
  payment_methods: object({
    CREDIT_CARD: PaymentMethodLimitSchema.optional(),
    PSE: PaymentMethodLimitSchema.optional(),
    BOTON_BANCOLOMBIA: PaymentMethodLimitSchema.optional(),
    NEQUI: PaymentMethodLimitSchema.optional()
  }).loose()
}).loose();
export type LinkPaymentMethods = output<typeof LinkPaymentMethodsSchema>;

export const LinkDetailSchema = object({
  api_version: union([string(), number()]).optional(),
  id: string(),
  total: number().optional(),
  subtotal: number().optional(),
  tip_amount: number().optional(),
  taxes: array(LinkTaxSchema).optional(),
  status: LinkStatusSchema,
  expiration_date: number().nullable().optional(),
  creation_date: number().optional(),
  description: string().nullable().optional(),
  payment_method: string().nullable().optional(),
  transaction_id: string().nullable().optional(),
  amount_type: AmountTypeSchema.optional(),
  is_sandbox: boolean().optional(),
  reference: string().nullable().optional()
}).loose();
export type LinkDetail = output<typeof LinkDetailSchema>;

// Envelope-tolerant variants used by the resource.
export const CreateLinkEnvelopeSchema = envelopeOrBare(CreateLinkResultSchema);
export const LinkPaymentMethodsEnvelopeSchema = envelopeOrBare(
  LinkPaymentMethodsSchema
);
export const LinkDetailEnvelopeSchema = envelopeOrBare(LinkDetailSchema);

// Re-exported so consumers don't need the envelope wrapper internals.
export const LinkErrorsSchema = array(unknown());
