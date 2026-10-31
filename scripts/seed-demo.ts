/**
 * Offline demo seed: one account, one thread with two messages + attachment metadata,
 * then generate certificado PDF. Requires DATABASE_URL and migrated schema.
 *
 *   npx tsx scripts/seed-demo.ts
 */
import { createId } from "@paralleldrive/cuid2";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MailFolder, MailProvider, PrismaClient } from "@prisma/client";
import { generateThreadCertificate } from "../src/services/pdf/certificate";

const prisma = new PrismaClient();

async function main() {
  const usuarioId = process.env.DEMO_USUARIO_ID || createId();
  const attachmentsBase = path.resolve(
    process.env.ATTACHMENTS_DIR || "./data/attachments",
  );

  const account = await prisma.mailAccount.upsert({
    where: {
      usuarioId_email: {
        usuarioId,
        email: "demo@repositoria.local",
      },
    },
    update: {},
    create: {
      usuarioId,
      email: "demo@repositoria.local",
      displayName: "Demo Repositoria",
      provider: MailProvider.IMAP,
      imapHost: "imap.example.local",
      imapPort: 993,
      imapUser: "demo@repositoria.local",
      imapPasswordEnc: "demo-not-a-real-secret",
    },
  });

  const rootId = "root.demo@repositoria.local";
  const replyId = "reply.demo@repositoria.local";

  const thread = await prisma.thread.upsert({
    where: {
      accountId_rootMessageId: {
        accountId: account.id,
        rootMessageId: rootId,
      },
    },
    update: {
      subject: "Liquidación marzo — revisión",
      participants: [
        "Ana Pérez <ana@empresa.cl>",
        "Contabilidad <conta@empresa.cl>",
      ],
      messageCount: 2,
      lastMessageAt: new Date("2026-03-15T16:00:00Z"),
    },
    create: {
      accountId: account.id,
      rootMessageId: rootId,
      subject: "Liquidación marzo — revisión",
      participants: [
        "Ana Pérez <ana@empresa.cl>",
        "Contabilidad <conta@empresa.cl>",
      ],
      messageCount: 2,
      lastMessageAt: new Date("2026-03-15T16:00:00Z"),
    },
  });

  await prisma.message.deleteMany({ where: { threadId: thread.id } });

  const m1 = await prisma.message.create({
    data: {
      accountId: account.id,
      threadId: thread.id,
      messageId: rootId,
      folder: MailFolder.INBOX,
      fromAddr: "Ana Pérez <ana@empresa.cl>",
      toAddrs: "Contabilidad <conta@empresa.cl>",
      subject: "Liquidación marzo — revisión",
      bodyText:
        "Hola, adjunto borrador de liquidación de marzo para revisión del departamento.",
      date: new Date("2026-03-15T10:00:00Z"),
      imapUid: 1,
    },
  });

  await prisma.message.create({
    data: {
      accountId: account.id,
      threadId: thread.id,
      messageId: replyId,
      inReplyTo: rootId,
      references: [rootId],
      folder: MailFolder.SENT,
      fromAddr: "Contabilidad <conta@empresa.cl>",
      toAddrs: "Ana Pérez <ana@empresa.cl>",
      subject: "Re: Liquidación marzo — revisión",
      bodyText: "Recibido. Queda archivado en el repositorio del departamento.",
      date: new Date("2026-03-15T16:00:00Z"),
      imapUid: 2,
    },
  });

  const dir = path.join(attachmentsBase, account.id);
  await mkdir(dir, { recursive: true });
  const storageName = `${createId()}_liquidacion-marzo.pdf`;
  const abs = path.join(dir, storageName);
  await writeFile(
    abs,
    Buffer.from("%PDF-1.4 demo attachment for Repositoria Fase 3\n"),
  );

  await prisma.attachment.create({
    data: {
      messageId: m1.id,
      filename: "liquidacion-marzo.pdf",
      mimeType: "application/pdf",
      size: 48,
      storagePath: path.relative(attachmentsBase, abs),
    },
  });

  const cert = await generateThreadCertificate(thread.id);

  console.log(
    JSON.stringify(
      {
        usuarioId,
        accountId: account.id,
        threadId: thread.id,
        certificate: cert.filename,
        ui: `/threads/${thread.id}`,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
