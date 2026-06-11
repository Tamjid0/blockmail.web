import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Redis (optional for now)
  REDIS_URL: z.string().optional(),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Engine
  BLOCKMAIL_ENGINE_URL: z.string().url("BLOCKMAIL_ENGINE_URL must be a valid URL"),
  BLOCKMAIL_ENGINE_API_KEY: z.string().min(1, "BLOCKMAIL_ENGINE_API_KEY is required"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),

  // Unkey (optional - self-managed keys)
  UNKEY_ROOT_KEY: z.string().optional(),
  UNKEY_URL: z.string().url().optional(),
});

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
