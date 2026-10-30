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
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Repositoria · Correo</p>
          <h1 className="mt-1 text-3xl tracking-tight text-[var(--text-main)]">
            Hilos
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--blue-700)]"
        >
          Inicio
        </Link>
      </div>

      {error ? (
        <p
          className="rounded-[var(--radius-sm)] border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--warning-border)",
            background: "var(--warning-bg)",
            color: "var(--warning-text)",
          }}
        >
          {error}
        </p>
      ) : threads.length === 0 ? (
        <p className="text-[var(--text-body)]">
          Sin hilos aún. Vincula una casilla vía{" "}
          <code>POST /api/accounts</code> y ejecuta sync, o usa{" "}
          <code>npm run seed:demo</code>.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          {threads.map((t) => (
            <li key={t.id} className="py-4">
              <Link
                href={`/threads/${t.id}`}
                className="block rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[var(--bg-muted)]"
              >
                <div className="text-[var(--text-main)]">{t.subject}</div>
                <div className="mt-1 text-sm text-[var(--text-body)]">
                  {t.account.email} · {t.messageCount} mensajes
                  {t.lastMessageAt
                    ? ` · ${t.lastMessageAt.toISOString().slice(0, 10)}`
                    : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
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
