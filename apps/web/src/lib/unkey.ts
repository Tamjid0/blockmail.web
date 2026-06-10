import { Unkey } from "@unkey/api";

const globalForUnkey = globalThis as unknown as {
  unkey: Unkey | undefined;
};

export const unkey =
  globalForUnkey.unkey ??
  new Unkey({
    rootKey: process.env.UNKEY_ROOT_KEY!,
    baseUrl: process.env.UNKEY_URL,
  });

if (process.env.NODE_ENV !== "production") globalForUnkey.unkey = unkey;
