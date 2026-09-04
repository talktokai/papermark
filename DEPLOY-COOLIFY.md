# Deploying Papermark on Coolify

Papermark is built for Vercel. It runs on Coolify, but several features depend
on hosted services that have no in-repo fallback. Read
[What breaks](#what-breaks-off-vercel) before committing to this path.

## Build pack

Pick **Dockerfile**, not Nixpacks.

Nixpacks gives no control over the build order this app needs (Prisma client
generation before `next build`, standalone output, migrations applied
separately from the build). Static is impossible — the app is SSR with API
routes and middleware. Docker Compose is only worth it if you want Postgres and
Redis in the same stack; running them as separate Coolify resources is cleaner
because Coolify then manages their backups.

## Required infrastructure

| Component | How to provide it |
| --- | --- |
| PostgreSQL | Coolify resource. Papermark reads `POSTGRES_PRISMA_URL` (pooled) and `POSTGRES_PRISMA_URL_NON_POOLING` (direct). With a plain Postgres container, point both at the same URL. |
| Redis | `@upstash/redis` speaks the Upstash **REST** protocol, not the Redis wire protocol. A stock Redis container will not work — use Upstash, or run [serverless-redis-http](https://github.com/hiett/serverless-redis-http) in front of your own Redis. |
| Object storage | Set `NEXT_PUBLIC_UPLOAD_TRANSPORT=s3` and point the `NEXT_PRIVATE_UPLOAD_*` variables at S3, MinIO, R2, or any S3-compatible provider. This path is fully supported in-repo. |
| Trigger.dev | Required for document processing — see below. Cloud, or self-hosted. |
| QStash (Upstash) | Required for webhook delivery and cron endpoints. |
| Tinybird | Required for all view/click analytics. |
| Resend | Transactional email. |

## Coolify configuration

**Build pack:** Dockerfile
**Port:** 3000

### Health check

In Coolify's **Health check** configuration:
- **Healthcheck Path:** `/api/health`
- **Healthcheck Port:** `3000`
- **Healthcheck Method:** `GET`
- **Start period:** `20` (seconds, allows Next.js to start up and connect to Postgres)
- **Interval:** `10`
- **Timeout:** `5`
- **Retries:** `3`

### Build-time variables

`NEXT_PUBLIC_*` values are inlined into the client bundle during `next build`,
so they must be marked as **build variables** in Coolify, not just runtime ones.
The `*_BASE_HOST` variables additionally feed `has: [{ type: "host" }]` header
rules in `next.config.mjs`; Next.js **fails the build** if any of them is
undefined, so all three must be set.

**Do not point them at your app's host.** `middleware.ts` compares the request
host against `NEXT_PUBLIC_API_BASE_HOST` and, on a match, serves only the
`/v1` API surface and 404s every page — so setting it to your app domain makes
the dashboard and login pages disappear. Give them distinct hostnames even if
only the app host actually resolves; the API, MCP and webhook hosts are opt-in
surfaces you can leave unrouted.

These are the only build-time values. No API keys or secrets are needed to
build the image — see [Clients built at import time](#clients-built-at-import-time).

```
NEXT_PUBLIC_BASE_URL=https://papermark.example.com
NEXT_PUBLIC_MARKETING_URL=https://papermark.example.com
NEXT_PUBLIC_APP_BASE_HOST=papermark.example.com
# Distinct from the app host — see the warning above.
NEXT_PUBLIC_API_BASE_HOST=api.papermark.example.com
NEXT_PUBLIC_MCP_BASE_HOST=mcp.papermark.example.com
NEXT_PUBLIC_WEBHOOK_BASE_HOST=hooks.papermark.example.com
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://papermark.example.com
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=your-bucket.s3.us-east-1.amazonaws.com
```

### Runtime variables

```
# Auth
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://papermark.example.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database
POSTGRES_PRISMA_URL=postgresql://user:pass@host:5432/papermark
POSTGRES_PRISMA_URL_NON_POOLING=postgresql://user:pass@host:5432/papermark

# Secrets — generate each with `openssl rand -base64 32`
NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY=
NEXT_PRIVATE_VERIFICATION_SECRET=
NEXT_PRIVATE_UNSUBSCRIBE_JWT_SECRET=
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=
INTERNAL_API_KEY=

# Storage (S3-compatible)
NEXT_PRIVATE_UPLOAD_BUCKET=
NEXT_PRIVATE_UPLOAD_REGION=us-east-1
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=
NEXT_PRIVATE_UPLOAD_ENDPOINT=      # set for MinIO / R2 / other non-AWS

# Redis (Upstash REST protocol)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_REST_LOCKER_URL=
UPSTASH_REDIS_REST_LOCKER_TOKEN=

# Background jobs
TRIGGER_SECRET_KEY=
TRIGGER_API_URL=https://api.trigger.dev

# Queues, webhooks, cron
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Analytics
TINYBIRD_TOKEN=

# Email
RESEND_API_KEY=

# Slack (optional)
SLACK_APP_INSTALL_URL=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_INTEGRATION_ID=
```

### Migrations

Do not run migrations during the image build — the database is not reachable
there. Set Coolify's **pre-deployment command** to:

```
/app/migrate.sh
```

That script runs `prisma migrate deploy` against `prisma/schema`. The Prisma
CLI is installed into `/opt/prisma-cli` in the runtime image (it needs runtime
dependencies of its own, so copying just the `prisma` packages out of the
build stage is not enough) and is kept out of the app's own `node_modules` so
it cannot shadow the standalone server's bundled copies.

### Memory and Hetzner VPS sizing

`/api/mupdf/convert-page` renders PDF pages in-process. Vercel allocates 2 GB
for that route, and the Dockerfile sets `NODE_OPTIONS=--max-old-space-size=2048`
to match. Give the container at least 3 GB, or large PDFs will OOM.

#### Preventing VPS lockups on Hetzner / Coolify builds
Hetzner Cloud VPS instances ship with **0 MB SWAP** by default. Compiling
Next.js inside Docker spikes RAM and CPU, which without swap causes Linux kernel
deadlocks (the server completely freezes and drops SSH).

To prevent this:
1. **Configure SWAP on the server**: Run `sudo bash scripts/setup-hetzner-swap.sh 4`
   (or create a 4-8 GB swapfile).
2. **Built-in Docker optimizations**: The `Dockerfile` caps Node heap (`NODE_OPTIONS=--max-old-space-size=2048`),
   restricts workers (`NEXT_CPU_COUNT=1`), and `next.config.mjs` ignores ESLint during build.
3. **Alternative - Pre-built image**: Use the GitHub Actions workflow (`.github/workflows/docker-publish.yml`)
   to build on GitHub runners and deploy via Docker Image (`ghcr.io/...`) in Coolify, bypassing server-side compilation entirely.


## What breaks off Vercel

These are not deployment bugs — the code has no non-Vercel path for them.

**Custom domains are disabled cleanly.** Custom domain provisioning in `lib/domains.ts`
relies on Vercel's Domains API (`api.vercel.com`) and dynamic TLS certificate issuance.
When self-hosting off Vercel, client custom domains are cleanly disabled by
default: the UI hides the domains settings tab, navigation items, and link-creation
selectors. `middleware.ts` correctly handles your deployment domain (`NEXT_PUBLIC_APP_BASE_HOST`),
and all links are served directly from your host
(`https://<NEXT_PUBLIC_APP_BASE_HOST>/view/<linkId>`). Vercel API calls safely no-op.

**Document processing requires Trigger.dev.** `lib/api/documents/process-document.ts`
dispatches every upload to a Trigger.dev task. Without a `TRIGGER_SECRET_KEY`,
uploads are stored but never converted to viewable pages. The good news: the
actual PDF rendering happens in this app's own `/api/mupdf/*` routes, so
Trigger.dev only orchestrates — no Lambda needed. You must run
`npm run trigger:v4:deploy` to register the tasks.

**Analytics require Tinybird.** Every view, click, and video event is published
to Tinybird, and all the stats endpoints read from it. Without it, documents
still work but every analytics view is empty.

**Webhooks and cron require QStash.** Outbound webhooks are dispatched through
QStash, and the `/api/cron/*` routes verify QStash signatures. Coolify's own
scheduled tasks cannot call them directly without patching out the signature
check.

**Rate limiting requires Upstash Redis.** Requests fail closed on rate-limited
routes if `UPSTASH_REDIS_REST_URL` is unset.

## Missing Enterprise modules

The public Papermark repository imports 45 modules under `ee/` that it does
not publish — the Enterprise source lives in a private repo. A plain
`next build` fails with `Module not found`, on Vercel and locally alike; this
is upstream issue
[#2179](https://github.com/papermark/papermark/issues/2179), open since
June 2026. Verified against `papermark/papermark` itself, its most active
forks, and a global GitHub code search: only the imports exist publicly, never
the implementations.

This repo carries replacements for all 45 under `ee/`. Each file documents
what it stands in for. They fall into two groups.

**Reconstructed from existing evidence** — behaviour derived from the Prisma
schema and the call sites, not guessed:

- `branding/lib/resolve-base-brand` — brand precedence (link → dataroom →
  team default), ownership checks, Prisma select shapes
- `branding/lib/resolve-dataroom-displayed-brand`, `resolve-public-link-meta`,
  `prepare-brand-write`, `delete-team-brand`, `upsert-dataroom-brand`
- `branding/lib/dataroom-viewer-layout` — layout presets, mirroring the
  preset switch in `pages/branding.tsx`
- `branding/lib/brand-logo`, `dataroom-banner`, `use-logo-tone`
- `request-lists/lib/assignments` — assignment matching, per the
  `TaskAssignment` model
- `branding/components/team-brand-switcher`,
  `collapsible-branding-section` — implemented rather than blanked, because
  stubbing them would strand working settings behind them

**Feature gates and UI left inert** — these disable a feature rather than
approximate it:

| Feature | What you lose |
| --- | --- |
| Branding editor UI | Banner editor, link-preview form, live preview pane, layout preset cards, language picker. Saved values still render in the viewer. |
| Request lists (tasks) | The whole feature, hidden behind its gate. |
| Redaction | Launcher, workspace, dialogs. |
| Confidential view | The link-settings row and the viewer overlay. |
| Dataroom analytics | The dataroom-level page. Per-document analytics are unaffected. |
| Partner program | Referrals page and sidebar entry. |
| Office/Keynote conversion | `.docx`/`.pptx`/`.key` files upload and download but are not converted for viewing. PDFs, images and video are unaffected. |
| Dataroom trial emails | Trials work; the scheduled lifecycle emails are not sent. |
| Q&A / conversation mentions | Team questions API returns 501; mention notifications no-op. |

Two gates deserve a note, since both sit on security-adjacent paths and both
were deliberately written to fail closed:

- `ee/limits/can-create-*-team` returns false, so new teams are created on the
  default plan instead of auto-upgrading. There is no Stripe subscription to
  read when self-hosting.
- `request-lists/lib/assignments` denies an upload when no assignment matches.
  With request lists disabled there are no UPLOAD tasks, so viewer uploads
  through that path are refused rather than allowed.

Document permissions themselves are untouched: they live in
`ee/features/permissions/lib/`, which upstream does publish.

### Beyond `ee/`

The same gap reaches outside the Enterprise tree. Five modules under `lib/`
are imported but unpublished, and two imports point at paths that do not
exist:

- `lib/dataroom/apply-default-permissions` — seeds access-control rows for
  newly attached dataroom documents. Reconstructed from the
  `DefaultPermissionStrategy` / `RootItemAccess` enums, whose schema comments
  define each strategy. Only `INHERIT_FROM_PARENT` grants anything;
  `ASK_EVERY_TIME` and `HIDDEN_BY_DEFAULT` deliberately write no rows, since
  an absent row means no access.
- `lib/api/auth/restricted-tokens` — API-key subject types and revocation of
  a departing teammate's user-bound keys, per the `RestrictedToken.subjectType`
  schema comment. Machine keys survive; user keys do not.
- `lib/oauth/scopes` — the token scope allowlist, derived from the preset
  names the token handler normalises to and the `<resource>.<action>` pairs
  the UI offers.
- `lib/api/errors` — `PapermarkApiError` and the `ErrorCode` union.
- Eight email templates under `ee/` imported `@react-email/components`, which
  is not a dependency of this project; they now import `react-email`, the
  package that is installed and that every working template already uses.
- `ee/stripe/webhooks/checkout-session-completed.ts` imported
  `@/lib/trigger/send-scheduled-email`; the task it wants lives in
  `@/lib/trigger/send-upgrade-checkin-email`, which does exist. Import fixed
  rather than duplicated.

### Clients built at import time

Several modules constructed their SDK client (or validated credentials) at
module scope. Next evaluates route modules while collecting page data during
`next build`, and these SDKs throw on a missing **or empty** key — so the build
failed for any deployment without those credentials, even though a self-hosted
Papermark never uses the features behind them.

All of them now construct on first use, so **no secrets are needed to build**:

- `ee/features/ai/lib/models/openai.ts` and `lib/openai.ts` (OpenAI)
- `ee/stripe/index.ts` — both clients, moved inside `stripeInstance()`
- `lib/hanko.ts` — threw outright unless both Hanko variables were set, and is
  pulled in by `lib/auth/auth-options.ts`, which nearly every authenticated
  route imports. This one could not be deferred: `PasskeyProvider` reads
  `tenant.config` synchronously as that module loads. Since `tenant()` needs
  only a tenant id (the API key is used per request), the tenant is now always
  constructed, falling back to an unroutable placeholder id when the variables
  are unset — passkey sign-in is then unavailable, while email and OAuth
  sign-in are unaffected
- `lib/integrations/slack/events.ts` — its module-scope `slackEventManager`
  built a `SlackClient` in its constructor; it now uses the `getSlackClient()`
  lazy getter that `client.ts` already provided

Each still raises the same error at the point the feature is actually used, so
a missing key is reported where it matters rather than at build time.

**Stripe in particular is not required.** Self-hosted Papermark takes no
payments; the client only exists so billing routes compile. Leave the Stripe
variables unset and everything except those routes works normally. The same
goes for OpenAI (AI chat), Hanko (passkeys) and Slack (notifications).

### Type errors in the published source

The public source does not type-check as shipped, independently of the missing
modules. `tsc --noEmit` now reports zero errors; getting there needed the
following, none of which change runtime behaviour unless noted.

**Half-landed multi-currency pricing.** Billing components read
`price[period].amountUsd`, pass `currency` to `getPlanFeatures()`, and read
`feature.aliasIds` — none of which were declared. `PLANS` now carries an
explicit `PlanDefinition` type with an optional `amountUsd`, and
`FeatureOptions` / `Feature` gained optional `currency` and `aliasIds`. No
plan data changed: feature copy carries no prices and `amountUsd` stays unset,
so prices still render from the EUR amount exactly as before.

**Stripe SDK v22 breaking changes.** `package.json` pins `stripe@^22`, but the
code still reads the pre-v22 shapes:

- `subscription.current_period_start/end` moved onto the subscription item.
  Papermark bills one item per subscription, so the four call sites now read
  `subscription.items.data[0]`.
- `subscription.discount` became a `discounts` array whose entries are ids
  unless expanded, and the coupon moved behind `discount.source.coupon`. The
  expand string and the lookup were updated to match.
- `InvoiceLineItem.price` became `pricing.price_details.price`, a price id
  unless expanded. The yearly-renewal check reads it when expanded and
  otherwise falls back to the line's own period span, so a 12-month line still
  counts as yearly.
- `apiVersion: "2024-06-20"` no longer matches the SDK's generated types. It
  is **cast, not bumped** — changing the API version changes Stripe's runtime
  behaviour, and that is a decision for whoever owns the billing account.

**Missing declarations and exports.** Two rate limiters that
`rateLimiters.bulkLinkImport` and `rateLimiters.domainVerification` reference
were never defined (added, with limits below the interactive ones);
`MAX_MESSAGE_LENGTH` is imported from `@/lib/utils/sanitize-html` but was only
imported there, not re-exported; `DataroomIndexSource` is imported from
`lib/dataroom/index-generator` but never declared (now the exact subset the
generator reads); `sendConversationMentionNotificationTask` is re-exported by
`lib/trigger/conversation-message-notification` but the Enterprise module
defines only the message and team-member tasks; `ConversationSidebarProps` and
the conversations overview page lacked props their call sites pass; and
`*.svg` static imports had no ambient declaration (added in
`types/assets.d.ts`).

**Two real bugs, not just types.** Both `generate-index` routes build their
`DataroomIndexSource` without `teamId` even though their Prisma query selects
it — the index generator needs it. Fixed by passing the value through.

## What was verified

The image in this repo was built and run end to end:

- `tsc --noEmit` — 0 errors across the project
- `docker build` with **no API keys or secrets** — image builds (≈900 MB)
- `/app/migrate.sh` against a live Postgres — all migrations applied
- container start — server ready in ~330 ms, no runtime errors
- `/login` returns 200 and renders, `/` and `/dashboard` redirect as expected,
  and `/api/auth/providers` answers from the database

Not verified, because they need real third-party accounts: document upload and
conversion (S3 + Trigger.dev), analytics (Tinybird), email (Resend), webhooks
and cron (QStash).

## Verifying locally

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_MARKETING_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_APP_BASE_HOST=localhost \
  --build-arg NEXT_PUBLIC_API_BASE_HOST=api.papermark.local \
  --build-arg NEXT_PUBLIC_MCP_BASE_HOST=mcp.papermark.local \
  --build-arg NEXT_PUBLIC_WEBHOOK_BASE_HOST=hooks.papermark.local \
  --build-arg NEXT_PUBLIC_UPLOAD_TRANSPORT=s3 \
  --build-arg NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=your-bucket.s3.us-east-1.amazonaws.com \
  -t papermark .
```

Then apply migrations and start it against a database:

```bash
docker run --rm \
  -e POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/papermark" \
  -e POSTGRES_PRISMA_URL_NON_POOLING="postgresql://user:pass@host:5432/papermark" \
  papermark /app/migrate.sh

docker run -d -p 3000:3000 \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  -e POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/papermark" \
  -e POSTGRES_PRISMA_URL_NON_POOLING="postgresql://user:pass@host:5432/papermark" \
  papermark
```
