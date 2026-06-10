// ============================================
// API Types
// ============================================

// ============================================
// Request Types
// ============================================

export interface VerifyEmailRequest {
  email: string;
  context?: {
    ip_address?: string;
    user_agent?: string;
    country_code?: string;
  };
}

export interface CheckEmailsRequest {
  emails: string[];
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  rate_limit?: number;
  daily_limit?: number;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
}

// ============================================
// Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    request_id?: string;
    latency_ms?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta?: {
    request_id?: string;
  };
}

export interface VerifyEmailResponse {
  email: string;
  is_disposable: boolean;
  risk_score: number;
  analysis: {
    tier_triggered: number;
    reason: string;
    domain: string;
    mx_records?: string[];
    domain_age_days?: number | null;
    asn_number?: number | null;
    asn_org?: string;
    subnet_density?: number;
    ns_reputation?: number;
    mx_subnets?: string[];
    ns_servers?: string[];
  };
}

export interface CheckEmailsResponse {
  results: {
    email: string;
    is_disposable: boolean;
    risk_score: number;
  }[];
  summary: {
    total: number;
    disposable: number;
    clean: number;
  };
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  rate_limit: number;
  daily_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface CreateApiKeyResponse extends ApiKeyResponse {
  key: string;
  message: string;
}

export interface UsageResponse {
  summary: {
    total_requests: number;
    blocked: number;
    allowed: number;
    block_rate: number;
  };
  daily: {
    date: string;
    requests: number;
    blocked: number;
    allowed: number;
  }[];
  by_key: {
    key_id: string;
    key_name: string;
    requests: number;
    blocked: number;
  }[];
  by_reason: {
    reason: string;
    count: number;
  }[];
}

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export interface CreateWebhookResponse extends WebhookResponse {
  secret: string;
  message: string;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    database: "connected" | "disconnected";
    redis: "connected" | "disconnected";
    engine: "connected" | "disconnected";
    unkey: "connected" | "disconnected";
  };
}

// ============================================
// Webhook Event Types
// ============================================

export type WebhookEvent = "email.blocked" | "email.allowed" | "key.created" | "key.revoked";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: {
    email?: string;
    is_disposable?: boolean;
    risk_score?: number;
    reason?: string;
    key_id?: string;
    key_name?: string;
  };
}

// ============================================
// Rate Limit Types
// ============================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}
