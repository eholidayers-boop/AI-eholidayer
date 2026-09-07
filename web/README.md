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

## Launch checklist (M6)

- [ ] All unit, integration, and E2E tests green.
- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `AI_PROVIDER=anthropic` tested end-to-end with a real `ANTHROPIC_API_KEY` against a staging inventory.
- [ ] Legacy shim `com_api` installed on production Joomla and `/api/v1/health` returns `ok=true`.
- [ ] CORS allowlist contains `https://app.eholidayer.com`.
- [ ] Vercel env vars set: `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `LEGACY_API_BASE_URL`, `LEGACY_API_TOKEN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ALLOW_MOCK_PROVIDER=false`.
- [ ] Daily token budget threshold tuned (default 2,000,000).
- [ ] Rate limit (20/min/session) verified in load test.
- [ ] Sentry or equivalent error tracking wired (out of scope for this milestone, follow up in sub-project 5).
