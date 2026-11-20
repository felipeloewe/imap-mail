# Static Apache home (imap.booklet.cl)

Apache serves `/` from docroot `index.html` (see live `.htaccess` `RewriteRule ^$ /index.html`).
`/threads` and `/api/*` proxy to Next on `:3002`.

**Do not** link hashed `/_next/static/css/*.css` from this file — rebuilds 404 and leave the home unstyled (logo + blue default links).

## Deploy

Copy to docroot `/home/bookletcl/public_html/imap.booklet.cl/`:

| Source | Destination |
|--------|-------------|
| `deploy/static-home/index.html` | `index.html` |
| `public/brand/home.css` | `brand/home.css` (and `public/brand/home.css`) |

Stylesheet: `/brand/home.css` (stable path, same tokens as `src/app/globals.css`).
