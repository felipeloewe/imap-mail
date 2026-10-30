import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getEnvOptional } from "@/lib/env";
import { handleRouteError, jsonError } from "@/lib/api";
import { pushToRepositoria } from "@/services/repositoria/webhook";

type Params = { params: Promise<{ id: string }> };

/** Export / download an attachment; optional push into Repositoria. */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const push = searchParams.get("pushToRepositoria") === "1";
    const suggestedDepartamentoId =
      searchParams.get("departamentoId") ?? undefined;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        message: {
          include: {
            account: true,
            thread: true,
          },
        },
      },
    });
    if (!attachment) return jsonError("Attachment not found", 404);

    const base = path.resolve(
      getEnvOptional().ATTACHMENTS_DIR ?? "./data/attachments",
    );
    const abs = path.resolve(base, attachment.storagePath);
    if (!abs.startsWith(base)) {
      return jsonError("Invalid storage path", 400);
    }

    const bytes = await readFile(abs);

    if (push) {
      await pushToRepositoria({
        event: "attachment.exported",
        usuarioId: attachment.message.account.usuarioId,
        accountId: attachment.message.accountId,
        threadId: attachment.message.threadId,
        attachmentId: attachment.id,
        suggestedDepartamentoId,
        files: [
          {
            kind: "attachment",
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            downloadPath: `/api/attachments/${id}/export`,
          },
        ],
        metadata: {
          subject: attachment.message.subject,
          messageId: attachment.message.messageId,
        },
      });
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename.replace(/"/g, "")}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
