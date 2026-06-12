const ZUPLO_BASE = "https://dev.zuplo.com/v1/accounts";

export interface ZuploConfig {
  account: string;
  bucket: string;
  apiKey: string;
}

export function getConfig(): ZuploConfig | null {
  const account = process.env.ZUPLO_ACCOUNT;
  const bucket = process.env.ZUPLO_BUCKET;
  const apiKey = process.env.ZUPLO_API_KEY;

  if (!account || !bucket || !apiKey) {
    console.warn("[Zuplo] Missing env vars:", {
      account: !!account,
      bucket: !!bucket,
      apiKey: !!apiKey,
    });
    return null;
  }

  return { account, bucket, apiKey };
}

export function getBaseUrl(): string | null {
  const config = getConfig();
  if (!config) return null;
  return `${ZUPLO_BASE}/${config.account}/key-buckets/${config.bucket}`;
}

export function getHeaders(): Record<string, string> {
  const config = getConfig();
  if (!config) return {};
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
}

export function isZuploConfigured(): boolean {
  return getConfig() !== null;
}
