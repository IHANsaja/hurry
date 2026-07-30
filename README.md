# Hurry

An advertisements platform built for Guests browse and search listings, 
registered users post ads, and moderators approve or reject them through
a state-machine-driven queue that notifies the seller by email.

Built on Next.js 16 (App Router, Server Components, Server Actions), Prisma 7 against Neon
PostgreSQL, Auth.js v5 with Google SSO, and AWS SES for transactional email.

---

## Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 |
| UI | React, TailwindCSS, shadcn/ui | 19.2.8 / 4.1 / 4.15 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.9.0 |
| Database | Neon PostgreSQL | — |
| Auth | Auth.js (`next-auth@beta`) + `@auth/prisma-adapter` | 5.0.0-beta.32 |
| Validation | Zod | 4.4.3 |
| Email | Nodemailer + `@aws-sdk/client-sesv2` | 9.0.3 / 3.1095.0 |

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

```bash
npm run db:studio
```

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

## Known limitations

- **Image uploads write to `public/uploads/`.** 
- **Email is best-effort, not queued.** 
- **No automated test suite.** 
- **No edit/delete for advertisements.** 
- **`npm audit` reports advisories** in `postcss`, `sharp`, `brace-expansion` and `find-my-way`.
- **`pg` prints an SSL deprecation warning** about `sslmode=require` on startup. 
