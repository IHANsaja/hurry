# Hurry

*Classified advertisements MVP*

A classified advertisements platform built for the Junior Fullstack Developer take-home. Guests
browse and search listings, registered users post ads, and moderators approve or reject them through
a state-machine-driven queue that notifies the seller by email.

Built on Next.js 16 (App Router, Server Components, Server Actions), Prisma 7 against Neon
PostgreSQL, Auth.js v5 with Google SSO, and AWS SES for transactional email.

---

## Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 |
| UI | React, TailwindCSS, shadcn/ui | 19.2.8 / 4.x / 4.15 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.9.0 |
| Database | Neon PostgreSQL | — |
| Auth | Auth.js (`next-auth@beta`) + `@auth/prisma-adapter` | 5.0.0-beta.32 |
| Validation | Zod | 4.4.3 |
| Email | Nodemailer + `@aws-sdk/client-sesv2` | 9.0.3 / 3.x |

Requires Node 20.19+, 22.12+, or 24+ (Prisma 7's floor).

---

## Setup

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — your Neon **pooled** connection string (the host contains `-pooler`).
- `AUTH_SECRET` — generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — see [Google OAuth](#google-oauth) below.
- `MODERATOR_EMAIL` — **set this to the Google address you will sign in with**, otherwise you
  cannot reach the moderation dashboard.
- AWS keys are optional while `EMAIL_DRY_RUN="true"`.

Create the tables and load demo data:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

The seed creates 4 top-level categories with 12 subcategories, 10 locations, 3 demo sellers and 20
advertisements — 15 `ACTIVE`, 4 `PENDING` and 1 `REJECTED` — so every screen has content on first
load.

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → new project.
2. **APIs & Services → OAuth consent screen** → External. Add your own address under **Test users**.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. Authorised JavaScript origin: `http://localhost:3000`
5. Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`

The redirect path is `/api/auth/callback/{providerId}` and must match exactly, or Google returns
`redirect_uri_mismatch`.

### AWS SES

Email runs in dry-run mode by default — messages are logged to the server console, so the full
moderation flow is reviewable with no AWS account at all.

To send for real:

1. **Amazon SES → Verified identities** → verify your sender address.
2. New accounts sit in the **SES sandbox**, so the *recipient* must be verified too. Verify the
   address you sign in with.
3. **IAM** → user with `ses:SendEmail` → create an access key.
4. Fill in `AWS_*` and `SES_FROM_EMAIL`, then set `EMAIL_DRY_RUN="false"`.

### Signing in as a moderator

Set `MODERATOR_EMAIL` to your Google address **before** running the seed. The seed upserts that user
with `role: MODERATOR`, and `allowDangerousEmailAccountLinking` binds your Google identity to the
existing record on first sign-in.

Already seeded and need to promote someone afterwards:

```bash
npm run db:studio
```

Open the `User` table and change `role` to `MODERATOR`.

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Hero search, category tree, recent listings |
| `/search` | public | Keyword + category + location + price filtering, paginated |
| `/ads/[id]` | public | Ad detail; contact details gated behind sign-in |
| `/signin` | public | Google SSO |
| `/post` | `USER` | Create an ad (lands as `PENDING`) |
| `/my-ads` | `USER` | Own listings in every state, with rejection notes |
| `/admin` | `MODERATOR` | Pending queue, approve/reject |

---

## Technical decisions

### `proxy.ts`, not `middleware.ts`

Next.js 16 renamed the `middleware` file convention to `proxy`, and the exported function from
`middleware` to `proxy`. The brief predates this. `src/proxy.ts` is the equivalent file.

### The proxy is UX; the real check is in the action

`proxy.ts` redirects unauthenticated visitors away from `/post` and rewrites non-moderators to
`/forbidden`. That is a good experience, but a proxy is **not** a security boundary — Server Actions
have their own endpoints and can be invoked without any page navigation, so the proxy never runs for
them.

Every privileged entry point therefore re-checks independently: `requireUser()` and
`requireModerator()` in `src/auth.ts` are called at the top of each Server Action, and each protected
page re-reads the session. The proxy is defence in depth, not the defence.

### JWT sessions over database sessions

With `strategy: "jwt"` the role travels in the session cookie, so the proxy's role check costs a
cookie read rather than a database round trip on every navigation. `src/auth.config.ts` copies
`role` and `status` into the token during the sign-in pass.

### Auth config split in two files

`src/auth.config.ts` holds providers and callbacks and imports no database code.
`src/auth.ts` adds `PrismaAdapter` on top. `src/proxy.ts` imports only the former, which keeps the
Postgres driver out of the request path that runs on nearly every request.

### `relationLoadStrategy: "join"`

The public search spans five tables — `Advertisement`, `User`, `Category`, `Location`, `AdImage`.
Prisma's default `"query"` strategy issues one statement per relation and stitches the rows together
in JavaScript. `"join"` compiles the whole thing into a single PostgreSQL statement using `LATERAL`
joins and JSON aggregation.

Measured against the Neon instance in `ap-southeast-1`:

```
Same query, five tables, 12 rows

┌──────────────────────┬───────────────┬────────────────┬──────────────┐
│ relationLoadStrategy │ rows returned │ SQL statements │ elapsed (ms) │
├──────────────────────┼───────────────┼────────────────┼──────────────┤
│ 'join'               │ 12            │ 1              │ 163.6        │
│ 'query'              │ 12            │ 5              │ 679.8        │
└──────────────────────┴───────────────┴────────────────┴──────────────┘
```

Reproduce it:

```bash
npm run compare:strategies
```

The gap is dominated by network round trips — five sequential trips to Singapore versus one. Numbers
will differ by location and connection warmth, but the statement count is deterministic.

`relationJoins` is still a Prisma preview feature in v7 and is enabled in `schema.prisma`. One
caveat worth knowing: the strategy silently falls back to `"query"` if the query uses `cursor`
pagination, so this project paginates with `skip`/`take`.

### Moderation is a real state machine

Legal transitions are `PENDING → ACTIVE` and `PENDING → REJECTED`. Nothing else.

That rule is enforced in the write itself, not by hiding buttons:

```ts
prisma.advertisement.update({
  where: { id, status: "PENDING" },
  data: { status: "ACTIVE" },
});
```

If two moderators act on the same ad simultaneously, the second update matches no row, Prisma throws
`P2025`, and the UI reports that the ad was already moderated. Verified by forcing the double-write
directly against the database.

Rejection reasons are mandatory at the schema level via a Zod `.refine()`, so a crafted request
cannot bypass the note either.

### Contact details are never sent to guests

The seller's phone and email are not rendered-then-hidden; they are excluded from the SQL:

```ts
select: { contactPhone: includeContact, user: { select: { email: includeContact } } }
```

With `includeContact: false` the columns are never selected, so nothing leaks through the RSC payload
or page source.

### Email never blocks moderation

The SES send is wrapped in `try/catch` and runs *after* the database write commits. If SES is
unavailable, the moderation decision still stands and the failure is logged. Emailing "your ad is
live" and then failing to persist that fact would be the worse outcome.

### Schema notes

- `Category` is self-referential (`parentId` → `CategoryTree`), so one table models both tiers and
  the depth is not capped at two.
- `price` is `Decimal(12,2)`, never `Float` — binary floats cannot represent all decimal values
  exactly, which is unacceptable for currency.
- Indexes on `Advertisement` mirror the search query: `[status, createdAt]` for the feed's filter and
  sort, plus `categoryId`, `locationId`, `price` and `userId`.
- Searching a parent category resolves to the parent plus its children before the `IN` filter, so
  "Vehicles" returns ads filed under "Cars". Two tiers means one lookup suffices; a recursive CTE
  would be unnecessary complexity here.

### Prisma 7 specifics

v7 removed the Rust query engine, which changes setup materially:

- A driver adapter is mandatory — `PrismaPg` wraps `pg` and connects to Neon's pooled endpoint.
- The generator is `prisma-client` (not `prisma-client-js`), `output` is required, and the client is
  emitted to `src/generated/prisma` instead of `node_modules`. Imports come from there.
- Connection config moved to `prisma.config.ts`, which must `import "dotenv/config"` because v7 no
  longer loads `.env` automatically.
- `src/lib/prisma.ts` caches the client on `globalThis` in development so hot reloads do not exhaust
  Neon's connection limit.

### `next-auth@beta`

`npm install next-auth` resolves to 4.24.15, the Pages Router line. Auth.js v5 — the App Router
version, with the unified `auth()` helper — is published under the `beta` tag and is what current
App Router projects use. Pinned deliberately.

---

## Verification

```bash
npm run typecheck && npm run lint && npm run build
```

All three pass clean. Filter behaviour was checked against the seeded data:

| Query | Results |
|---|---|
| no filters | 15 across 2 pages |
| `?category=vehicles` | 5 (cars 3 + motorbikes 1 + three-wheelers 1) |
| `?category=cars` | 3 |
| `?q=toyota` | 1 |
| `?minPrice=100000&maxPrice=400000` | 5 |
| `?category=cars&location=colombo` | 1 |
| `?page=banana` | falls back to page 1 |

---

## Known limitations

- **Image uploads write to `public/uploads/`.** Fine for this MVP and explicitly permitted by the
  brief, but local disk does not survive a serverless deploy. Production would use S3 presigned
  URLs, which also keeps the upload off the application server entirely.
- **Email is best-effort, not queued.** A failed SES call is logged and dropped. A real system would
  enqueue the job (SQS, or Next's `after()`) so it can be retried.
- **No automated test suite.** Priority went to a complete working flow within the time available.
  The two highest-value targets would be the Zod schemas and the state transition rules; the state
  machine and the load-strategy comparison were verified manually instead
  (`npm run compare:strategies` is committed and reproducible).
- **No edit/delete for advertisements.** Sellers can repost after a rejection but cannot amend in
  place.
- **`npm audit` reports advisories** in `postcss`, `sharp`, `brace-expansion` and `find-my-way`.
  All are transitive, arriving through Next's, ESLint's and Prisma's own dependency trees, with no
  fix available that does not break the build. `nodemailer` is the one that mattered — `@auth/core`
  pins `^8`, which carries an open advisory, so an npm `override` forces the patched 9.x line for
  every consumer.
- **`pg` prints an SSL deprecation warning** about `sslmode=require` on startup. Neon's standard
  connection string triggers it; the current behaviour is the stricter `verify-full`, so it is
  informational.
