# Supertrainer

A trainer–client workout app pilot. Trainers invite clients, build plans, and both log and track workouts. See [PLAN.md](PLAN.md) for the spec and [DECISIONS.md](DECISIONS.md) for decisions made along the way.

Stack: React + TypeScript + Vite, Tailwind + shadcn/ui, TanStack Query, Supabase (Postgres, Auth, RLS), hosted on GitHub Pages.

## Prerequisites

- **Node.js 22.12+** (`node -v`).
- **Docker** (Docker Desktop or OrbStack), needed from M1 onwards to run Supabase locally. Install it from <https://www.docker.com/products/docker-desktop/> and start it once. If `docker` isn't found in your terminal, add `export PATH="$HOME/.docker/bin:$PATH"` to `~/.zshrc`.
- The **Supabase CLI** is a dev dependency, so there's nothing to install globally: use `npx supabase …` or the `npm run db:*` scripts.

## Local development

```sh
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:5173/supertrainer/
```

For a local database (needs Docker):

```sh
npm run db:start   # starts local Supabase and prints its URL and anon key -> put them in .env.local
npx supabase status # shows the URL and keys again later
npm run db:reset   # re-applies supabase/migrations and supabase/seed.sql
npm run db:test    # runs the RLS tests in supabase/tests
npm run db:types   # regenerates src/lib/database.types.ts
```

Signing in locally: Google isn't configured for local Supabase, so use the email link. Emails are caught by Mailpit at <http://127.0.0.1:54324>; open the link from there in the same browser.

Checks (the same ones CI runs):

```sh
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## Hosted setup (by hand, once)

### 1. Supabase project

1. Create a project at <https://supabase.com/dashboard> in the **London (eu-west-2)** region, or the nearest EU region if it isn't offered.
2. **Google login**
   1. In Google Cloud Console → APIs & Services → Credentials, create an **OAuth client ID** (type: Web application).
   2. Add the Supabase callback URL as an authorised redirect URI. It's shown in Supabase → Authentication → Providers → Google, and looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
   3. Paste the client ID and secret into Supabase → Authentication → Providers → Google, and enable it.
3. Authentication → URL Configuration:
   - Site URL: `https://misrarah.github.io/supertrainer/`
   - Redirect URLs: `https://misrarah.github.io/supertrainer/**` and `http://localhost:5173/supertrainer/**`
4. Authentication → Providers → Email: enable it for magic links. **Before inviting pilot users**, set up custom SMTP (Authentication → Emails → SMTP settings, for example with Resend's free tier). The built-in sender only allows a few emails an hour.
5. Apply the schema and seed data:
   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --include-seed
   ```

### 2. GitHub Pages

1. Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Repo → Settings → Secrets and variables → Actions → add two repository secrets from Supabase → Project Settings → API:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the anon/publishable key; it is designed to be public, RLS protects the data)
3. Every push to `main` runs `.github/workflows/deploy.yml`: install, type-check, lint, test, build, deploy. The site is served at `https://misrarah.github.io/supertrainer/`.
4. The repo must stay public for free GitHub Pages.

### 3. Keep-alive

Supabase pauses free projects after 7 days without activity. `.github/workflows/keepalive.yml` makes one small REST request every three days using the same two secrets. It skips itself until the secrets exist.
