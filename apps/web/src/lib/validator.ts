import { z } from "zod";

// ============================================
// Email Validation
// ============================================

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email must be less than 254 characters");

// ============================================
// API Request Schemas
// ============================================

export const verifyEmailSchema = z.object({
  email: emailSchema,
  context: z
    .object({
      ip_address: z.string().ip("Invalid IP address").optional(),
      user_agent: z.string().max(500, "User agent too long").optional(),
      country_code: z.string().length(2, "Invalid country code").optional(),
    })
    .optional(),
});

// ============================================
// API Key Schemas
// ============================================

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  permissions: z
    .array(z.enum(["verify", "admin"]))
    .default(["verify"])
    .optional(),
  rate_limit: z.number().int().min(1).max(10000).default(100).optional(),
  daily_limit: z.number().int().min(1).max(100000).default(100).optional(),
});

// ============================================
// Webhook Schemas
// ============================================

export const webhookUrlSchema = z.string().url("Invalid URL").regex(/^https:\/\//, "URL must use HTTPS");

export const createWebhookSchema = z.object({
  url: webhookUrlSchema,
  events: z
    .array(z.enum(["email.blocked", "email.allowed", "key.created", "key.revoked"]))
    .min(1, "At least one event is required"),
});

// ============================================
// Usage Query Schema
// ============================================

export const usageQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).default("30d").optional(),
  key_id: z.string().optional(),
});

// ============================================
// Pagination Schema
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});

// ============================================
// Types
// ============================================

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UsageQueryInput = z.infer<typeof usageQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
