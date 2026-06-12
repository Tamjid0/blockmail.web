// ============================================
// Zuplo Developer API Client
// ============================================
// Documentation: https://dev.zuplo.com/docs/
// Self-serve integration: https://zuplo.com/docs/articles/api-key-self-serve-integration

const ZUPLO_BASE = "https://dev.zuplo.com/v1/accounts";

function getConfig() {
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

function getBaseUrl(): string | null {
  const config = getConfig();
  if (!config) return null;
  return `${ZUPLO_BASE}/${config.account}/key-buckets/${config.bucket}`;
}

function getHeaders(): Record<string, string> {
  const config = getConfig();
  if (!config) return {};
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
}

// ============================================
// Types
// ============================================

export interface ZuploApiKey {
  id: string;
  createdOn: string;
  updatedOn: string;
  expiresOn: string | null;
  key?: string;
}

export interface ZuploConsumer {
  id: string;
  name: string;
  description: string;
  createdOn: string;
  updatedOn: string;
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  apiKeys: ZuploApiKey[];
}

export interface ZuploListResponse<T> {
  data: T[];
  offset: number;
  limit: number;
}

// ============================================
// Consumer Operations
// ============================================

/**
 * Create a Zuplo consumer with an API key.
 * The consumer name should be the user's ID from your system.
 */
export async function createConsumer(params: {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
}): Promise<{ consumer: ZuploConsumer; key: string; keyId?: string } | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) {
    console.error("[Zuplo] Missing baseUrl or auth header");
    return null;
  }

  console.log("[Zuplo] Creating consumer:", params.name);

  const response = await fetch(
    `${baseUrl}/consumers?with-api-key=true`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        metadata: params.metadata ?? {},
        tags: params.tags ?? {},
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Zuplo] Create consumer failed:", response.status, errorText);

    if (response.status === 409) {
      // Consumer already exists — create a new key for it
      const existing = await getConsumer(params.name);
      if (existing) {
        const newKey = await createKey(params.name, params.description);
        if (newKey?.key) {
          return { consumer: existing, key: newKey.key, keyId: newKey.id };
        }
        return { consumer: existing, key: "" };
      }
    }
    return null;
  }

  const consumer: ZuploConsumer = await response.json();
  const key = consumer.apiKeys?.[0]?.key ?? "";
  const keyId = consumer.apiKeys?.[0]?.id ?? "";
  console.log("[Zuplo] Consumer created:", consumer.id);
  return { consumer, key, keyId };
}

/**
 * Get a consumer by name.
 */
export async function getConsumer(
  name: string
): Promise<ZuploConsumer | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const response = await fetch(
    `${baseUrl}/consumers/${name}?include-api-keys=true&key-format=visible`,
    { headers }
  );

  if (!response.ok) return null;
  return response.json();
}

/**
 * List all consumers (optionally filtered by tags).
 */
export async function listConsumers(params?: {
  tag?: Record<string, string>;
  offset?: number;
  limit?: number;
}): Promise<ZuploListResponse<ZuploConsumer> | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const url = new URL(`${baseUrl}/consumers`);
  url.searchParams.set("include-api-keys", "true");
  url.searchParams.set("key-format", "masked");

  if (params?.offset !== undefined) {
    url.searchParams.set("offset", String(params.offset));
  }
  if (params?.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params?.tag) {
    for (const [key, value] of Object.entries(params.tag)) {
      url.searchParams.set(`tag.${key}`, value);
    }
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) return null;
  return response.json();
}

// ============================================
// API Key Operations
// ============================================

/**
 * List API keys for a consumer.
 */
export async function listKeys(
  consumerName: string,
  keyFormat: "masked" | "visible" | "none" = "masked"
): Promise<ZuploApiKey[] | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const response = await fetch(
    `${baseUrl}/consumers/${consumerName}/keys?key-format=${keyFormat}`,
    { headers }
  );

  if (!response.ok) return null;
  const data: ZuploListResponse<ZuploApiKey> = await response.json();
  return data.data;
}

/**
 * Create a new API key for a consumer.
 */
export async function createKey(
  consumerName: string,
  description?: string
): Promise<ZuploApiKey | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const response = await fetch(
    `${baseUrl}/consumers/${consumerName}/keys`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ description: description ?? "" }),
    }
  );

  if (!response.ok) return null;
  return response.json();
}

/**
 * Roll (rotate) a consumer's keys.
 * Creates a new key and sets expiration on existing keys.
 */
export async function rollKey(
  consumerName: string,
  expiresOn?: string
): Promise<ZuploApiKey | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const body: Record<string, unknown> = {};
  if (expiresOn) {
    body.expiresOn = expiresOn;
  }

  const response = await fetch(
    `${baseUrl}/consumers/${consumerName}/roll-key`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) return null;
  return response.json();
}

/**
 * Delete a specific API key.
 */
export async function deleteKey(
  consumerName: string,
  keyId: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return false;

  const response = await fetch(
    `${baseUrl}/consumers/${consumerName}/keys/${keyId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  return response.ok;
}

/**
 * Delete a consumer and all its keys.
 */
export async function deleteConsumer(
  name: string,
  tag?: Record<string, string>
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return false;

  const url = new URL(`${baseUrl}/consumers/${name}`);
  if (tag) {
    for (const [key, value] of Object.entries(tag)) {
      url.searchParams.set(`tag.${key}`, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers,
  });

  return response.ok;
}

/**
 * Update consumer metadata (e.g., plan changes).
 */
export async function updateConsumer(
  name: string,
  metadata: Record<string, unknown>
): Promise<ZuploConsumer | null> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers.Authorization) return null;

  const response = await fetch(
    `${baseUrl}/consumers/${name}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ metadata }),
    }
  );

  if (!response.ok) return null;
  return response.json();
}

/**
 * Check if Zuplo is configured.
 */
export function isZuploConfigured(): boolean {
  return getConfig() !== null;
}
