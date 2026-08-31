# Countdown on your knees

Countdown-App auf Cloudflare Workers. Countdown mit Zieldatum/-uhrzeit, Text und
Hintergrundfarbe erstellen und per Link teilen. Der Link öffnet eine
Vollbild-Countdown-Ansicht ohne jegliches UI-Chrome – nur die Hintergrundfarbe
über den ganzen Viewport und der Countdown mittig.

## Funktionsweise

- `/` – Formular zum Anlegen eines Countdowns (Zieldatum & -uhrzeit, Text,
  Hintergrundfarbe). Nach dem Absenden ("Countdown aktivieren") wird der
  Countdown in Cloudflare KV gespeichert und ein Link `/c/<id>` angezeigt.
- `/c/<id>` – die reine Countdown-Ansicht: volle Fläche, gewählte
  Hintergrundfarbe, Countdown (Tage/Std/Min/Sek) und Text zentriert. Die
  Textfarbe (schwarz/weiß) wird automatisch für Lesbarkeit auf der gewählten
  Hintergrundfarbe berechnet. Läuft der Countdown ab, verschwinden die Zahlen
  und nur der Text bleibt groß stehen.
- `/api/countdowns` (POST) – legt einen Countdown an, validiert Eingaben und
  liefert `{ id, url }` zurück.

Daten liegen in einem Cloudflare KV-Namespace (`COUNTDOWNS`), Server-seitiges
Rendering läuft in einem einzelnen Cloudflare Worker (kein Framework, kein
Build-Schritt außer dem automatischen Bundling von Wrangler).

## Lokale Entwicklung

```bash
npm install
npm run dev       # startet wrangler dev (Miniflare, lokale KV-Simulation)
npm run typecheck # TypeScript-Check
```

## Deployment auf Cloudflare

### Variante A: GitHub Actions (in diesem Repo bereits eingerichtet)

`.github/workflows/deploy.yml` deployt bei jedem Push auf `main` automatisch
per `wrangler deploy`. Dafür müssen im Repository unter *Settings → Secrets
and variables → Actions* folgende Secrets gesetzt sein:

- `CLOUDFLARE_API_TOKEN` – ein API-Token mit der Berechtigung "Edit
  Cloudflare Workers" (Cloudflare Dashboard → My Profile → API Tokens).
- `CLOUDFLARE_ACCOUNT_ID` – die Account-ID aus dem Cloudflare Dashboard.

### Variante B: Manuell mit Wrangler

```bash
npx wrangler login
npx wrangler deploy
```

### KV-Namespace

Der KV-Namespace `COUNTDOWNS` ist bereits angelegt und in `wrangler.toml`
verknüpft (Binding `COUNTDOWNS`). Für ein eigenes Cloudflare-Konto einen
neuen Namespace anlegen und die `id` in `wrangler.toml` ersetzen:

```bash
npx wrangler kv namespace create COUNTDOWNS
```

Nach dem Deploy ist die App unter der Workers-URL erreichbar (z. B.
`https://countdown-on-your-knees.<dein-subdomain>.workers.dev`) – dort kann
ein Countdown angelegt werden, dessen Link dann `/c/<id>` aufruft.
