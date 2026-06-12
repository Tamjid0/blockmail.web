import { getBaseUrl, getHeaders } from "./config";
import type { ZuploConsumer, ZuploListResponse } from "./types";

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
      const existing = await getConsumer(params.name);
      if (existing) {
        const { createKey } = await import("./keys");
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
