import { createId } from "@paralleldrive/cuid2";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MailFolder, SyncStatus, type MailAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEnvOptional } from "@/lib/env";
import {
  formatAddrs,
  normalizeMessageId,
  parseReferences,
} from "@/lib/message-id";
import {
  refreshThreadStats,
  resolveThreadForMessage,
} from "@/services/threads/reconstruct";

const FOLDER_MAP: Array<{ box: string; folder: MailFolder }> = [
  { box: "INBOX", folder: MailFolder.INBOX },
  { box: "Sent", folder: MailFolder.SENT },
  { box: "Sent Messages", folder: MailFolder.SENT },
  { box: "[Gmail]/Sent Mail", folder: MailFolder.SENT },
];

function attachmentsDir(accountId: string) {
  const base = getEnvOptional().ATTACHMENTS_DIR ?? "./data/attachments";
  return path.resolve(base, accountId);
}

async function openClient(account: MailAccount): Promise<ImapFlow> {
  if (!account.imapHost || !account.imapUser) {
    throw new Error("IMAP host/user not configured for this account");
  }
  if (!account.imapPasswordEnc) {
    throw new Error("IMAP password not configured (set via API / env vault)");
  }

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort ?? 993,
    secure: account.imapSecure,
    auth: {
      user: account.imapUser,
      pass: account.imapPasswordEnc,
    },
    logger: false,
  });

  await client.connect();
  return client;
}

async function listAvailableBoxes(client: ImapFlow): Promise<Set<string>> {
  const boxes = await client.list();
  return new Set(boxes.map((b) => b.path));
}

async function syncFolder(
  client: ImapFlow,
  account: MailAccount,
  boxPath: string,
  folder: MailFolder,
) {
  const lock = await client.getMailboxLock(boxPath);
  try {
    const uids = await client.search({ all: true });
    if (!uids || uids.length === 0) return 0;

    // Cap initial scaffold sync; full incremental sync comes later
    const recent = uids.slice(-200);
    let imported = 0;

    for await (const msg of client.fetch(recent, {
      uid: true,
      source: true,
      envelope: true,
    })) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const messageId = normalizeMessageId(parsed.messageId);
      if (!messageId) continue;

      const existing = await prisma.message.findUnique({
        where: {
          accountId_messageId: { accountId: account.id, messageId },
        },
      });
      if (existing) continue;

      const refs = parseReferences(parsed.references);
      const inReplyTo = normalizeMessageId(
        typeof parsed.inReplyTo === "string"
          ? parsed.inReplyTo
          : Array.isArray(parsed.inReplyTo)
            ? parsed.inReplyTo[0]
            : null,
      );

      const date = parsed.date ?? new Date();
      const subject = parsed.subject ?? "(sin asunto)";
      const fromAddr = formatAddrs(parsed.from);
      const toAddrs = formatAddrs(parsed.to);
      const ccAddrs = formatAddrs(parsed.cc) || null;

      const thread = await resolveThreadForMessage(account.id, {
        messageId,
        inReplyTo,
        references: refs,
        subject,
        fromAddr,
        toAddrs,
        ccAddrs,
        date,
      });

      const created = await prisma.message.create({
        data: {
          accountId: account.id,
          threadId: thread.id,
          messageId,
          inReplyTo,
          references: refs,
          folder,
          fromAddr,
          toAddrs,
          ccAddrs,
          subject,
          bodyText: parsed.text ?? null,
          bodyHtml: typeof parsed.html === "string" ? parsed.html : null,
          date,
          imapUid: msg.uid,
        },
      });

      if (parsed.attachments?.length) {
        const dir = attachmentsDir(account.id);
        await mkdir(dir, { recursive: true });
        for (const att of parsed.attachments) {
          const safeName = (att.filename || "attachment").replace(
            /[/\\?%*:|"<>]/g,
            "_",
          );
          const storageName = `${createId()}_${safeName}`;
          const storagePath = path.join(dir, storageName);
          await writeFile(storagePath, att.content);
          await prisma.attachment.create({
            data: {
              messageId: created.id,
              filename: att.filename || safeName,
              mimeType: att.contentType || "application/octet-stream",
              size: att.size ?? att.content.length,
              contentId: att.contentId
                ? normalizeMessageId(att.contentId)
                : null,
              storagePath: path.relative(
                path.resolve(getEnvOptional().ATTACHMENTS_DIR ?? "./data/attachments"),
                storagePath,
              ),
            },
          });
        }
      }

      await refreshThreadStats(thread.id);
      imported += 1;
    }

    return imported;
  } finally {
    lock.release();
  }
}

export async function syncAccount(accountId: string) {
  const account = await prisma.mailAccount.findUnique({
    where: { id: accountId },
  });
  if (!account) throw new Error("Account not found");

  await prisma.mailAccount.update({
    where: { id: accountId },
    data: { syncStatus: SyncStatus.SYNCING, syncError: null },
  });

  let client: ImapFlow | null = null;
  try {
    client = await openClient(account);
    const available = await listAvailableBoxes(client);
    const syncedFolders = new Set<MailFolder>();
    let total = 0;

    for (const { box, folder } of FOLDER_MAP) {
      if (syncedFolders.has(folder) && folder === MailFolder.SENT) continue;
      if (!available.has(box)) continue;
      total += await syncFolder(client, account, box, folder);
      syncedFolders.add(folder);
    }

    await prisma.mailAccount.update({
      where: { id: accountId },
      data: {
        syncStatus: SyncStatus.IDLE,
        lastSyncedAt: new Date(),
        syncError: null,
      },
    });

    return { imported: total, folders: [...syncedFolders] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await prisma.mailAccount.update({
      where: { id: accountId },
      data: { syncStatus: SyncStatus.ERROR, syncError: message },
    });
    throw err;
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch {
        /* ignore */
      }
    }
  }
}
