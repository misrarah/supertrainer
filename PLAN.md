# Trainer–Client Workout App — Pilot Build Plan

> **For Claude Code:** This is the spec for the pilot. Build it milestone by milestone (section 10), in order. After each milestone: run the build and tests, commit, and stop for review. If something in this plan is ambiguous, follow "Conventions" (section 11) and record the decision in `DECISIONS.md`. Don't add features that aren't listed here.

---

## 1. Goal

Ship a working pilot quickly so real personal trainers (PTs) and their clients can use it and give feedback.

The core loop:

1. A trainer signs in and invites a client.
2. The client signs in and answers a short intake questionnaire.
3. The trainer builds a workout plan for that client from an exercise library (plus their own custom exercises) and assigns workouts to days.
4. The client (or the trainer, during an in-person session) logs each set: reps, weight and equipment used.
5. Both can see history and progress.

**Out of scope for the pilot:** payments, chat, nutrition, push notifications, native mobile apps, Facebook and Apple login, AI features, and teams of trainers.

---

## 2. Tech stack and constraints

| Area                         | Choice                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                     | React (latest version compatible with the rest of the stack) + TypeScript + Vite. Don't pin to an older major.                                                                                                                                                                                    |
| Routing                      | React Router with `HashRouter`, because GitHub Pages has no server-side routing                                                                                                                                                                                                                   |
| Data fetching                | TanStack Query on top of `@supabase/supabase-js`                                                                                                                                                                                                                                                  |
| Forms and validation         | React Hook Form + Zod                                                                                                                                                                                                                                                                             |
| UI                           | Tailwind CSS + shadcn/ui, designed for phones first                                                                                                                                                                                                                                               |
| Drag and drop (plan builder) | dnd-kit                                                                                                                                                                                                                                                                                           |
| Charts                       | Recharts                                                                                                                                                                                                                                                                                          |
| Installable app              | `vite-plugin-pwa` (lets users add it to their phone's home screen; caches the app shell)                                                                                                                                                                                                          |
| Backend                      | Supabase (Postgres, Auth, row-level security). No custom server.                                                                                                                                                                                                                                  |
| Auth flow                    | Supabase client created with `auth: { flowType: 'pkce' }`. PKCE returns `?code=` in the query string rather than tokens in the `#fragment`, so it doesn't clash with `HashRouter`. Every `redirectTo` is `window.location.origin + import.meta.env.BASE_URL` (includes the `/<repo>/` base path). |
| Database migrations          | Supabase CLI (installed as a dev dependency, run with `npx supabase`; local database needs Docker). Every schema change is a SQL file in `supabase/migrations/`. Never edit the schema in the dashboard.                                                                                          |
| Generated types              | `supabase gen types typescript` → `src/lib/database.types.ts`                                                                                                                                                                                                                                     |
| Tests                        | Vitest for unit tests, Playwright for one end-to-end test of the main flow, and pgTAP or SQL tests for the row-level security policies                                                                                                                                                            |
| Hosting                      | GitHub Pages, deployed by GitHub Actions                                                                                                                                                                                                                                                          |
| Cost                         | £0 (Supabase free plan + GitHub Pages)                                                                                                                                                                                                                                                            |

**Constraints**

- The browser talks to Supabase directly, so **row-level security (RLS) is the only security layer**. Every table has RLS enabled and explicit policies, and those policies have tests.
- **All Supabase calls go through `src/data/*` modules.** React components never import the Supabase client. This keeps a later move to a .NET API contained.
- Business rules (for example, pre-filling targets or how progress is calculated) go in `src/domain/*`, as pure TypeScript functions with unit tests. They never go in components.
- Default unit is kg, with a lb option in user settings. Store weights in kg and convert only for display.
- **Time:** store every timestamp as `timestamptz` (UTC). Show times and dates to users in the device's local time zone. "Today" (for today's workout, weekday pinning, `measured_on` defaults) is the device's local calendar date. Plain `date` columns (`start_date`, `measured_on`) hold the user's local calendar date.

---

## 3. Roles and permissions

There are two roles, held in `profiles.role`:

- **trainer**: creates exercises, builds plans, invites and manages clients, logs on behalf of clients, and views client data.
- **user**: a client. They can be linked to one trainer or have no trainer.
  - A user **without** a trainer is an "individual". They can build their own plans with the same plan builder and log workouts.
  - A user **with** a trainer sees the plans their trainer assigned. They can still log workouts that aren't in a plan.

Rules:

- The role is chosen once during onboarding and can't be changed in the app. (For the pilot, changes are made by hand in the database.)
- A user can have only **one active trainer** at a time. A trainer can have many clients.
- A trainer can only see users linked to them through an active `trainer_clients` row.

---

## 4. User journeys

**A. Sign up (all users)**

1. Single login page → "Continue with Google" (an email magic link is the fallback).
2. First sign-in → onboarding page: "I'm a trainer" / "I'm working out" → choose a display name and units.
3. Go to the trainer dashboard or the user home page.

**B. Trainer invites a client**

1. Trainer → Clients → "Invite client" → the app generates a code and a link `/#/join/ABC123` to copy or share (WhatsApp, email, and so on).
2. The client opens the link → the page shows the trainer's name and avatar ("Join Sam's clients"), read through the `peek_invite(code)` RPC → signs in → if they're new, onboarding sets them as a user automatically → their account is linked to the trainer.
3. The client is asked to complete the intake questionnaire.

**C. Intake questionnaire**

1. The client answers the questions (the default set in section 6.4, plus any custom questions the trainer has added).
2. The trainer sees the answers on the client's profile page.
3. In the exercise picker, the answers act as **suggestions**:
   - The equipment filter is pre-set to the client's available equipment.
   - The difficulty filter is pre-set to their experience level.
   - Exercises tagged as a caution for the client's stated limitations show a warning badge.

   The trainer can override all of these.

**D. Trainer builds a plan**

1. Client page → "New plan", or copy one of the trainer's template plans.
2. Add workouts, for example "Day A – Upper" or "Day B – Lower", and optionally pin each to days of the week.
3. Within each workout, add exercises from the library, or create a custom exercise on the spot. For each exercise, set the sets and targets (reps or a rep range, weight, time or distance, rest), plus notes and the equipment to use.
4. Reorder by dragging. Save. Assign the plan to the client with a start date. Only one plan per client is active at a time.

**E. Client logs a workout**

1. The home page shows "Today's workout". This is the workout pinned to today if there is one; otherwise the next one in the sequence. The client can also pick any workout from the plan, or start an empty one.
2. Tap "Start" → a session opens with every planned set pre-filled with its target, alongside **what they did last time** for that exercise.
3. For each set, tap ✓ to accept the pre-filled values, or adjust reps, weight or equipment first. Sets, exercises and swaps can be added or removed.
4. There's an optional rest timer after each set.
5. "Finish" → summary (total volume, any personal bests) → saved.
6. If the connection drops mid-workout, nothing is lost (see section 8.3).

**F. Trainer logs an in-person session**

The same screen as E, opened from the client's page with "Log session for client". The session records `logged_by = trainer`.

**G. Progress**

- **Client:** history list of past sessions, and a chart per exercise (best weight per session, estimated one-rep max, total volume). There's an optional bodyweight log.
- **Trainer:** a dashboard listing clients with their last workout date and sessions in the last 7 days, and an "inactive 7+ days" flag. Clicking a client shows the same history and charts.

**B2. Trainer directory**

Any signed-in user can browse the list of registered trainers (`/trainers`): display name and avatar. Joining a trainer still needs an invite from that trainer; the directory is for discovery only (no join requests in the pilot).

**B3. Ending a client relationship**

1. Trainer → client page → "End relationship". A confirmation step includes a checkbox **"Let this client keep the plans I wrote for them"** (ticked by default).
2. Ticked: the client keeps their own editable copy. Plans the trainer wrote for that client are handed over to the client (`author_id` becomes the client), and the trainer's custom exercises used in those plans are copied to the client (`owner_id` = client) with the plan references re-pointed to the copies.
3. Unticked: the plans stay owned by the trainer and the client can no longer see them.
4. Either way, the client always keeps their own logged sessions (their history), and can still read the names of exercises used in those sessions.
5. All of this is done in one transaction by the `end_client(p_client uuid, p_allow_retain boolean)` RPC.

**H. Pilot feedback**

A "Send feedback" button on every page opens a free-text box. Submissions are saved to the `feedback` table along with the current route and the user's role.

---

## 5. Screens and routes

All routes are hash routes.

| Route                                     | Who       | Purpose                                                        |
| ----------------------------------------- | --------- | -------------------------------------------------------------- |
| `/login`                                  | all       | Google sign-in and the magic-link fallback                     |
| `/onboarding`                             | new users | choose role, display name, units                               |
| `/join/:code`                             | all       | accept a trainer invite                                        |
| `/settings`                               | all       | display name, units, sign out, delete account                  |
| `/trainers`                               | all       | browse registered trainers                                     |
| `/privacy`                                | all       | privacy notice (no sign-in needed)                             |
| `/t`                                      | trainer   | dashboard: clients and their activity                          |
| `/t/clients/:clientId`                    | trainer   | client profile: intake answers, active plan, history, progress |
| `/t/plans`                                | trainer   | template plans list                                            |
| `/t/plans/:planId`                        | trainer   | plan builder                                                   |
| `/t/exercises`                            | trainer   | exercise library: browse, create, edit own exercises           |
| `/t/questions`                            | trainer   | manage custom intake questions                                 |
| `/t/clients/:clientId/session/:sessionId` | trainer   | log a session on the client's behalf                           |
| `/u`                                      | user      | home: today's workout, recent sessions                         |
| `/u/intake`                               | user      | intake questionnaire                                           |
| `/u/plan`                                 | user      | view active plan (individuals can also edit it here)           |
| `/u/session/:sessionId`                   | user      | workout logging screen                                         |
| `/u/history`                              | user      | past sessions                                                  |
| `/u/progress/:exerciseId`                 | user      | progress chart for one exercise                                |

Route guards:

- Not signed in → `/login` (except `/privacy` and `/join/:code`, which can be viewed signed out).
- Signed in with no role yet → `/onboarding`.
- A role trying to open the other role's routes → redirect to that user's own home page.

---

## 6. Data model

All tables use `uuid` primary keys (`gen_random_uuid()`) and have `created_at timestamptz default now()`. Put the schema in `supabase/migrations/0001_init.sql` and later migration files.

### 6.1 Identity and linking

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('trainer','user')),        -- null until onboarding
  display_name text,
  avatar_url text,
  units text not null default 'kg' check (units in ('kg','lb')),
  created_at timestamptz default now()
);
-- Trigger on auth.users insert -> insert a profiles row (role null, name/avatar from the Google profile).

create table trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz default now(),
  ended_at timestamptz
);
create unique index one_active_trainer_per_client
  on trainer_clients(client_id) where status = 'active';

create table invites (
  code text primary key,                    -- 6 chars, unambiguous alphabet (no 0/O/1/I)
  trainer_id uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now()
);
-- peek_invite(code text) returns { trainer_display_name, trainer_avatar_url, valid boolean }.
-- SECURITY DEFINER, callable signed in or signed out, so the join page can show who the invite is from.
-- Accepting an invite is done by an RPC: accept_invite(code text), which is SECURITY DEFINER.
-- It checks the invite is valid, not expired and unused; sets role='user' if the role is null;
-- rejects the call if the caller is a trainer or already has an active trainer;
-- then inserts trainer_clients and marks the invite as used, all in one transaction.
```

### 6.2 Exercises

```sql
create table exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null, -- null + is_builtin=false = owner deleted their account
  is_builtin boolean not null default false,
  name text not null,
  description text,
  primary_muscle text,          -- chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, full_body, cardio
  secondary_muscles text[] default '{}',
  equipment text[] default '{}',-- barbell, dumbbell, kettlebell, machine, cable, band, bodyweight, pull_up_bar, bench, cardio_machine, other
  tracking_type text not null check (tracking_type in
    ('weight_reps','bodyweight_reps','assisted_reps','duration','distance_duration','reps_only')),
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  caution_tags text[] default '{}', -- knees, lower_back, shoulders, hips, wrists, neck
  video_url text,
  archived boolean default false,
  created_at timestamptz default now()
);
```

### 6.3 Plans

```sql
create table plans (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,  -- trainer, or the individual user; null = "Deleted account"
  client_id uuid references profiles(id) on delete cascade,   -- null = template; an individual's own plan has client_id = their own id
  name text not null,
  notes text,
  start_date date,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index one_active_plan_per_client on plans(client_id) where status = 'active';

create table plan_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  name text not null,                 -- "Day A – Upper"
  weekdays smallint[] default '{}',   -- 1=Mon … 7=Sun; empty = run in sequence
  sort_order int not null,
  notes text
);

create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_workout_id uuid not null references plan_workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sort_order int not null,
  superset_group smallint,            -- same number = done as a superset
  equipment_note text,                -- e.g. "Smith machine", "green band"
  notes text
);

create table plan_sets (
  id uuid primary key default gen_random_uuid(),
  plan_exercise_id uuid not null references plan_exercises(id) on delete cascade,
  set_number int not null,
  set_type text not null default 'normal' check (set_type in ('warmup','normal','drop','failure')),
  target_reps_min int,
  target_reps_max int,                -- equal to min for a fixed rep count
  target_weight_kg numeric(6,2),
  target_duration_s int,
  target_distance_m int,
  rest_s int
);
```

### 6.4 Intake

```sql
create table intake_questions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade, -- null = default question for everyone
  key text,                          -- stable key for default questions (e.g. 'equipment')
  prompt text not null,
  type text not null check (type in ('single','multi','text','number','yes_no')),
  options jsonb,                     -- [{ "value": "dumbbell", "label": "Dumbbells" }]
  sort_order int not null,
  required boolean default false,
  archived boolean default false
);

create table intake_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,            -- { "<question_id>": <value> }
  health_consent boolean not null default false,
  submitted_at timestamptz default now()
);
-- Keep every submission; the latest one is the current answer set.
```

**Default questions** (seeded, `trainer_id` null):

| key                | Prompt                                     | Type   | Options / notes                                                                              |
| ------------------ | ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------- |
| goal               | What's your main goal?                     | single | lose fat, build muscle, get stronger, general fitness, mobility/rehab, sport-specific        |
| experience         | How long have you been training?           | single | never → beginner; under 6 months → beginner; 6–24 months → intermediate; 2+ years → advanced |
| days_per_week      | How many days a week can you train?        | number | 1–7                                                                                          |
| session_length     | How long can each session be?              | single | 20, 30, 45, 60, 90 minutes                                                                   |
| location           | Where will you train?                      | single | commercial gym, home with equipment, home with no equipment, outdoors                        |
| equipment          | What equipment do you have access to?      | multi  | same values as `exercises.equipment`                                                         |
| limitations        | Any injuries or areas to be careful with?  | multi  | knees, lower back, shoulders, hips, wrists, neck, none                                       |
| limitations_detail | Tell us more about any injuries (optional) | text   |                                                                                              |
| preferences        | Exercises you enjoy or dislike (optional)  | text   |                                                                                              |
| other              | Anything else your trainer should know?    | text   |                                                                                              |

**Health data:** the `limitations` answers are health data, which UK GDPR treats as special category data. Before those two questions, show a short explanation and a required consent checkbox, and store the result in `health_consent`. If the user doesn't consent, hide those two questions. Add a plain privacy notice page linked from the login page.

How answers become suggestions in the exercise picker:

- `equipment` → pre-set equipment filter. Bodyweight is always included.
- `experience` → pre-set difficulty filter (beginner shows only beginner; intermediate shows beginner and intermediate; advanced shows all).
- `limitations` → a ⚠️ badge on exercises whose `caution_tags` overlap.

These are only defaults; the trainer can clear any filter. Implement the logic in `src/domain/suggestions.ts`.

### 6.5 Logging

```sql
create table workout_sessions (
  id uuid primary key,                -- generated on the device (crypto.randomUUID) so sync can safely retry
  client_id uuid not null references profiles(id) on delete cascade,
  logged_by uuid references profiles(id) on delete set null,  -- null = "Deleted account"
  plan_workout_id uuid references plan_workouts(id) on delete set null,
  name text,                          -- copied from the plan workout, or "Freestyle"
  started_at timestamptz not null,
  completed_at timestamptz,
  notes text,
  updated_at timestamptz default now()
);

create table session_sets (
  id uuid primary key,                -- generated on the device
  session_id uuid not null references workout_sessions(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade, -- denormalised from the session for RLS; a trigger checks it matches
  exercise_id uuid not null references exercises(id),
  exercise_order int not null,
  set_number int not null,
  set_type text not null default 'normal',
  reps int,
  weight_kg numeric(6,2),
  duration_s int,
  distance_m int,
  equipment_used text,
  rpe numeric(3,1),                   -- optional rating of effort, 1–10
  completed boolean not null default true,
  notes text
);

create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  measured_on date not null,
  bodyweight_kg numeric(5,2),
  notes text
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  role text,
  route text,
  message text not null,
  created_at timestamptz default now()
);
```

**Deleted accounts.** Nothing is ever attributed to a missing person: wherever an author, owner or logger column is null (`plans.author_id`, `workout_sessions.logged_by`, custom `exercises.owner_id`), the UI shows **"Deleted account"**. The `delete_account()` RPC (SECURITY DEFINER) does this in one transaction:

- Trainer: calls `end_client(client, true)` for every active client (so clients keep their plans), deletes the trainer's templates and invites, then deletes the auth user. Remaining references become null through `on delete set null`.
- User: deletes the auth user; their own data goes through `on delete cascade`.

Add indexes on every foreign key, plus on `workout_sessions(client_id, started_at desc)` and `session_sets(exercise_id)`.

---

## 7. Row-level security

Create two helper functions. Both are `SECURITY DEFINER` with a fixed `search_path`:

- `is_trainer_of(p_client uuid) returns boolean`: true if an active `trainer_clients` row links `auth.uid()` as trainer to `p_client`.
- `can_access_client(p_client uuid) returns boolean`: `auth.uid() = p_client or is_trainer_of(p_client)`.

| Table                                           | Read                                                                                                                                                                                | Insert / update / delete                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| profiles                                        | yourself; trainers can read their clients; any signed-in user can read profiles where `role = 'trainer'` (the trainer directory)                                                    | yourself only. `role` can only change from null to a value (enforce with a trigger).     |
| trainer_clients                                 | the trainer or the client in the row                                                                                                                                                | insert only through `accept_invite`; ending only through `end_client`. No direct writes. |
| invites                                         | the trainer who owns them                                                                                                                                                           | trainers only, for themselves. Accepting goes through the RPC.                           |
| exercises                                       | built-in (`is_builtin`) to everyone signed in; your own; your active trainer's; your active clients'; any exercise used in a session you can access (so history always shows names) | your own only (trainers and individual users)                                            |
| plans, plan_workouts, plan_exercises, plan_sets | the author; the client (`client_id = auth.uid()`) when the author is themselves, null, or their active trainer; the client's active trainer                                         | the author only. Child tables check through to the parent plan.                          |
| intake_questions                                | defaults to everyone signed in; a trainer's own questions to that trainer and their clients                                                                                         | the trainer for their own questions                                                      |
| intake_responses                                | `can_access_client(client_id)`                                                                                                                                                      | the client only, for themselves                                                          |
| workout_sessions, session_sets, body_metrics    | `can_access_client(client_id)`                                                                                                                                                      | `can_access_client(client_id)`, and `logged_by = auth.uid()` on session insert           |
| feedback                                        | nobody (read it in the dashboard)                                                                                                                                                   | insert only, by any signed-in user                                                       |

**Required tests** (`supabase/tests/rls.sql`):

1. A trainer can't read a client who belongs to another trainer.
2. A client can't read another client's sessions.
3. A client can't edit their trainer's plan.
4. A user can't change their own role after it's set.
5. An invite can't be used twice or after it expires.
6. A user who already has an active trainer can't accept a second invite.
7. After `end_client(c, false)`, the client can't read the trainer's plans but can still read their own sessions and the exercise names in them.
8. After `end_client(c, true)`, the client owns and can edit the handed-over plans and the copied exercises.
9. Any signed-in user can read trainer profiles but not other users' profiles.

---

## 8. Frontend structure

### 8.1 Folders

```
src/
  app/            routes, layout, route guards, providers
  data/           ALL Supabase access: auth.ts, profiles.ts, exercises.ts, plans.ts, sessions.ts, intake.ts, invites.ts, feedback.ts
  domain/         pure logic + unit tests: suggestions.ts, progress.ts (estimated 1RM, volume, PBs), schedule.ts (today's workout), units.ts
  features/
    auth/ onboarding/ trainer-dashboard/ clients/ exercises/ plan-builder/ intake/ logging/ history/ progress/ feedback/ settings/
  components/ui/  shadcn components
  lib/            supabase client, database.types.ts, query client
```

### 8.2 Key domain functions (all with unit tests)

- `todaysWorkout(plan, workouts, lastSessions, today)`:
  - If a workout is pinned to today's weekday, return it.
  - Otherwise return the next workout in `sort_order` after the one completed most recently.
  - Otherwise return the first workout.
- `prefillSession(planWorkout, lastSessionForEachExercise)` → a draft list of sets. Targets come from the plan; the "last time" column comes from history.
- `estimated1RM(weight, reps)` using the Epley formula, for reps ≤ 12 only.
- `sessionVolume(sets)` and `detectPersonalBests(sessionSets, history)`.
- Unit conversion between kg and lb, rounded to the nearest 0.5 kg or 1 lb.

### 8.3 Logging screen and offline handling

- **Big tap targets** for use in the gym:
  - Steppers for reps (±1) and weight (±2.5 kg or ±5 lb). Tapping a number opens the numeric keypad.
  - A one-tap ✓ per set that accepts the pre-filled values.
- Show the plan's `equipment_note` under each exercise. `equipment_used` defaults to that note and can be edited.
- **Draft session saving:**
  - Save the session in progress to `localStorage` (key `session-draft:<id>`) on every change.
  - When the client taps Finish, upsert the session and its sets to Supabase. Use the IDs generated on the device so retries don't create duplicates.
  - If saving fails, keep the draft, show "Saved on this phone – will sync", and retry when the browser comes back online and whenever the app opens.
- **Resume:** if the app opens with an unfinished draft, offer "Resume workout".

### 8.4 Plan builder

- Desktop: two panes. The exercise picker (search plus filters seeded from intake answers) sits on the left; the plan with its workouts and exercises on the right.
- Mobile: one column, with the picker in a bottom sheet.
- Drag to reorder workouts and exercises. "Add set" copies the previous set's values.
- Set target fields change with `tracking_type`. For example, `duration` exercises show time and hide weight.
- A "Save as template" option, and a "Copy from template" option when creating a plan.
- **Saving:** keep an explicit Save button. Write the plan tree with an RPC, `save_plan(plan jsonb)`, which runs as one transaction. This avoids partly saved plans.

---

## 9. Setup and deployment

### 9.1 Supabase (done by hand, once; record the steps in the README)

1. Create the project in the London region (eu-west-2) if available, otherwise the nearest EU region.
2. **Google login:**
   - Create an OAuth client in Google Cloud Console.
   - Add the Supabase callback URL to the client's authorised redirect URIs.
   - Paste the client ID and secret into Supabase → Authentication → Providers → Google.
3. Authentication → URL configuration: set the site URL to `https://<github-user>.github.io/<repo>/` and add both `https://<github-user>.github.io/<repo>/**` and `http://localhost:5173/<repo>/**` to the allowed redirect URLs.
4. Enable email magic links as the fallback. Before inviting pilot users, set up custom SMTP (for example Resend's free tier): Supabase's built-in email sender only allows a few emails an hour.
5. Apply the migrations and seed data: `supabase link` then `supabase db push`, then run the seed.

### 9.2 GitHub Pages

- Set `vite.config.ts` `base: '/<repo>/'`.
- Add a `.github/workflows/deploy.yml` workflow that runs on every push to `main`: install, type-check, test, build, then deploy with `actions/deploy-pages`.
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets and inject them at build time. (The anon key is designed to be public; RLS is what protects the data.)
- The repo must be public for free GitHub Pages, unless the account is on a paid plan.

### 9.3 Keep-alive

Supabase pauses free projects after 7 days with no activity. To prevent that, add `.github/workflows/keepalive.yml`, which runs `cron: '0 6 */3 * *'`. It makes one lightweight REST request using the anon key, for example `GET /rest/v1/exercises?select=id&limit=1`.

### 9.4 Seed data (`supabase/seed.sql`)

- The default intake questions from section 6.4.
- About 45 built-in exercises (`is_builtin = true`, `owner_id` null):

| Exercise                       | Primary muscle | Equipment            | Tracking          | Difficulty   | Caution tags          |
| ------------------------------ | -------------- | -------------------- | ----------------- | ------------ | --------------------- |
| Barbell Back Squat             | quads          | barbell              | weight_reps       | intermediate | knees, lower_back     |
| Goblet Squat                   | quads          | dumbbell, kettlebell | weight_reps       | beginner     | knees                 |
| Leg Press                      | quads          | machine              | weight_reps       | beginner     | knees                 |
| Bodyweight Squat               | quads          | bodyweight           | bodyweight_reps   | beginner     | knees                 |
| Walking Lunge                  | quads          | dumbbell, bodyweight | weight_reps       | beginner     | knees                 |
| Bulgarian Split Squat          | quads          | dumbbell, bench      | weight_reps       | intermediate | knees                 |
| Leg Extension                  | quads          | machine              | weight_reps       | beginner     | knees                 |
| Romanian Deadlift              | hamstrings     | barbell, dumbbell    | weight_reps       | intermediate | lower_back            |
| Conventional Deadlift          | full_body      | barbell              | weight_reps       | advanced     | lower_back            |
| Lying Leg Curl                 | hamstrings     | machine              | weight_reps       | beginner     |                       |
| Hip Thrust                     | glutes         | barbell, bench       | weight_reps       | intermediate |                       |
| Glute Bridge                   | glutes         | bodyweight           | bodyweight_reps   | beginner     |                       |
| Standing Calf Raise            | calves         | machine, dumbbell    | weight_reps       | beginner     |                       |
| Barbell Bench Press            | chest          | barbell, bench       | weight_reps       | intermediate | shoulders             |
| Dumbbell Bench Press           | chest          | dumbbell, bench      | weight_reps       | beginner     | shoulders             |
| Incline Dumbbell Press         | chest          | dumbbell, bench      | weight_reps       | beginner     | shoulders             |
| Push-up                        | chest          | bodyweight           | bodyweight_reps   | beginner     | wrists, shoulders     |
| Knee Push-up                   | chest          | bodyweight           | bodyweight_reps   | beginner     | wrists                |
| Chest Fly (Cable)              | chest          | cable                | weight_reps       | beginner     | shoulders             |
| Pull-up                        | back           | pull_up_bar          | bodyweight_reps   | advanced     | shoulders             |
| Assisted Pull-up               | back           | machine, band        | assisted_reps     | beginner     | shoulders             |
| Lat Pulldown                   | back           | cable, machine       | weight_reps       | beginner     |                       |
| Seated Cable Row               | back           | cable                | weight_reps       | beginner     |                       |
| One-arm Dumbbell Row           | back           | dumbbell, bench      | weight_reps       | beginner     |                       |
| Barbell Row                    | back           | barbell              | weight_reps       | intermediate | lower_back            |
| Band Pull-apart                | shoulders      | band                 | reps_only         | beginner     |                       |
| Overhead Press                 | shoulders      | barbell              | weight_reps       | intermediate | shoulders, lower_back |
| Seated Dumbbell Shoulder Press | shoulders      | dumbbell, bench      | weight_reps       | beginner     | shoulders             |
| Lateral Raise                  | shoulders      | dumbbell, cable      | weight_reps       | beginner     | shoulders             |
| Face Pull                      | shoulders      | cable, band          | weight_reps       | beginner     |                       |
| Dumbbell Curl                  | biceps         | dumbbell             | weight_reps       | beginner     |                       |
| Hammer Curl                    | biceps         | dumbbell             | weight_reps       | beginner     |                       |
| Triceps Pushdown               | triceps        | cable                | weight_reps       | beginner     |                       |
| Overhead Triceps Extension     | triceps        | dumbbell, cable      | weight_reps       | beginner     | shoulders             |
| Bench Dip                      | triceps        | bench, bodyweight    | bodyweight_reps   | intermediate | shoulders, wrists     |
| Plank                          | core           | bodyweight           | duration          | beginner     | lower_back            |
| Side Plank                     | core           | bodyweight           | duration          | beginner     | shoulders             |
| Dead Bug                       | core           | bodyweight           | reps_only         | beginner     |                       |
| Hanging Knee Raise             | core           | pull_up_bar          | bodyweight_reps   | intermediate | shoulders             |
| Pallof Press                   | core           | cable, band          | weight_reps       | beginner     |                       |
| Kettlebell Swing               | full_body      | kettlebell           | weight_reps       | intermediate | lower_back            |
| Farmer's Carry                 | full_body      | dumbbell, kettlebell | distance_duration | beginner     |                       |
| Treadmill                      | cardio         | cardio_machine       | distance_duration | beginner     | knees                 |
| Rowing Machine                 | cardio         | cardio_machine       | distance_duration | beginner     | lower_back            |
| Exercise Bike                  | cardio         | cardio_machine       | distance_duration | beginner     |                       |

---

## 10. Milestones

Build these in order. Each one ends deployable, with its acceptance criteria met.

**M0 – Scaffold and deploy**

- Vite + React + TypeScript + Tailwind + shadcn, HashRouter, Supabase client, TanStack Query, ESLint and Prettier, Vitest.
- The deploy and keep-alive workflows. The README contains the setup steps from section 9.
- ✅ A placeholder page is live on GitHub Pages, and CI passes.

**M1 – Database and security**

- The full schema from section 6, the RLS policies from section 7, the profile-creation trigger, the helper functions, the `accept_invite` and `save_plan` RPCs, seed data, generated types, and the RLS tests.
- ✅ `supabase db reset` runs cleanly, and all six RLS tests pass.

**M2 – Login and onboarding**

- Login page (Google plus magic link), onboarding, route guards, settings, sign out.
- Account deletion: the user confirms; the `delete_account()` RPC handles it as described in section 6.5.
- The trainer directory (`/trainers`) and the privacy notice page.
- ✅ A new Google user can choose a role and lands on the correct home page. Reloading any route works.

**M3 – Exercise library**

- Browse, search and filter built-in and custom exercises. Trainers and individual users can create, edit and archive their own.
- ✅ A trainer creates a custom exercise that their client can see and another trainer can't.

**M4 – Invites and client list**

- Generate an invite and copy its link, the join flow (showing the trainer's name via `peek_invite`), the trainer's client list, and ending a client relationship with the "let them keep plans" option.
- ✅ The full invite flow works end to end with two Google accounts.

**M5 – Intake questionnaire**

- The client's questionnaire with the health consent step, trainer-managed custom questions, the answers shown on the client page, and the suggestion filters in the exercise picker.
- ✅ Answers pre-set the picker's filters and caution badges.

**M6 – Plan builder**

- Workouts, exercises and sets; drag-to-reorder; weekday pinning; templates; assigning a plan to a client; individual users building their own plans.
- ✅ A trainer builds a three-workout plan, assigns it, and the client can see it.

**M7 – Workout logging**

- Today's workout, the session screen with pre-filled sets and last-time values, the rest timer, the summary, the offline draft and sync, and trainer logging on a client's behalf.
- ✅ Turning on airplane mode mid-workout, finishing, then reconnecting syncs the session with no duplicates.

**M8 – History, progress and dashboard**

- Session history, per-exercise charts, the bodyweight log, the trainer dashboard with activity and inactive flags.
- ✅ The charts match the logged data, and the unit tests for `progress.ts` pass.

**M9 – Pilot polish**

- The feedback button, installable-app manifest and icons, empty states, loading and error states, and a pass on accessibility (labels, contrast, focus).
- One Playwright end-to-end test of the full loop: trainer invites → client does intake → trainer builds plan → client logs a workout. It runs against local Supabase. Google sign-in can't be automated, so the test creates users with the local service-role key, signs them in with email/password through supabase-js in Node, and puts the session into the browser's `localStorage` before opening the app. Email/password sign-in is enabled in the local `supabase/config.toml` only, never in production.
- ✅ Lighthouse accessibility score is 90+ on mobile. The manifest is valid, Chrome offers to install the app, and the app shell loads offline. (Lighthouse removed its PWA score in v12, so it isn't used.)

---

## 11. Conventions

- Strict TypeScript; no `any`. Use the generated database types everywhere.
- Every data function in `src/data` returns typed results and throws on error. TanStack Query handles loading and error states.
- Keep components small and arrange folders by feature. No global state library; use the query cache and local state.
- Design for phones first (375px wide) and check at desktop width.
- SQL goes in migrations, never in the dashboard. Each migration is small and named.
- Keep secrets out of the repo. Only the `VITE_` variables reach the client.
- Use conventional commits. Push each milestone straight to `main` (no pull requests).
- Use the latest stable version of every library that works with the rest of the stack; don't pin to old majors.
- Show null authors, owners and loggers as "Deleted account".
- Record any decision not covered here in `DECISIONS.md` with a single line explaining why.

---

## 12. Open questions

These are for the product owner. Claude Code should use the defaults shown until they're answered.

1. **Weekdays or sequence:** should plans default to pinned weekdays, or to "next workout in sequence"? _Default: sequence, with optional pinning._
2. **Client editing:** can a client change targets in a plan their trainer assigned? _Default: no. They can change what they actually log, but not the plan._
3. **Video:** should exercises support uploaded demo videos, or links only? _Default: links only (YouTube and similar). Uploads would use up the 1 GB free storage._
4. **Multiple trainers:** will a client ever need more than one trainer, for example a PT plus a physio? _Default: no._
5. **Facebook login:** add it after the pilot, when Meta app review is worth doing. Apple sign-in becomes required once there's a native iPhone app.
6. **Pilot size:** how many trainers and clients? This decides whether the free tier is enough. _Assumed: under 20 trainers and 200 clients._
