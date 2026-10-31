"use client";

import { useState } from "react";

export function CertificateActions({
  threadId,
  hasCertificate,
}: {
  threadId: string;
  hasCertificate: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(hasCertificate);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/${threadId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushToRepositoria: false }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Error al generar");
      }
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="btn-primary on-light"
      >
        {busy ? "Generando…" : "Generar certificado PDF"}
      </button>
      {ready && (
        <a
          className="btn-secondary"
          href={`/api/threads/${threadId}/certificate`}
        >
          Descargar PDF
        </a>
      )}
      {error && (
        <span className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
