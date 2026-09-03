# Afterimage

Afterimage is a private movie journal for the films—and the moments around them—that stay with you.

Search TMDB, record a simple **Didn't like / Liked / Loved** reaction, leave a note, and optionally remember the people, place, platform, mood, tags, and whether it was a rewatch. The stored timestamps and movie snapshots power searchable memories and rewinds without rewriting the past when provider metadata changes.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Clerk authentication (designed for Google social login)
- PostgreSQL 17 in Docker Compose
- Drizzle ORM and checked-in SQL migrations
- TMDB v3 for movie search, details, posters, credits, and IMDb IDs
- Vitest for provider normalization tests

## Start locally

Requirements: Node.js 20.9+, pnpm, and Docker.

```bash
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Before starting, copy `.env.example` to `.env.local` on a fresh checkout and fill in the Clerk and TMDB values. If Clerk's CLI already generated `.env.local`, keep those keys and add the missing `POSTGRES_URL` / `TMDB_API_TOKEN` values instead of overwriting the file.

The default database URL matches the Compose service:

```text
postgresql://afterimage:afterimage@localhost:5432/afterimage
```

`docker compose down` stops PostgreSQL and keeps the named volume intact. The development port binds to `127.0.0.1` only, so the simple local credentials are not exposed to your network.

On Vercel, Afterimage uses the variables installed by the Neon integration: `POSTGRES_URL` for application queries and `POSTGRES_URL_NON_POOLING` for Drizzle migrations. The older `DATABASE_URL` name remains supported as a fallback. The checked-in `vercel.json` applies pending migrations before each Vercel build, so a deployment fails safely instead of serving code against an outdated schema.

## Configure Clerk + Google

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com/).
2. Copy its publishable and secret keys into `.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. In **Configure → SSO connections**, enable Google. Clerk development instances can use shared OAuth credentials; configure your own Google OAuth credentials before production.
4. Disable any sign-in methods you do not want in the Clerk dashboard to make the app Google-only.

Authentication is wired through `ClerkProvider`, `src/proxy.ts`, and owner checks inside every API route. A browser session never supplies or controls the database user ID.

This generated workspace also has an ignored `.env.local` with a claimable accountless Clerk development app, so it opens without copying keys. Run `pnpm dlx clerk@latest auth login` when you want to claim it into your Clerk account, then rename the Clerk application to **Afterimage** and keep Google enabled.

## Configure TMDB

Create a TMDB API application from [TMDB account settings](https://www.themoviedb.org/settings/api), copy the **API Read Access Token**, and set:

```text
TMDB_API_TOKEN=your_read_access_token
```

The token stays server-side. Search uses TMDB's `/search/movie`; saving a memory refetches canonical movie details, credits, and external IDs before writing the database snapshot.

TMDB's developer API is for attributed, non-commercial use. Commercial products need a separate agreement. The required TMDB logo and notice are included in the site footer.

## Data captured

Each viewing is its own `journal_entries` row—even when the same film is watched again. It stores:

- reaction and note
- local watched date, IANA timezone, UTC offset, and automatic created/updated timestamps
- setting, location, venue, platform, companions, mood, tags, and rewatch status
- an immutable movie snapshot captured when the memory is logged

Movies are normalized separately with TMDB and IMDb IDs, release date, runtime, genres, directors, cast, countries, poster/backdrop paths, and provider fetch time. Journal search covers titles, notes, genres, people, places, moods, and tags, with trigram indexes on the most common text fields; dates, reactions, runtime, genres, and rewatch flags support rewinds.

## Commands

```bash
pnpm dev          # development server
pnpm db:migrate   # apply checked-in migrations
pnpm db:generate  # generate a migration after schema changes
pnpm db:studio    # inspect the database
pnpm test         # unit tests
pnpm typecheck    # TypeScript
pnpm lint         # ESLint
pnpm build        # production build
pnpm check        # all local quality checks
```

## API routes

- `GET /api/movies/search?q=...`
- `GET /api/movies/:tmdbId`
- `GET /api/entries?q=&reaction=&limit=&offset=`
- `POST /api/entries`
- `DELETE /api/entries/:id`
- `GET /api/stats`

All routes require a signed-in Clerk user.
