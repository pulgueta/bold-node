import type { ZodType } from "zod";
import { array, object, union, unknown } from "zod";

/**
 * Several Bold services wrap their result in a `{ payload, errors }` envelope
 * (the documented "Response" schema), but some BETA Online Payments API
 * endpoints return the object bare. This helper accepts BOTH shapes and always
 * resolves to the inner object, so resources can treat responses uniformly.
 */
export function envelopeOrBare<T>(schema: ZodType<T>): ZodType<T> {
  const enveloped = object({
    payload: schema,
    errors: array(unknown()).optional()
  }).transform((value) => value.payload);

  return union([enveloped, schema]) as unknown as ZodType<T>;
}

/**
 * Accept both the `{ payload, errors }` envelope and a bare payload, but ALWAYS
 * normalize the OUTPUT to the envelope shape. Bold's sandbox sometimes returns
 * a bare payload (e.g. `payment-methods`) where the docs show an envelope; this
 * keeps the SDK's return shape stable while tolerating either response.
 */
export function envelopeNormalize<T>(
  inner: ZodType<T>
): ZodType<{ payload: T; errors: unknown[] }> {
  const enveloped = object({
    payload: inner,
    errors: array(unknown()).optional()
  }).transform((value) => ({
    payload: value.payload,
    errors: value.errors ?? []
  }));

  const bare = inner.transform((payload) => ({
    payload,
    errors: [] as unknown[]
  }));

  return union([enveloped, bare]) as unknown as ZodType<{
    payload: T;
    errors: unknown[];
  }>;
}

/** The trailing `errors` array present on most Bold responses. */
export const ErrorsArraySchema = array(unknown());
