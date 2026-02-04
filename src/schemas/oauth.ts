import { z } from "zod";

/**
 * OAuth token response schema.
 */
export const OAuthTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
  scope: z.string().optional()
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;
