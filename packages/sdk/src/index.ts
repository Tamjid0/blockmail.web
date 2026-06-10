import type {
  BlockmailConfig,
  VerificationRequest,
  VerificationResult,
  BlockmailError,
} from "./types";
import { BlockmailException } from "./types";

const DEFAULT_BASE_URL = "https://api.blockmail.dev";
const DEFAULT_TIMEOUT = 10000;

export class Blockmail {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: BlockmailConfig | string) {
    if (typeof config === "string") {
      this.baseUrl = DEFAULT_BASE_URL;
      this.apiKey = config;
      this.timeout = DEFAULT_TIMEOUT;
    } else {
      this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
      this.apiKey = config.apiKey;
      this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    }
  }

  async verify(email: string): Promise<VerificationResult> {
    const body: VerificationRequest = { email };

    const response = await fetch(`${this.baseUrl}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      let error: BlockmailError;
      try {
        error = await response.json();
      } catch {
        error = {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status ${response.status}`,
          status: response.status,
        };
      }
      throw new BlockmailException(error);
    }

    const result = await response.json();
    return result as VerificationResult;
  }

  async isDisposable(email: string): Promise<boolean> {
    const result = await this.verify(email);
    return result.is_disposable;
  }

  async isSafe(email: string): Promise<boolean> {
    const result = await this.verify(email);
    return !result.is_disposable;
  }

  async healthCheck(): Promise<{ status: string; redis: string; storage: string }> {
    const response = await fetch(`${this.baseUrl}/healthz`, {
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new BlockmailException({
        code: "HEALTH_CHECK_FAILED",
        message: "Health check failed",
        status: response.status,
      });
    }

    return response.json();
  }
}

export default Blockmail;
export type { BlockmailConfig, VerificationResult, VerificationRequest, BlockmailError } from "./types";
export { BlockmailException } from "./types";
