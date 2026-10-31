import { MailProvider } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/api";

const createSchema = z.object({
  usuarioId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  provider: z.enum(["IMAP", "GMAIL"]).default("IMAP"),
  imapHost: z.string().optional(),
  imapPort: z.number().int().positive().optional(),
  imapSecure: z.boolean().optional(),
  imapUser: z.string().optional(),
  /** Plain password from Repositoria vault call — stored as imapPasswordEnc (encrypt at rest later) */
  imapPassword: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get("usuarioId");
    if (!usuarioId) {
      return Response.json(
        { ok: false, error: "usuarioId query required" },
        { status: 400 },
      );
    }
    const accounts = await prisma.mailAccount.findMany({
      where: { usuarioId },
      select: {
        id: true,
        usuarioId: true,
        email: true,
        displayName: true,
        provider: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        imapUser: true,
        syncStatus: true,
        syncError: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(accounts);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = createSchema.parse(await req.json());
    const account = await prisma.mailAccount.create({
      data: {
        usuarioId: body.usuarioId,
        email: body.email,
        displayName: body.displayName,
        provider: body.provider as MailProvider,
        imapHost: body.imapHost,
        imapPort: body.imapPort ?? 993,
        imapSecure: body.imapSecure ?? true,
        imapUser: body.imapUser ?? body.email,
        imapPasswordEnc: body.imapPassword,
      },
      select: {
        id: true,
        usuarioId: true,
        email: true,
        displayName: true,
        provider: true,
        syncStatus: true,
        createdAt: true,
      },
    });
    return jsonCreated(account);
  } catch (err) {
    return handleRouteError(err);
  }
}
