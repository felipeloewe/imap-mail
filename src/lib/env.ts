import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ATTACHMENTS_DIR: z.string().default("./data/attachments"),
  CERTIFICATES_DIR: z.string().default("./data/certificates"),
  REPOSITORIA_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  REPOSITORIA_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  GMAIL_CLIENT_ID: z.string().optional().or(z.literal("")),
  GMAIL_CLIENT_SECRET: z.string().optional().or(z.literal("")),
  GMAIL_REDIRECT_URI: z
    .string()
    .optional()
    .or(z.literal(""))
    .default("http://localhost:3001/api/oauth/gmail/callback"),
  MAIL_SERVICE_PORT: z.string().optional().default("3001"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/** Read config from process.env only — never pass secrets on argv. */
export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(`Invalid environment: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

export function getEnvOptional(): Partial<AppEnv> {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    ATTACHMENTS_DIR: process.env.ATTACHMENTS_DIR ?? "./data/attachments",
    CERTIFICATES_DIR: process.env.CERTIFICATES_DIR ?? "./data/certificates",
    REPOSITORIA_WEBHOOK_URL: process.env.REPOSITORIA_WEBHOOK_URL ?? "",
    REPOSITORIA_WEBHOOK_SECRET: process.env.REPOSITORIA_WEBHOOK_SECRET ?? "",
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ?? "",
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ?? "",
    GMAIL_REDIRECT_URI:
      process.env.GMAIL_REDIRECT_URI ??
      "http://localhost:3001/api/oauth/gmail/callback",
    MAIL_SERVICE_PORT: process.env.MAIL_SERVICE_PORT ?? "3001",
  };
}
