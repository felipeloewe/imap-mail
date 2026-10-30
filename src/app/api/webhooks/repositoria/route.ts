import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/api";
import { getEnvOptional } from "@/lib/env";

const inboundSchema = z.object({
  ping: z.boolean().optional(),
  note: z.string().optional(),
});

/**
 * Inbound stub: Repositoria can POST here to verify connectivity.
 * Outbound pushes use REPOSITORIA_WEBHOOK_URL (see services/repositoria/webhook.ts).
 */
export async function POST(req: Request) {
  try {
    const secret = req.headers.get("X-Repositoria-Webhook-Secret");
    const expected = getEnvOptional().REPOSITORIA_WEBHOOK_SECRET;
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
      phase: 3,
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
  });
}
