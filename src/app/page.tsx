import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="eyebrow">Repositoria · Fase 3</p>
        <h1 className="text-4xl tracking-tight text-[var(--text-main)]">
          Correo e índice histórico
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-body)]">
          Servicio paralelo de correo para Repositoria: sync IMAP (INBOX +
          Sent), reconstrucción de hilos, índice canónico y certificado PDF
          del hilo hacia el repositorio documental.
        </p>
      </header>

      <section className="space-y-3 border-t border-[var(--border-subtle)] pt-8">
        <h2 className="text-xl text-[var(--text-main)]">Integración API</h2>
        <ul className="list-disc space-y-1 pl-5 text-[var(--text-muted)]">
          <li>
            <code>GET /api/health</code> — estado del servicio
          </li>
          <li>
            <code>GET/POST /api/accounts</code> — casillas por{" "}
            <code>usuarioId</code>
          </li>
          <li>
            <code>POST /api/accounts/:id/sync</code> — sync IMAP
          </li>
          <li>
            <code>GET /api/threads</code> — listar hilos
          </li>
          <li>
            <code>GET /api/threads/:id</code> — detalle
          </li>
          <li>
            <code>POST/GET /api/threads/:id/certificate</code> — generar /
            descargar PDF
          </li>
          <li>
            <code>GET /api/attachments/:id/export</code> — exportar adjunto
          </li>
          <li>
            <code>GET /api/oauth/gmail/start</code> — OAuth Gmail (env)
          </li>
        </ul>
        <p className="text-sm text-[var(--text-body)]">
          Ver README para el contrato con Repositoria. Este servicio no modifica
          el repo de Repositoria.
        </p>
      </section>

      <p>
        <Link href="/threads" className="btn-primary">
          Ver hilos (UI)
        </Link>
      </p>
    </main>
  );
}
