import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            usuarioId: true,
            provider: true,
          },
        },
        messages: {
          orderBy: { date: "asc" },
          include: {
            attachments: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                size: true,
                contentId: true,
              },
            },
          },
        },
      },
    });
    if (!thread) return jsonError("Thread not found", 404);
    return jsonOk(thread);
  } catch (err) {
    return handleRouteError(err);
  }
}
