# imap-mail — Repositoria Fase 3

Servicio **paralelo** Node/TypeScript de correo e índice histórico para [Repositoria](https://github.com/felipeloewe/repositoria). Forma parte del producto inclusivo Repositoria (no es una marca separada).

Stack: **Next.js (App Router) + MySQL + Prisma**.

## Qué incluye (primer scaffold)

- Sync IMAP de **INBOX** y **Sent** (ImapFlow + mailparser)
- Reconstrucción de **hilos** (Message-ID / In-Reply-To / References)
- Índice canónico: `MailAccount`, `Thread`, `Message`, `Attachment`
- **Certificado PDF del hilo** (pdfkit) para archivo en el repositorio documental
- Multi-casilla vinculada por `usuarioId` externo (cuid de Repositoria)
- Credenciales IMAP + camino **Gmail OAuth** stubbeado vía env
- Webhook/callback stub hacia Repositoria

Este repo **no** modifica el código de Repositoria. La UI de vinculación casilla → repo es una tarea posterior (REP-9).

## Arranque

```bash
cp .env.example .env
# edita DATABASE_URL y, si aplica, GMAIL_* / REPOSITORIA_WEBHOOK_*

npm install
npx prisma migrate dev --name init
npm run dev -- -p 3001
```

Demo offline (sin IMAP real):

```bash
npm run seed:demo
# abre /threads/<threadId> y genera/descarga el certificado PDF
```

## APIs que Repositoria llamará

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/health` | Salud + flags de config |
| `GET` | `/api/accounts?usuarioId=` | Casillas del usuario |
| `POST` | `/api/accounts` | Vincular casilla (`usuarioId`, IMAP o prep Gmail) |
| `POST` | `/api/accounts/:id/sync` | Sync INBOX + Sent |
| `GET` | `/api/threads?usuarioId=` | Listar hilos |
| `GET` | `/api/threads/:id` | Detalle + mensajes + adjuntos |
| `POST` | `/api/threads/:id/certificate` | Generar PDF (`pushToRepositoria?: true`) |
| `GET` | `/api/threads/:id/certificate` | Descargar PDF |
| `GET` | `/api/attachments/:id/export` | Exportar adjunto (`?pushToRepositoria=1`) |
| `GET` | `/api/oauth/gmail/start?usuarioId=` | Inicio OAuth Gmail |
| `GET` | `/api/oauth/gmail/callback` | Callback OAuth (stub de exchange) |
| `POST` | `/api/webhooks/repositoria` | Ping inbound de conectividad |

Respuestas JSON: `{ ok: true, data }` o `{ ok: false, error }`.

### Ejemplo: vincular casilla IMAP

```http
POST /api/accounts
Content-Type: application/json

{
  "usuarioId": "clxxxxxxxx",
  "email": "ana@empresa.cl",
  "provider": "IMAP",
  "imapHost": "imap.empresa.cl",
  "imapPort": 993,
  "imapUser": "ana@empresa.cl",
  "imapPassword": "<from-vault>"
}
```

Secretos solo por cuerpo/env — **nunca en argv**.

### Ejemplo: certificado → Repositoria

```http
POST /api/threads/{id}/certificate
Content-Type: application/json

{
  "pushToRepositoria": true,
  "suggestedDepartamentoId": "cldeptxxx"
}
```

Si `REPOSITORIA_WEBHOOK_URL` está definido, el servicio POSTea:

```json
{
  "event": "thread.certificate.ready",
  "usuarioId": "...",
  "accountId": "...",
  "threadId": "...",
  "suggestedDepartamentoId": "...",
  "files": [
    {
      "kind": "certificate_pdf",
      "filename": "thread-….pdf",
      "mimeType": "application/pdf",
      "downloadPath": "/api/threads/{id}/certificate"
    }
  ]
}
```

Misma forma para adjuntos (`event: attachment.exported`).

## Integración prevista en Repositoria

1. Usuario autenticado (membresía real) abre “Vincular casilla” en el perfil/empresa.
2. Repositoria crea `MailAccount` en este servicio con su `usuarioId` (cuid).
3. Sync periódico o on-demand; UI lista hilos filtrados por membresía/ACL en Repositoria.
4. Acción “Enviar al repositorio”: exporta adjuntos + genera certificado PDF y los registra como documentos ligados al **Departamento** (Fase 2).
5. IA buscar/resumir sobre el índice: después del vínculo al repo.

Auth de servicio a servicio (mTLS / JWT interno) queda fuera de este scaffold; por ahora webhook secret opcional.

## Modelo (Prisma)

- `MailAccount` — `usuarioId` + proveedor IMAP/GMAIL
- `Thread` — `rootMessageId`, participantes, stats, `certificatePath`
- `Message` — Message-ID, In-Reply-To, References, carpeta, cuerpo
- `Attachment` — metadatos + `storagePath` local

## Variables de entorno

Ver [`.env.example`](./.env.example). OAuth client id/secret **solo** desde env (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`).

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next.js (usar `-p 3001`) |
| `npm run build` / `start` | Producción |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` |
| `npm run seed:demo` | Datos + PDF de demostración |

## Alcance explícito

- Rebuild de conceptos imap-mail / softnet (sin carpeta softnet local).
- No tocar el repositorio `repositoria` en este PR.
