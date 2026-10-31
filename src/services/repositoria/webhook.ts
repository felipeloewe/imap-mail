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
  /** Suggested Departamento target in Repositoria Documentos */
  suggestedDepartamentoId?: string;
  /** Suggested DocumentoSeccion id (CI4 Fase 2) */
  suggestedSeccionId?: string;
  files: Array<{
    kind: "certificate_pdf" | "attachment";
    filename: string;
    mimeType: string;
    /** Path relative to IMAP_MAIL_BASE_URL (CI4 downloads via ImapMailClient) */
    downloadPath: string;
  }>;
  metadata?: Record<string, unknown>;
};

/**
 * Outbound push to CodeIgniter 4 Repositoria.
 * Default ingest route: POST {app.baseURL}api/webhooks/imap-mail
 * Auth header (CI4 Webhook::imapMail): X-Repositoria-Secret or Authorization: Bearer …
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
      detail:
        "REPOSITORIA_WEBHOOK_URL not set — set to CI4 e.g. http://localhost:8080/api/webhooks/imap-mail",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Repositoria-Source": "imap-mail",
    Accept: "application/json",
  };
  if (env.REPOSITORIA_WEBHOOK_SECRET) {
    // Match CI4 Webhook::imapMail header names
    headers["X-Repositoria-Secret"] = env.REPOSITORIA_WEBHOOK_SECRET;
    headers.Authorization = `Bearer ${env.REPOSITORIA_WEBHOOK_SECRET}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return { delivered: res.ok, status: res.status };
}
