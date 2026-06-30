import type { RequestConfig } from "../http";
import { requestForm } from "../http";
import { OAuthTokenSchema } from "../schemas/oauth";

/** OAuth client-credentials token retrieval. */
export class OAuthResource {
  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string | undefined,
    private readonly clientSecret: string | undefined,
    private readonly defaultConfig: RequestConfig
  ) {}

  /** Get an access token via the client-credentials grant. `POST /oauth/token` */
  async getToken(options?: RequestConfig) {
    if (!this.clientId || !this.clientSecret) {
      return [
        {
          kind: "config",
          message: "clientId and clientSecret are required for OAuth token",
          field: !this.clientId ? "clientId" : "clientSecret"
        },
        null
      ] as const;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    return requestForm({
      url: `${this.baseUrl}/oauth/token`,
      method: "POST",
      body,
      schema: OAuthTokenSchema,
      ...this.defaultConfig,
      ...options
    });
  }
}
