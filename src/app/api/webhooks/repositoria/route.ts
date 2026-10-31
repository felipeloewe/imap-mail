import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/api";
import { getEnvOptional } from "@/lib/env";

const inboundSchema = z.object({
  ping: z.boolean().optional(),
  note: z.string().optional(),
});

function extractSecret(req: Request): string | null {
  const direct =
    req.headers.get("X-Repositoria-Secret") ||
    req.headers.get("X-Repositoria-Webhook-Secret");
  if (direct) return direct;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return auth;
}

/**
 * Inbound ping stub (optional).
 * Primary ingest lives on CI4: POST /api/webhooks/imap-mail
 * Outbound from this service → REPOSITORIA_WEBHOOK_URL
 */
export async function POST(req: Request) {
  try {
    const expected = getEnvOptional().REPOSITORIA_WEBHOOK_SECRET;
    const secret = extractSecret(req);
    if (expected && secret !== expected) {
      return Response.json(
        { ok: false, error: "Unauthorized webhook" },
        { status: 401 },
      );
    }

    const body = inboundSchema.parse(await req.json().catch(() => ({})));
    return jsonOk({
      received: true,
      body,
      service: "imap-mail",
      product: "Repositoria",
      consumer: "CodeIgniter 4",
      phase: 3,
      ci4IngestHint: "/api/webhooks/imap-mail",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  return jsonOk({
    service: "imap-mail",
    webhook: "ready",
    outboundEnv: "REPOSITORIA_WEBHOOK_URL",
    ci4Route: "POST /api/webhooks/imap-mail",
    secretHeader: "X-Repositoria-Secret",
  });
}
