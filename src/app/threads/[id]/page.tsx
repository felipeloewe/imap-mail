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
      <main className="page-shell py-12">
        <p style={{ color: "var(--warning-text)" }}>
          No se pudo cargar el hilo (revisa DATABASE_URL).
        </p>
      </main>
    );
  }

  if (!thread) notFound();

  return (
    <div className="pb-10">
      <header className="hero !pb-8">
        <Link
          href="/threads"
          className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white hover:bg-white/25"
        >
          ← Hilos
        </Link>
        <p className="hero-eyebrow mt-4">Certificado PDF del hilo</p>
        <h1 className="mt-2 text-3xl leading-tight text-white md:text-4xl">
          {thread.subject}
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {thread.account.email} · usuarioId {thread.account.usuarioId} ·{" "}
          {thread.messages.length} mensajes
        </p>
      </header>

      <main className="page-shell mt-6 space-y-4">
        <section className="card p-5">
          <h2 className="text-lg text-[var(--text-main)]">Archivo</h2>
          <p className="mt-1 text-sm text-[var(--text-body)]">
            Genera el certificado PDF para enviarlo al repositorio documental.
          </p>
          <CertificateActions
            threadId={thread.id}
            hasCertificate={Boolean(thread.certificatePath)}
          />
        </section>

        <ol className="space-y-3">
          {thread.messages.map((m, i) => (
            <li key={m.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="display text-sm text-[var(--text-muted)]">
                  {i + 1}.
                </span>
                <span
                  className={
                    m.folder === "INBOX" ? "chip chip-inbox" : "chip chip-sent"
                  }
                >
                  {m.folder}
                </span>
                <span className="text-xs text-[var(--text-body)]">
                  {m.date.toISOString()}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-[var(--text-main)]">
                <div>
                  <span className="display text-[var(--text-muted)]">De:</span>{" "}
                  {m.fromAddr}
                </div>
                <div>
                  <span className="display text-[var(--text-muted)]">Para:</span>{" "}
                  {m.toAddrs}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-[var(--text-muted)]">
                  {(m.bodyText ?? "").slice(0, 800) || "(sin cuerpo)"}
                </div>
                {m.attachments.length > 0 && (
                  <ul className="mt-3 space-y-1">
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
    </div>
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
