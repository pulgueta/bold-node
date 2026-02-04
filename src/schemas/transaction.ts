import { enum as enumZod, number, object, string } from "zod";
import type { output } from "zod";

export const PaymentStatusSchema = enumZod([
  "NO_TRANSACTION_FOUND",
  "PROCESSING",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "FAILED",
  "VOIDED"
]);

export type PaymentStatus = output<typeof PaymentStatusSchema>;

export const PaymentVoucherResponseSchema = object({
  link_id: string(),
  total: number(),
  subtotal: number(),
  description: string().optional(),
  reference_id: string().optional(),
  payment_status: PaymentStatusSchema,
  transaction_id: string().optional(),
  payment_method: string().optional(),
  payer_email: string().optional(),
  transaction_date: string().optional()
}).passthrough();

export type PaymentVoucherResponse = output<
  typeof PaymentVoucherResponseSchema
>;
