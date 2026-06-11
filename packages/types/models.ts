// ============================================
// Database Model Types
// ============================================

export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  unkeyId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  dailyLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLog {
  id: string;
  apiKeyId: string;
  requestId: string;
  email: string;
  emailHash: string;
  domain: string;
  isDisposable: boolean;
  riskScore: number;
  tierTriggered: number;
  reason: string;
  latencyMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  countryCode: string | null;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Extended Types with Relations
// ============================================

export interface UserWithKeys extends User {
  apiKeys: ApiKey[];
}

export interface ApiKeyWithUser extends ApiKey {
  user: User;
}

export interface WebhookWithUser extends Webhook {
  user: User;
}

// ============================================
// Query Types
// ============================================

export interface UsageQuery {
  period?: "7d" | "30d" | "90d";
  key_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}
