# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

```bash
pnpm build              # compile with tsup → dist/ (multi-entry: core + 4 framework adapters)
pnpm typecheck          # tsc --noEmit (source of truth for types; tsup owns emit)
pnpm lint               # biome lint --write --unsafe
pnpm format             # biome format --write
pnpm test               # vitest (watch)
pnpm test:unit          # unit project only — deterministic, no network (the CI release gate)
pnpm test:integration   # hits the Bold sandbox; each surface self-skips if its key is absent
pnpm sandbox            # tsx examples/sandbox/verify.ts — live end-to-end smoke check
pnpm clean
```

## Architecture

ESM-only Node.js SDK for the Bold Payments API (Colombia), published as `@pulgueta/bold`. `zod` is a required peer dependency (runtime response validation). `express` and `hono` are **optional** peers needed only by their respective adapters.

### Integration surfaces

Bold exposes several APIs on different hosts, each authenticated with its **own** dashboard key pair (identity + secret, with sandbox/production variants). One `Bold` client maps each surface to a resource:

| Surface | Base URL | Resource |
| --- | --- | --- |
| API Integrations (datáfono/POS app-checkout) | `integrations.api.bold.co` | `bold.payments`, `bold.terminals` |
| API Link de pagos | `integrations.api.bold.co/online/link/v1` | `bold.links` |
| Online Payments API (BETA) | `api.online.payments.bold.co` | `bold.online` |
| Transaction voucher status | `payments.api.bold.co` | `bold.transactions` |
| Webhooks (verify/parse + fallback lookup) | `integrations.api.bold.co` | `bold.webhooks` |
| OAuth client credentials | `api.bold.co` / `api.sandbox.bold.co` | `bold.oauth` |

Environment (sandbox vs production) is selected by **which key you use**, not the URL, for every surface except OAuth. Auth header is `Authorization: x-api-key <identityKey>`.

### Credentials (`src/config.ts`)

`BoldOptions` takes a primary `identityKey`/`secretKey` used as the default for every surface, plus optional per-surface overrides (`apiIntegrations`, `paymentButton`, `online`). `resolveCredential` falls back to the primary. `.env` / `.env.example` document the names (`BOLD_API_INTEGRATIONS_*`, `BOLD_PAYMENT_BUTTON_*`, `BOLD_ONLINE_*`).

### Layout

- `src/bold.ts` — the `Bold` client; resolves per-surface credentials + base URLs and constructs resources.
- `src/config.ts` — `BoldOptions`, `BASE_URLS`, credential resolution, `ResourceContext`.
- `src/http.ts` — `performRequest` shares the fetch/timeout/exponential-backoff-retry/error-mapping core for `requestJson`, `requestForm`, and `requestNoContent` (204 endpoints). Nothing throws.
- `src/errors.ts` — `ResultTuple` + a **discriminated** `BoldError` (`network | http | invalid_response | api_error | config | timeout | aborted`).
- `src/resources/*.ts` — one class per surface.
- `src/schemas/*.ts` — Zod schemas + inferred types per domain (`online`, `links`, `integrations`, `transaction`, `webhooks`, `oauth`). `common.ts` provides `envelopeOrBare` / `envelopeNormalize` because Bold responses are inconsistently wrapped in a `{ payload, errors }` envelope (the sandbox sometimes returns the payload bare).
- `src/webhooks.ts` — standalone HMAC-SHA256-over-Base64-body verify/generate/parse utilities (also on `bold.webhooks`).
- `src/adapters/*.ts` — thin per-framework webhook handlers over `adapters/core.ts:handleWebhookRequest`. Published as subpath exports `@pulgueta/bold/{next,hono,express,tanstack}`.

### Result tuple

Every async method returns `ResultTuple<BoldError, T>` = `[BoldError, null] | [null, T]`. Resources never throw.

## Tests

Vitest with two projects (`vitest.config.ts`): `unit` (mocked `fetch`, fully deterministic) and `integration` (live Bold sandbox; loads `.env`, self-skips a surface when its key is missing). `pnpm sandbox` is a runnable end-to-end proof.

## Release

semantic-release runs on push to `main`. The reliability guarantee is `prepack: pnpm build`: `@semantic-release/npm` runs `npm publish`, which always fires `prepack` and rebuilds `dist/` first — the built code can never be skipped, however small the change. CI additionally gates the release on `typecheck → test:unit → build → verify dist/ exists` before `pnpm exec semantic-release` (with npm provenance). Conventional commits drive the version; `feat!` / `BREAKING CHANGE:` → major.

## Skills

`skills/<name>/SKILL.md` files ship in the package (`files` includes `skills`) and are installed into a consumer's agent via the `skills-npm` CLI (a devDependency here).

## Style conventions

Biome: 2-space indentation, double quotes, no trailing commas, semicolons required, imports auto-organized. TypeScript strict mode with `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` (always `import type` for type-only imports). `tsc --noEmit` typechecks; tsup owns emit (note `ignoreDeprecations: "6.0"` is required for TS 6 + tsup's DTS build).
