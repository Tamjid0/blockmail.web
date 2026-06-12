import { getBaseUrl, getHeaders } from "./config";
import type { ZuploApiKey, ZuploListResponse } from "./types";

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
