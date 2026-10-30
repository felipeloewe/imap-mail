import Link from "next/link";

const tiles = [
  {
    label: "Hilos",
    hint: "INBOX + Sent",
    href: "/threads",
    color: "var(--accent-cyan)",
    mark: "Hi",
  },
  {
    label: "Certificado",
    hint: "PDF del hilo",
    href: "/threads",
    color: "var(--accent-orange)",
    mark: "PDF",
  },
  {
    label: "Adjuntos",
    hint: "Export API",
    href: "/api/health",
    color: "var(--accent-green)",
    mark: "Ad",
  },
  {
    label: "OAuth",
    hint: "Gmail stub",
    href: "/api/oauth/gmail/start?usuarioId=demo",
    color: "var(--accent-pink)",
    mark: "Go",
  },
];

export default function HomePage() {
  return (
    <div className="pb-10">
      <header className="hero">
        <p className="hero-eyebrow">Repositoria · Fase 3</p>
        <h1 className="mt-3 max-w-xl text-4xl leading-tight text-white md:text-5xl">
          Correo e índice histórico
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
          Sync IMAP, reconstrucción de hilos y certificado PDF hacia el
          repositorio documental — parte del producto Repositoria.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/threads" className="btn-primary">
            Ver hilos
          </Link>
          <a href="/api/health" className="btn-secondary !border-white/30 !bg-white/10 !text-white">
            Health API
          </a>
        </div>
      </header>

      <main className="page-shell mt-6 space-y-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="tile transition hover:-translate-y-0.5">
              <span className="tile-icon" style={{ background: t.color }}>
                {t.mark}
              </span>
              <div>
                <div className="display text-sm text-[var(--text-main)]">{t.label}</div>
                <div className="text-xs text-[var(--text-body)]">{t.hint}</div>
              </div>
            </Link>
          ))}
        </section>

        <section className="card space-y-4 p-5 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl text-[var(--text-main)]">Integración API</h2>
            <span className="text-sm font-semibold text-[var(--blue-600)]">
              Para Repositoria
            </span>
          </div>
          <ul className="space-y-2 text-[var(--text-muted)]">
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
              <code>POST/GET /api/threads/:id/certificate</code> — PDF
            </li>
            <li>
              <code>GET /api/attachments/:id/export</code> — adjuntos
            </li>
            <li>
              <code>GET /api/oauth/gmail/start</code> — OAuth Gmail (env)
            </li>
          </ul>
          <p className="text-sm text-[var(--text-body)]">
            Ver README para el contrato. Este servicio no modifica el repo de
            Repositoria.
          </p>
        </section>
      </main>
    </div>
  );
}
