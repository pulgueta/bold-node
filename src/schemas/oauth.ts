import { object, string, number } from "zod";
import type { output } from "zod";

export const OAuthTokenSchema = object({
  access_token: string(),
  token_type: string(),
  expires_in: number().optional(),
  scope: string().optional()
});

export type OAuthToken = output<typeof OAuthTokenSchema>;
