export interface VerificationRequest {
  email: string;
}

export interface Analysis {
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
}

export interface VerificationResult {
  email: string;
  is_disposable: boolean;
  risk_score: number;
  analysis: Analysis;
}

export interface BlockmailConfig {
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
}

export interface BlockmailError {
  code: string;
  message: string;
  status: number;
}

export class BlockmailException extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(error: BlockmailError) {
    super(error.message);
    this.name = "BlockmailException";
    this.code = error.code;
    this.status = error.status;
  }
}
