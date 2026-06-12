import { z } from "zod";

const envSchema = z
  .object({
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),

    // Redis
    REDIS_URL: z.string().optional(),
    REDIS_TOKEN: z.string().optional(),

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

    // Engine
    BLOCKMAIL_ENGINE_URL: z.string().url("BLOCKMAIL_ENGINE_URL must be a valid URL"),
    BLOCKMAIL_ENGINE_API_KEY: z.string().min(1, "BLOCKMAIL_ENGINE_API_KEY is required"),

    // App
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),

    // Zuplo (optional - only needed for managed edge deployment)
    ZUPLO_ACCOUNT: z.string().optional(),
    ZUPLO_BUCKET: z.string().optional(),
    ZUPLO_API_KEY: z.string().optional(),

    // Shared secret for Zuplo gateway verification (required when using Zuplo)
    BLOCKMAIL_SECRET: z.string().optional(),
  })
  .refine(
    (env) => {
      // When Zuplo is configured, BLOCKMAIL_SECRET is required
      if (env.ZUPLO_ACCOUNT && !env.BLOCKMAIL_SECRET) return false;
      return true;
    },
    { message: "BLOCKMAIL_SECRET is required when ZUPLO_ACCOUNT is set" }
  );

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    const errorMessages = Object.entries(errors)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const msg = (value as { _errors?: string[] })._errors?.join(", ");
        return msg ? `${key}: ${msg}` : null;
      })
      .filter(Boolean);

    console.error("❌ Environment variable validation failed:");
    errorMessages.forEach((msg) => console.error(`   ${msg}`));
    process.exit(1);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

// Validate on import in development
if (process.env.NODE_ENV === "development") {
  try {
    validateEnv();
  } catch {
    // Allow dev to continue with warnings
  }
}
