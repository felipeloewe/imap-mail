import { getEnvOptional } from "@/lib/env";

export type RepositoriaPushPayload = {
  event:
    | "thread.certificate.ready"
    | "attachment.exported"
    | "thread.synced";
  usuarioId: string;
  accountId: string;
  threadId?: string;
  attachmentId?: string;
  /** Suggested target in Repositoria document repo */
  suggestedDepartamentoId?: string;
  files: Array<{
    kind: "certificate_pdf" | "attachment";
    filename: string;
    mimeType: string;
    /** Absolute or service-relative path / download URL */
    downloadPath: string;
  }>;
  metadata?: Record<string, unknown>;
};

/**
 * Stub callback so Repositoria can later ingest adjuntos + certificado PDF del hilo.
 * Configure REPOSITORIA_WEBHOOK_URL + REPOSITORIA_WEBHOOK_SECRET via env.
 */
export async function pushToRepositoria(
  payload: RepositoriaPushPayload,
): Promise<{ delivered: boolean; status?: number; stub?: boolean; detail?: string }> {
  const env = getEnvOptional();
  const url = env.REPOSITORIA_WEBHOOK_URL;
  if (!url) {
    return {
      delivered: false,
      stub: true,
      detail: "REPOSITORIA_WEBHOOK_URL not set — callback stubbed",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Repositoria-Source": "imap-mail",
  };
  if (env.REPOSITORIA_WEBHOOK_SECRET) {
    headers["X-Repositoria-Webhook-Secret"] = env.REPOSITORIA_WEBHOOK_SECRET;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return { delivered: res.ok, status: res.status };
}
