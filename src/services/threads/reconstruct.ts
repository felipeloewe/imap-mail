import { prisma } from "@/lib/prisma";
import { normalizeMessageId, parseReferences } from "@/lib/message-id";

export type ThreadSeedMessage = {
  messageId: string;
  inReplyTo?: string | null;
  references?: string[] | null;
  subject: string;
  fromAddr: string;
  toAddrs: string;
  ccAddrs?: string | null;
  date: Date;
};

/**
 * Resolve or create a Thread for a message using Message-ID / In-Reply-To / References.
 * Root = first id in References, else In-Reply-To, else own Message-ID.
 */
export async function resolveThreadForMessage(
  accountId: string,
  seed: ThreadSeedMessage,
) {
  const messageId = normalizeMessageId(seed.messageId);
  if (!messageId) {
    throw new Error("Message missing Message-ID");
  }

  const refs = (seed.references ?? []).map((r) => normalizeMessageId(r)).filter((x): x is string => Boolean(x));
  const inReplyTo = normalizeMessageId(seed.inReplyTo);
  const rootMessageId = refs[0] ?? inReplyTo ?? messageId;

  // Prefer an existing thread that already contains any referenced id
  const candidateIds = [...new Set([rootMessageId, ...refs, inReplyTo, messageId].filter((x): x is string => Boolean(x)))];

  const existingMsg = await prisma.message.findFirst({
    where: {
      accountId,
      messageId: { in: candidateIds },
    },
    include: { thread: true },
    orderBy: { date: "asc" },
  });

  if (existingMsg?.thread) {
    return existingMsg.thread;
  }

  const byRoot = await prisma.thread.findUnique({
    where: {
      accountId_rootMessageId: { accountId, rootMessageId },
    },
  });
  if (byRoot) return byRoot;

  const participants = buildParticipants(seed);

  return prisma.thread.create({
    data: {
      accountId,
      rootMessageId,
      subject: seed.subject || "(sin asunto)",
      participants,
      messageCount: 0,
      lastMessageAt: seed.date,
    },
  });
}

export function buildParticipants(seed: ThreadSeedMessage): string[] {
  const parts = [seed.fromAddr, seed.toAddrs, seed.ccAddrs ?? ""]
    .join(",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

export async function refreshThreadStats(threadId: string) {
  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { date: "asc" },
    select: {
      fromAddr: true,
      toAddrs: true,
      ccAddrs: true,
      subject: true,
      date: true,
    },
  });

  const participants = new Set<string>();
  for (const m of messages) {
    for (const p of buildParticipants({
      messageId: "x",
      subject: m.subject,
      fromAddr: m.fromAddr,
      toAddrs: m.toAddrs,
      ccAddrs: m.ccAddrs,
      date: m.date,
    })) {
      participants.add(p);
    }
  }

  const last = messages[messages.length - 1];
  const first = messages[0];

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      messageCount: messages.length,
      lastMessageAt: last?.date ?? null,
      subject: first?.subject || "(sin asunto)",
      participants: [...participants],
    },
  });
}

export { parseReferences, normalizeMessageId };
