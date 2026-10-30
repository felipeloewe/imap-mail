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
        className="rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Generando…" : "Generar certificado PDF"}
      </button>
      {ready && (
        <a
          className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
          href={`/api/threads/${threadId}/certificate`}
        >
          Descargar PDF
        </a>
      )}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
