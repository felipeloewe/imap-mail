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
          <p className="text-sm text-teal-800/70">Repositoria · Correo</p>
          <h1 className="text-3xl font-semibold text-stone-900">Hilos</h1>
        </div>
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          Inicio
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : threads.length === 0 ? (
        <p className="text-stone-600">
          Sin hilos aún. Vincula una casilla vía{" "}
          <code>POST /api/accounts</code> y ejecuta sync, o usa{" "}
          <code>npm run seed:demo</code>.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 border-t border-stone-200">
          {threads.map((t) => (
            <li key={t.id} className="py-4">
              <Link
                href={`/threads/${t.id}`}
                className="block hover:bg-stone-50"
              >
                <div className="font-medium text-stone-900">{t.subject}</div>
                <div className="mt-1 text-sm text-stone-500">
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
