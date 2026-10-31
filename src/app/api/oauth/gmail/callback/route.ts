import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { exchangeGmailCode } from "@/services/oauth/gmail";

/**
 * Gmail OAuth callback stub.
 * On success, Repositoria will create/link a MailAccount with provider=GMAIL.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return jsonError(`Gmail OAuth error: ${oauthError}`, 400);
    }
    if (!code || !state) {
      return jsonError("Missing code or state", 400);
    }

    let usuarioId: string | null = null;
    let returnTo: string | null = null;
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8"),
      ) as { usuarioId?: string; returnTo?: string | null };
      usuarioId = decoded.usuarioId ?? null;
      returnTo = decoded.returnTo ?? null;
    } catch {
      return jsonError("Invalid state", 400);
    }

    const tokens = await exchangeGmailCode(code);

    return jsonOk({
      usuarioId,
      returnTo,
      tokens,
      next: "Create MailAccount with provider=GMAIL and store refresh token (encrypted).",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
