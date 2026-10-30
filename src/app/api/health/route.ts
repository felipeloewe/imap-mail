import { jsonOk } from "@/lib/api";
import { getEnvOptional } from "@/lib/env";

export async function GET() {
  const env = getEnvOptional();
  return jsonOk({
    service: "imap-mail",
    product: "Repositoria",
    phase: 3,
    databaseConfigured: Boolean(env.DATABASE_URL),
    gmailOAuthConfigured: Boolean(
      env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET,
    ),
    repositoriaWebhookConfigured: Boolean(env.REPOSITORIA_WEBHOOK_URL),
  });
}
