import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  let threads: Awaited<ReturnType<typeof loadThreads>> = [];
  let error: string | null = null;

  try {
    threads = await loadThreads();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "No se pudo leer la base (¿DATABASE_URL / migrate?)";
  }

  return (
    <div className="pb-10">
      <header className="hero !pb-8">
        <div className="flex items-center justify-between gap-3">
          <p className="hero-eyebrow">Repositoria · Correo</p>
          <Link href="/" className="text-sm font-semibold text-white/90 hover:text-white">
            Inicio
          </Link>
        </div>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">Hilos</h1>
        <p className="mt-2 max-w-lg text-sm text-white/80 md:text-base">
          Índice canónico reconstruido por Message-ID / In-Reply-To / References.
        </p>
      </header>

      <main className="page-shell mt-6">
        {error ? (
          <p
            className="card px-4 py-3 text-sm"
            style={{
              borderColor: "var(--warning-border)",
              background: "var(--warning-bg)",
              color: "var(--warning-text)",
            }}
          >
            {error}
          </p>
        ) : threads.length === 0 ? (
          <div className="card p-6 text-[var(--text-body)]">
            Sin hilos aún. Vincula una casilla vía{" "}
            <code>POST /api/accounts</code> y ejecuta sync, o usa{" "}
            <code>npm run seed:demo</code>.
          </div>
        ) : (
          <ul className="space-y-3">
            {threads.map((t, i) => {
              const accents = [
                "var(--accent-cyan)",
                "var(--accent-orange)",
                "var(--accent-green)",
                "var(--accent-pink)",
              ];
              const accent = accents[i % accents.length];
              return (
                <li key={t.id}>
                  <Link
                    href={`/threads/${t.id}`}
                    className="card flex items-stretch gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                  >
                    <span
                      className="w-1.5 shrink-0 rounded-full"
                      style={{ background: accent }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="display text-base text-[var(--text-main)] md:text-lg">
                        {t.subject}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-body)]">
                        {t.account.email} · {t.messageCount} mensajes
                        {t.lastMessageAt
                          ? ` · ${t.lastMessageAt.toISOString().slice(0, 10)}`
                          : ""}
                      </div>
                    </div>
                    <span className="self-center text-[var(--blue-600)]">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function loadThreads() {
  return prisma.thread.findMany({
    include: {
      account: { select: { email: true, usuarioId: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
}
