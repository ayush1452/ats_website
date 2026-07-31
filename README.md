# ResumePilot

ResumePilot is a connected resume-analysis SaaS application for parseability, role alignment,
recruiter clarity, evidence quality, and versioned improvement. Scores are transparent product
heuristics: they do not guarantee compatibility with a third-party ATS, interviews, hiring, or
employment.

The repository ships in two honest operating modes:

- **Demo mode** requires no external services. It uses a deterministic Alex Morgan fixture,
  browser-local IndexedDB persistence, and clearly labels every result as “Demo analysis.”
- **Live mode** uses Supabase for authentication, private storage, PostgreSQL, and row-level
  security. Optional OpenAI and Stripe adapters activate only when their server-side credentials
  are configured.

## Quick start

Requirements:

- Node.js 24 (see `.nvmrc`)
- npm 11+
- Docker and the Supabase CLI only when running the live backend locally

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Select **Explore demo as Alex** on the login
page or choose **View sample report** on the homepage. Do not enter real credentials in an
unconfigured demo deployment.

The local seed identity is for development only:

```text
Email: alex.morgan@example.test
Password: ResumePilotDemo!2026
```

These credentials do not create a production account and must never be reused in production.

## Live Supabase setup

1. Create a Supabase project or start the local stack.
2. Copy the project URL and publishable/anon key into `.env.local`.
3. Keep the service-role key server-only.
4. Enable anonymous sign-ins when guest-to-account scan preservation is required. Leave them
   disabled if the deployment requires authentication before every scan.
5. Apply the migration and seed:

```bash
npx supabase start
npx supabase db reset
```

6. Configure email verification and the redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
```

The migration creates the relational model, private `resumes` and `reports` buckets, ownership
and team-aware RLS policies, quota functions, report-share lookup, indexes, checks, and timestamp
triggers. Validate policies with at least two distinct users before deploying.

## Optional Stripe billing

Create one recurring Stripe price for each paid plan and cadence, then map those price IDs to the
matching `STRIPE_PRICE_*` values in `.env.local`. Register this webhook endpoint:

```text
https://your-production-domain.example/api/billing/webhook
```

Subscribe it to `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, and `customer.subscription.deleted`, then set the resulting
signing secret as `STRIPE_WEBHOOK_SECRET`. Checkout and the billing portal stay visibly disabled
until the complete server-side configuration is present; demo mode never fabricates charges,
invoices, or successful checkout.

## Environment variables

All supported values are documented in `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL and secure redirect base |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only administration; never expose to the browser |
| `OPENAI_API_KEY` | Enables server-only semantic enrichment and rewrites |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5.6-sol` |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_*` | Enables live checkout and billing controls |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook events when the webhook is enabled |
| `TURNSTILE_SECRET_KEY` | Optional anonymous-scan abuse protection |
| `RATE_LIMIT_HASH_SALT` | Salt for one-way guest rate-limit identifiers |
| `AI_DATA_TRAINING_DISABLED` | Server-side verified provider-policy flag |
| `NEXT_PUBLIC_AI_DATA_TRAINING_DISABLED` | Allows the matching verified privacy statement in UI |

Only set the no-training flags after verifying the configured provider and organization data
controls. Otherwise the interface deliberately uses conservative processing language.

## Optional OpenAI adapter

ResumePilot performs extraction, scoring, keyword counts, date checks, readability, weak-phrase
detection, quantified-bullet detection, and supported layout checks deterministically. A
configured OpenAI adapter is limited to semantic requirement classification, related-evidence
interpretation, explanations, and optional rewrites.

The adapter:

- runs only in Node route handlers;
- uses the Responses API with schema-constrained output;
- sets `store: false`;
- validates the parsed result again with Zod;
- treats resume and job-description text as untrusted data;
- never applies a rewrite without confirmation;
- uses verification placeholders rather than inventing facts or metrics.

If the provider is unavailable or returns invalid output, the scan remains usable with
deterministic findings and a visible analysis-method label.

## Architecture

```text
src/
  app/
    (marketing)/       public product, content, pricing, legal and contact routes
    (auth)/            login, signup, verification and recovery
    app/               protected/demo workspace routes
    api/               validated scan, rewrite, export, sharing and privacy boundaries
  components/
    marketing/         product-led public compositions
    app/               shell, dashboard, onboarding and scan workflow
    report/            score, finding, chart and annotated-document workspace
  config/              product identity, plans, privacy wording and scoring weights
  data/                deterministic Alex Morgan fixture
  lib/
    analysis/          pure checks, scoring pipeline and Zod contracts
    extractors/        PDF, DOCX, TXT and pasted-text normalization
    providers/         optional OpenAI and Stripe adapters
    repositories/      IndexedDB demo and Supabase persistence adapters
    supabase/           browser/server clients and session refresh
supabase/
  migrations/          schema, RLS, storage and security functions
  seed.sql             local demonstration data
tests/
  unit/                scoring, parsing, validation and provider fallback tests
  e2e/                 critical journeys, responsive behavior and accessibility
```

The user-facing product name is read from `src/config/product.ts`. Plans and limits live in
`src/config/plans.ts`; scoring weights live in `src/config/scoring.ts`.

### Analysis flow

1. Validate extension, MIME, magic bytes, size, archive safety, and filename.
2. Normalize the document to stable pages, spans, sections, layout signals, and source offsets.
3. Run deterministic section, keyword, impact, readability, date, and format checks.
4. Optionally enrich semantic findings through the server-only provider.
5. validate the complete result with Zod, calculate scores from the stored weight snapshot, and
   persist an immutable scan.
6. Connect every supported finding to a stable resume annotation.

Without a job description, job-match metrics are marked unavailable and the remaining score
weights are proportionally normalized; missing context is never scored as zero.

## Scripts

```bash
npm run dev          # local development
npm run typecheck    # strict TypeScript
npm run lint         # ESLint with zero warnings
npm test             # deterministic unit tests
npm run test:e2e     # Playwright desktop and mobile journeys
npm run test:a11y    # focused axe checks
npm run build        # optimized production build
npm run check        # typecheck, lint, unit tests, build
```

Playwright may require a one-time browser install:

```bash
npx playwright install chromium
```

## Privacy and security

- Resume and report buckets are private; downloads use short-lived signed URLs.
- RLS is enabled for exposed tables, including nested findings and team-owned resources.
- Route handlers revalidate identity, ownership, origin, Zod input, quota, and rate limits.
- Opaque UUID paths are used for stored files; original names are retained only as sanitized
  metadata.
- Application logs must not include resume text, job descriptions, names, email addresses,
  prompts, signed URLs, or provider responses.
- Delete-account and delete-resume flows remove storage objects before hard-deleting records.
- Private report shares use a one-way token hash, default seven-day expiry, and revocation.

The included privacy and terms pages are configurable product templates, not legal advice. Have
qualified counsel review the operator identity, jurisdiction, subprocessors, retention periods,
and provider terms before launch.

## Deployment

The application is optimized for Vercel plus Supabase:

1. Deploy Supabase migrations and verify RLS/storage policies.
2. Configure production authentication URLs and SMTP.
3. Add environment values to the hosting platform; never commit `.env.local`.
4. Configure Stripe webhook verification if billing is enabled.
5. Set an explicit rate-limit salt and CAPTCHA for anonymous production scans.
6. Run `npm run check` and the Playwright suite against the deployment.
7. Verify the privacy statement against actual provider settings before setting the no-training
   flags.

Marketing routes are statically rendered where possible. Private reports are uncached, heavy
charts are isolated to client components, and shared reports are `noindex` and `no-store`.

## Deliberate v1 boundaries

- No OCR for image-only resumes.
- No claim of testing or emulating every third-party ATS.
- No verified hiring-outcome claims.
- No live AI, storage, email, OAuth, payment, or public sharing without matching configuration.
- No CMS; resources and fictional case studies are typed local content.

The three seeded case studies are explicitly fictional demonstrations.
