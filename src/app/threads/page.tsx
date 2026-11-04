import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandHero } from "@/components/BrandHero";

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
      <BrandHero
        compact
        eyebrow="Repositoria · Correo"
        title="Hilos"
        support="Índice canónico reconstruido por Message-ID / In-Reply-To / References."
        topRight={
          <Link href="/" className="text-sm font-semibold text-white/90 hover:text-white">
            Inicio
          </Link>
        }
      />

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
                "var(--brand-navy)",
                "var(--brand-blue)",
                "var(--brand-steel)",
                "var(--brand-teal)",
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
                    <span className="self-center text-[var(--brand-blue)]">›</span>
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
