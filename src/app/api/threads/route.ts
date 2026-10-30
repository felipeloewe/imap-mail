import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get("usuarioId");
    const accountId = searchParams.get("accountId");
    const q = searchParams.get("q")?.trim();
    const take = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const skip = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    if (!usuarioId && !accountId) {
      return Response.json(
        { ok: false, error: "usuarioId or accountId required" },
        { status: 400 },
      );
    }

    const threads = await prisma.thread.findMany({
      where: {
        ...(accountId ? { accountId } : {}),
        ...(usuarioId ? { account: { usuarioId } } : {}),
        ...(q
          ? {
              OR: [
                { subject: { contains: q } },
                { rootMessageId: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        account: {
          select: { id: true, email: true, usuarioId: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take,
      skip,
    });

    return jsonOk(threads);
  } catch (err) {
    return handleRouteError(err);
  }
}
