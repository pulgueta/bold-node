import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Payment Voucher / Transaction Status
// ─────────────────────────────────────────────────────────────────────────────

export const PaymentStatusSchema = z.enum([
  "NO_TRANSACTION_FOUND",
  "PROCESSING",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "FAILED",
  "VOIDED"
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Payment voucher response - varies based on whether a payment attempt was made.
 * Uses passthrough to allow additional fields from the API.
 */
export const PaymentVoucherResponseSchema = z
  .object({
    link_id: z.string(),
    total: z.number(),
    subtotal: z.number(),
    description: z.string().optional(),
    reference_id: z.string().optional(),
    payment_status: PaymentStatusSchema,
    // Fields present when a payment attempt was made
    transaction_id: z.string().optional(),
    payment_method: z.string().optional(),
    payer_email: z.string().optional(),
    transaction_date: z.string().optional()
  })
  .passthrough();

export type PaymentVoucherResponse = z.infer<
  typeof PaymentVoucherResponseSchema
>;
