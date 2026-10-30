import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { jsonError, jsonOk, handleRouteError } from "@/lib/api";
import {
  buildGmailAuthUrl,
  isGmailOAuthConfigured,
} from "@/services/oauth/gmail";

const querySchema = z.object({
  usuarioId: z.string().min(1),
  /** Optional return URL into Repositoria after OAuth */
  returnTo: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      usuarioId: searchParams.get("usuarioId") ?? "",
      returnTo: searchParams.get("returnTo") ?? undefined,
    });

    if (!isGmailOAuthConfigured()) {
      return jsonError(
        "Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in env.",
        503,
      );
    }

    const state = Buffer.from(
      JSON.stringify({
        nonce: createId(),
        usuarioId: parsed.usuarioId,
        returnTo: parsed.returnTo ?? null,
      }),
    ).toString("base64url");

    const { url } = buildGmailAuthUrl(state);
    return jsonOk({ authUrl: url, state });
  } catch (err) {
    return handleRouteError(err);
  }
}
