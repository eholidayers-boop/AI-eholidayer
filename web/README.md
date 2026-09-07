# eHolidayer Web (Next.js)

## Setup

```bash
cd web
npm install
cp .env.example .env.local
# Fill in values; see docs/superpowers/specs/2026-09-06-eholidayer-ai-foundation-design.md
npm run dev
```

## Env vars

See `.env.example`. For local dev, set `AI_PROVIDER=mock` and `ALLOW_MOCK_PROVIDER=true`. Set `LEGACY_API_BASE_URL` to your Joomla dev server (e.g. `http://localhost:8080`) and `LEGACY_API_TOKEN` to a matching secret in Joomla's `.env`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npx vitest run` — unit + integration tests
- `npx playwright test` — E2E tests (after first install via `npx playwright install`)
