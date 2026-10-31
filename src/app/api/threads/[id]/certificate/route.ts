import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import {
  generateThreadCertificate,
  resolveCertificateAbsolutePath,
} from "@/services/pdf/certificate";
import { pushToRepositoria } from "@/services/repositoria/webhook";

type Params = { params: Promise<{ id: string }> };

/** Generate (or regenerate) the thread certificate PDF. */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      pushToRepositoria?: boolean;
      suggestedDepartamentoId?: string;
      /** CI4 Documentos sección */
      suggestedSeccionId?: string;
    };

    const result = await generateThreadCertificate(id);
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!thread) return jsonError("Thread not found", 404);

    let webhook:
      | Awaited<ReturnType<typeof pushToRepositoria>>
      | undefined;

    if (body.pushToRepositoria) {
      webhook = await pushToRepositoria({
        event: "thread.certificate.ready",
        usuarioId: thread.account.usuarioId,
        accountId: thread.accountId,
        threadId: thread.id,
        suggestedDepartamentoId: body.suggestedDepartamentoId,
        suggestedSeccionId: body.suggestedSeccionId,
        files: [
          {
            kind: "certificate_pdf",
            filename: result.filename,
            mimeType: "application/pdf",
            downloadPath: `/api/threads/${id}/certificate`,
          },
        ],
        metadata: {
          subject: thread.subject,
          messageCount: thread.messageCount,
          consumer: "repositoria-ci4",
        },
      });
    }

    return jsonOk({
      threadId: id,
      certificatePath: result.thread.certificatePath,
      certificateGeneratedAt: result.thread.certificateGeneratedAt,
      downloadPath: `/api/threads/${id}/certificate`,
      webhook,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** Download the generated certificate PDF. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const thread = await prisma.thread.findUnique({ where: { id } });
    if (!thread) return jsonError("Thread not found", 404);
    if (!thread.certificatePath) {
      return jsonError("Certificate not generated yet — POST first", 404);
    }

    const abs = resolveCertificateAbsolutePath(thread.certificatePath);
    const bytes = await readFile(abs);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="thread-${id}.pdf"`,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
