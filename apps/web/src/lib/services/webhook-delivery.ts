import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveWebhooksForEvent } from "@/lib/services/webhook";

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // ms

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function deliverWebhook(
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const body: WebhookPayload = {
    event,
    data: payload,
    timestamp: new Date().toISOString(),
  };

  const bodyString = JSON.stringify(body);
  const signature = signPayload(bodyString, secret);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Blockmail-Signature": `sha256=${signature}`,
          "X-Blockmail-Event": event,
          "X-Blockmail-Delivery": String(attempt + 1),
          "User-Agent": "Blockmail-Webhook/1.0",
        },
        body: bodyString,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // Don't retry on 4xx errors (except 408, 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        return { success: false, statusCode: response.status, error: `HTTP ${response.status}` };
      }

      // Retry on 5xx or rate limit
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      } else {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

export async function triggerWebhooks(
  userId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await getActiveWebhooksForEvent(userId, event);

  const deliveries = webhooks.map(async (webhook) => {
    const result = await deliverWebhook(webhook.url, webhook.secret, event, payload);

    // Update webhook status
    if (!result.success) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
          isActive: false, // Disable after persistent failures
        },
      });
    } else {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });
    }
  });

  // Fire and forget — don't block the response
  Promise.all(deliveries).catch(() => {});
}
