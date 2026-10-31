# imap-mail — Repositoria Fase 3

Servicio **paralelo** de correo e índice histórico para [Repositoria](https://github.com/felipeloewe/repositoria). Forma parte del producto inclusivo Repositoria (no es una marca separada).

| Rol | Stack |
|-----|--------|
| **Este repo (imap-mail)** | Node.js + Next.js App Router + MySQL + Prisma (API + UI operativa) |
| **Consumidor** | Repositoria **CodeIgniter 4** + PHP 8.2+/8.5 + Apache + MySQL (`ImapMailClient`) |

Repositoria configura `IMAP_MAIL_BASE_URL` (alias `IMAP_MAIL_URL`) apuntando a este servicio. Si está vacío o cae, CI4 usa **mock offline** y sigue pudiendo guardar adjuntos/certificados de demo en Documentos.

## Qué incluye

- Sync IMAP **INBOX + Sent** (ImapFlow + mailparser)
- Reconstrucción de **hilos** (Message-ID / In-Reply-To / References)
- Índice canónico: `MailAccount`, `Thread`, `Message`, `Attachment`
- **Certificado PDF del hilo** (pdfkit)
- Multi-casilla por `usuarioId` (id estable de Repositoria)
- IMAP + **Gmail OAuth** stub (secretos solo por env)
- Webhook outbound → CI4 `POST /api/webhooks/imap-mail`
- UI viva (azul royal, cards redondeadas, Plus Jakarta + Questrial)

## Arranque (desarrollo)

```bash
cp .env.example .env
# DATABASE_URL + opcional GMAIL_* / REPOSITORIA_WEBHOOK_*

npm install
npx prisma migrate dev --name init
npm run seed:demo          # opcional
npm run dev                # :3001
```

CI4 Repositoria (otro proceso):

```bash
# en repositoria/.env
IMAP_MAIL_BASE_URL = http://localhost:3001
# REPOSITORIA_WEBHOOK_SECRET = <mismo valor que aquí si usas push>
php spark serve            # tipicamente :8080
```

## Contrato HTTP para CodeIgniter 4 (`ImapMailClient`)

Base: `{IMAP_MAIL_BASE_URL}` **sin** trailing slash.  
JSON de éxito: `{ "ok": true, "data": … }` · error: `{ "ok": false, "error": "…" }`.

| Método | Ruta | Uso en CI4 |
|--------|------|------------|
| `GET` | `/api/health` | `ImapMailClient::health()` — HTTP 2xx = live |
| `GET` | `/api/accounts?usuarioId=` | Listar casillas del usuario |
| `POST` | `/api/accounts` | Vincular casilla (body JSON abajo) |
| `POST` | `/api/accounts/:id/sync` | Sync IMAP INBOX+Sent |
| `GET` | `/api/threads?usuarioId=` | Listar hilos (UI `/correo`) |
| `GET` | `/api/threads/:id` | Detalle + mensajes + adjuntos |
| `POST` | `/api/threads/:id/certificate` | Generar PDF (CI4 hace POST si GET 404) |
| `GET` | `/api/threads/:id/certificate` | **Bytes PDF** (`Content-Type: application/pdf`) |
| `GET` | `/api/attachments/:id/export` | **Bytes adjunto** + `Content-Disposition` |
| `GET` | `/api/oauth/gmail/start?usuarioId=` | OAuth Gmail (env) |
| `GET` | `/api/oauth/gmail/callback` | Callback OAuth (stub) |
| `POST` | `/api/webhooks/repositoria` | Ping opcional hacia este servicio |

### Guardar en Documentos (flujo CI4)

1. Usuario en Repositoria (membresía real) elige hilo en `/correo/{id}`.
2. CI4 llama `downloadAttachment` / `downloadCertificate` (GET bytes desde este servicio).
3. CI4 crea `Documento` en el repositorio (Departamento + sección + ACL).
4. Opcional: este servicio puede **avisar** a CI4 vía webhook (abajo); el guardado canónico lo hace PHP.

### POST `/api/accounts`

```json
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

Secretos **nunca** en argv — solo body/env.

### Certificado PDF

```http
POST /api/threads/{id}/certificate
Content-Type: application/json

{
  "pushToRepositoria": true,
  "suggestedDepartamentoId": "…",
  "suggestedSeccionId": "…"
}
```

```http
GET /api/threads/{id}/certificate
→ application/pdf
```

### Webhook → CI4

| | |
|--|--|
| URL | `REPOSITORIA_WEBHOOK_URL` → p.ej. `http://localhost:8080/api/webhooks/imap-mail` |
| Secret | Mismo valor que CI4 `REPOSITORIA_WEBHOOK_SECRET` |
| Headers | `X-Repositoria-Secret: …` y `Authorization: Bearer …` |

```json
{
  "event": "thread.certificate.ready",
  "usuarioId": "…",
  "accountId": "…",
  "threadId": "…",
  "suggestedDepartamentoId": "…",
  "suggestedSeccionId": "…",
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

Eventos: `thread.certificate.ready` | `attachment.exported` | `thread.synced`.

## Deploy cPanel / AlmaLinux (nota PHP + Node)

- **Repositoria CI4** vive en Apache/`public/` (PHP). Ver guía en el repo Repositoria (`docs/deploy-cpanel.md`).
- **imap-mail** es una **Node App** paralela (otro subdominio o puerto), MySQL propia o misma instancia con schema `imap_mail`.
- En CI4 `.env`:

```ini
IMAP_MAIL_BASE_URL = https://mail.tudominio.cl
REPOSITORIA_WEBHOOK_SECRET = <compartido>
```

- En imap-mail `.env`:

```env
REPOSITORIA_WEBHOOK_URL=https://repositoria.tudominio.cl/api/webhooks/imap-mail
REPOSITORIA_WEBHOOK_SECRET=<mismo>
```

No hace falta reescribir este servicio a PHP: CI4 lo consume por HTTP. Si en el futuro se desea un worker PHP IMAP nativo, el contrato de arriba es la interfaz estable.

## Modelo (Prisma)

- `MailAccount` — `usuarioId` + IMAP/GMAIL  
- `Thread` — `rootMessageId`, participantes, `certificatePath`  
- `Message` — Message-ID / In-Reply-To / References  
- `Attachment` — metadatos + `storagePath`

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next.js `:3001` |
| `npm run build` / `start` | Producción |
| `npm run db:migrate` | Prisma migrate |
| `npm run seed:demo` | Demo + PDF |

## Alcance

- Rebuild de conceptos imap-mail / softnet.
- Este PR **no** modifica el repo `repositoria` (CI4 PR #2 es el consumidor).
