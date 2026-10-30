import PDFDocument from "pdfkit";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getEnvOptional } from "@/lib/env";

function certificatesDir() {
  return path.resolve(getEnvOptional().CERTIFICATES_DIR ?? "./data/certificates");
}

/**
 * Certificado PDF del hilo — archival summary for Repositoria document repo.
 * Inclusive Repositoria product surface (not a separate brand).
 */
export async function generateThreadCertificate(threadId: string) {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      account: true,
      messages: {
        orderBy: { date: "asc" },
        include: { attachments: true },
      },
    },
  });

  if (!thread) throw new Error("Thread not found");

  const dir = certificatesDir();
  await mkdir(dir, { recursive: true });
  const filename = `thread-${thread.id}.pdf`;
  const absPath = path.join(dir, filename);

  const pdfBuffer = await renderCertificatePdf({
    threadId: thread.id,
    subject: thread.subject,
    rootMessageId: thread.rootMessageId,
    accountEmail: thread.account.email,
    usuarioId: thread.account.usuarioId,
    participants: Array.isArray(thread.participants)
      ? (thread.participants as string[])
      : [],
    messages: thread.messages.map((m) => ({
      date: m.date,
      fromAddr: m.fromAddr,
      toAddrs: m.toAddrs,
      subject: m.subject,
      folder: m.folder,
      messageId: m.messageId,
      bodyPreview: (m.bodyText ?? "").slice(0, 400),
      attachments: m.attachments.map((a) => ({
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
      })),
    })),
  });

  await writeFile(absPath, pdfBuffer);

  const relative = path.relative(certificatesDir(), absPath);
  const updated = await prisma.thread.update({
    where: { id: threadId },
    data: {
      certificatePath: relative,
      certificateGeneratedAt: new Date(),
    },
  });

  return { thread: updated, absolutePath: absPath, filename };
}

type CertInput = {
  threadId: string;
  subject: string;
  rootMessageId: string;
  accountEmail: string;
  usuarioId: string;
  participants: string[];
  messages: Array<{
    date: Date;
    fromAddr: string;
    toAddrs: string;
    subject: string;
    folder: string;
    messageId: string;
    bodyPreview: string;
    attachments: Array<{ filename: string; mimeType: string; size: number }>;
  }>;
};

function renderCertificatePdf(input: CertInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .text("Repositoria — Certificado de hilo de correo", { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#444444")
      .text(
        "Documento de archivo generado por el servicio de correo de Repositoria (Fase 3).",
      );
    doc.moveDown();
    doc.fillColor("#000000").fontSize(12);
    doc.text(`Asunto: ${input.subject}`);
    doc.text(`Thread ID: ${input.threadId}`);
    doc.text(`Root Message-ID: ${input.rootMessageId}`);
    doc.text(`Casilla: ${input.accountEmail}`);
    doc.text(`Usuario Repositoria (usuarioId): ${input.usuarioId}`);
    doc.text(`Mensajes: ${input.messages.length}`);
    doc.text(`Generado: ${new Date().toISOString()}`);
    doc.moveDown();
    doc.fontSize(11).text("Participantes");
    doc.fontSize(10).fillColor("#333333");
    for (const p of input.participants.slice(0, 40)) {
      doc.text(`• ${p}`);
    }
    doc.moveDown();
    doc.fillColor("#000000").fontSize(11).text("Cronología del hilo");
    doc.moveDown(0.3);

    for (const [i, m] of input.messages.entries()) {
      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`${i + 1}. [${m.folder}] ${m.date.toISOString()}`);
      doc.fillColor("#333333").text(`De: ${m.fromAddr}`);
      doc.text(`Para: ${m.toAddrs}`);
      doc.text(`Asunto: ${m.subject}`);
      doc.text(`Message-ID: ${m.messageId}`);
      if (m.bodyPreview) {
        doc.text(`Extracto: ${m.bodyPreview.replace(/\s+/g, " ").trim()}`);
      }
      if (m.attachments.length) {
        doc.text(
          `Adjuntos: ${m.attachments.map((a) => `${a.filename} (${a.mimeType}, ${a.size} B)`).join("; ")}`,
        );
      }
      doc.moveDown(0.6);
      if (doc.y > 720) doc.addPage();
    }

    doc
      .fillColor("#666666")
      .fontSize(8)
      .text(
        "Este certificado resume metadatos del hilo para archivo en el repositorio documental. No sustituye los mensajes originales.",
        50,
        760,
        { width: 500 },
      );

    doc.end();
  });
}

export function resolveCertificateAbsolutePath(relativePath: string) {
  return path.resolve(certificatesDir(), relativePath);
}
