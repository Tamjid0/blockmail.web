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
