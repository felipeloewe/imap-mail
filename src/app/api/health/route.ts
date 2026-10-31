import { jsonOk } from "@/lib/api";
import { getEnvOptional } from "@/lib/env";

/** Used by CI4 ImapMailClient::health() via IMAP_MAIL_BASE_URL + /api/health */
export async function GET() {
  const env = getEnvOptional();
  return jsonOk({
    service: "imap-mail",
    product: "Repositoria",
    phase: 3,
    consumer: "codeigniter4",
    databaseConfigured: Boolean(env.DATABASE_URL),
    gmailOAuthConfigured: Boolean(
      env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET,
    ),
    repositoriaWebhookConfigured: Boolean(env.REPOSITORIA_WEBHOOK_URL),
  });
}
