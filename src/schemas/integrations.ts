import type { output } from "zod";
import { array, boolean, enum as enumZod, number, object, string } from "zod";
import { envelopeNormalize } from "./common";

export const PaymentMethodSchema = object({
  name: enumZod(["DAVIPLATA", "NEQUI", "PAY_BY_LINK", "POS", "PAY_BY_QR_BOLD"]),
  enabled: boolean()
});

export type PaymentMethod = output<typeof PaymentMethodSchema>;

export const PaymentMethodsPayloadSchema = object({
  payment_methods: array(PaymentMethodSchema)
}).loose();

export const PaymentMethodsResponseSchema = envelopeNormalize(
  PaymentMethodsPayloadSchema
);

export type PaymentMethodsResponse = output<
  typeof PaymentMethodsResponseSchema
>;

export const TerminalSchema = object({
  terminal_model: string(),
  terminal_serial: string(),
  status: string(),
  name: string()
});

export type Terminal = output<typeof TerminalSchema>;

export const BindedTerminalsPayloadSchema = object({
  available_terminals: array(TerminalSchema)
}).loose();

export const BindedTerminalsResponseSchema = envelopeNormalize(
  BindedTerminalsPayloadSchema
);

export type BindedTerminalsResponse = output<
  typeof BindedTerminalsResponseSchema
>;

export const DocumentTypeSchema = enumZod([
  "CEDULA",
  "NIT",
  "CEDULA_EXTRANJERIA",
  "PEP",
  "PASAPORTE",
  "NUIP",
  "REGISTRO_CIVIL",
  "DOCUMENTO_EXTRANJERIA",
  "TARJETA_IDENTIDAD",
  "PPT"
]);

export type DocumentType = output<typeof DocumentTypeSchema>;

export const TaxSchema = object({
  type: enumZod(["VAT", "CONSUMPTION"]),
  base: number(),
  value: number()
});

export type Tax = output<typeof TaxSchema>;

export const PayerDocumentSchema = object({
  document_type: DocumentTypeSchema,
  document_number: string().min(4).max(15)
});

export type PayerDocument = output<typeof PayerDocumentSchema>;

export const PayerSchema = object({
  email: string().email().optional(),
  phone_number: string().optional(),
  document: PayerDocumentSchema.optional()
});

export type Payer = output<typeof PayerSchema>;

export const AmountSchema = object({
  currency: string(),
  taxes: array(TaxSchema),
  tip_amount: number(),
  total_amount: number()
});

export type Amount = output<typeof AmountSchema>;

export const AppCheckoutRequestSchema = object({
  amount: AmountSchema,
  payment_method: enumZod([
    "POS",
    "NEQUI",
    "DAVIPLATA",
    "PAY_BY_LINK",
    "PAY_BY_QR_BOLD",
    ""
  ]),
  terminal_model: string(),
  terminal_serial: string(),
  reference: string(),
  user_email: string().email(),
  description: string().optional(),
  payer: PayerSchema.optional()
});

export type AppCheckoutRequest = output<typeof AppCheckoutRequestSchema>;

export const AppCheckoutPayloadSchema = object({
  integration_id: string()
}).loose();

export const AppCheckoutResponseSchema = envelopeNormalize(
  AppCheckoutPayloadSchema
);

export type AppCheckoutResponse = output<typeof AppCheckoutResponseSchema>;
