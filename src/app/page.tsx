import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-teal-800/70">
          Repositoria · Fase 3
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">
          Correo e índice histórico
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-600">
          Servicio paralelo de correo para Repositoria: sync IMAP (INBOX +
          Sent), reconstrucción de hilos, índice canónico y certificado PDF
          del hilo hacia el repositorio documental.
        </p>
      </header>

      <section className="space-y-3 border-t border-stone-200 pt-8">
        <h2 className="text-xl font-medium text-stone-900">Integración API</h2>
        <ul className="list-disc space-y-1 pl-5 text-stone-700">
          <li>
            <code className="text-sm">GET /api/health</code> — estado del
            servicio
          </li>
          <li>
            <code className="text-sm">GET/POST /api/accounts</code> — casillas
            por <code>usuarioId</code>
          </li>
          <li>
            <code className="text-sm">POST /api/accounts/:id/sync</code> — sync
            IMAP
          </li>
          <li>
            <code className="text-sm">GET /api/threads</code> — listar hilos
          </li>
          <li>
            <code className="text-sm">GET /api/threads/:id</code> — detalle
          </li>
          <li>
            <code className="text-sm">
              POST/GET /api/threads/:id/certificate
            </code>{" "}
            — generar / descargar PDF
          </li>
          <li>
            <code className="text-sm">GET /api/attachments/:id/export</code> —
            exportar adjunto
          </li>
          <li>
            <code className="text-sm">GET /api/oauth/gmail/start</code> — OAuth
            Gmail (env)
          </li>
        </ul>
        <p className="text-sm text-stone-500">
          Ver README para el contrato con Repositoria. Este servicio no modifica
          el repo de Repositoria.
        </p>
      </section>

      <p>
        <Link
          href="/threads"
          className="inline-flex items-center rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Ver hilos (UI)
        </Link>
      </p>
    </main>
  );
}
