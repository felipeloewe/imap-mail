import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CertificateActions } from "./certificate-actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ThreadDetailPage({ params }: Props) {
  const { id } = await params;

  let thread: Awaited<ReturnType<typeof loadThread>> = null;
  try {
    thread = await loadThread(id);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-amber-800">
          No se pudo cargar el hilo (revisa DATABASE_URL).
        </p>
      </main>
    );
  }

  if (!thread) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link
        href="/threads"
        className="text-sm text-stone-600 hover:text-stone-900"
      >
        ← Hilos
      </Link>
      <header className="mt-4 space-y-2 border-b border-stone-200 pb-6">
        <p className="text-sm text-teal-800/70">Certificado PDF del hilo</p>
        <h1 className="text-3xl font-semibold text-stone-900">
          {thread.subject}
        </h1>
        <p className="text-sm text-stone-500">
          {thread.account.email} · usuarioId {thread.account.usuarioId} ·{" "}
          {thread.messages.length} mensajes
        </p>
        <CertificateActions
          threadId={thread.id}
          hasCertificate={Boolean(thread.certificatePath)}
        />
      </header>

      <ol className="mt-8 space-y-6">
        {thread.messages.map((m, i) => (
          <li key={m.id} className="border-l-2 border-teal-800/30 pl-4">
            <div className="text-xs uppercase tracking-wide text-stone-500">
              {i + 1}. {m.folder} · {m.date.toISOString()}
            </div>
            <div className="mt-1 text-sm text-stone-800">
              <div>
                <span className="font-medium">De:</span> {m.fromAddr}
              </div>
              <div>
                <span className="font-medium">Para:</span> {m.toAddrs}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-stone-700">
                {(m.bodyText ?? "").slice(0, 800) || "(sin cuerpo)"}
              </div>
              {m.attachments.length > 0 && (
                <ul className="mt-2 text-sm text-teal-900">
                  {m.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        className="underline"
                        href={`/api/attachments/${a.id}/export`}
                      >
                        {a.filename}
                      </a>{" "}
                      <span className="text-stone-500">
                        ({a.mimeType}, {a.size} B)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}

function loadThread(id: string) {
  return prisma.thread.findUnique({
    where: { id },
    include: {
      account: { select: { email: true, usuarioId: true } },
      messages: {
        orderBy: { date: "asc" },
        include: {
          attachments: {
            select: {
              id: true,
              filename: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
    },
  });
}
