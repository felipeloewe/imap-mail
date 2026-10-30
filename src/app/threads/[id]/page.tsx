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
        <p style={{ color: "var(--warning-text)" }}>
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
        className="text-sm text-[var(--text-muted)] hover:text-[var(--blue-700)]"
      >
        ← Hilos
      </Link>
      <header className="mt-4 space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <p className="eyebrow">Certificado PDF del hilo</p>
        <h1 className="text-3xl tracking-tight text-[var(--text-main)]">
          {thread.subject}
        </h1>
        <p className="text-sm text-[var(--text-body)]">
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
          <li
            key={m.id}
            className="border-l-2 pl-4"
            style={{ borderColor: "var(--blue-100)" }}
          >
            <div className="text-xs uppercase tracking-wide text-[var(--text-body)]">
              {i + 1}. {m.folder} · {m.date.toISOString()}
            </div>
            <div className="mt-1 text-sm text-[var(--text-main)]">
              <div>
                <span className="font-medium">De:</span> {m.fromAddr}
              </div>
              <div>
                <span className="font-medium">Para:</span> {m.toAddrs}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-[var(--text-muted)]">
                {(m.bodyText ?? "").slice(0, 800) || "(sin cuerpo)"}
              </div>
              {m.attachments.length > 0 && (
                <ul className="mt-2 text-sm">
                  {m.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        className="link-accent"
                        href={`/api/attachments/${a.id}/export`}
                      >
                        {a.filename}
                      </a>{" "}
                      <span className="text-[var(--text-body)]">
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
