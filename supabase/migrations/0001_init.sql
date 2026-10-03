-- Tables, constraints, indexes and housekeeping triggers. RLS and policies live in 0002.

-- ---------------------------------------------------------------------------
-- Identity and linking
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('trainer', 'user')), -- null until onboarding
  display_name text,
  avatar_url text,
  units text not null default 'kg' check (units in ('kg', 'lb')),
  created_at timestamptz not null default now()
);

create table public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (trainer_id <> client_id)
);
create unique index one_active_trainer_per_client
  on public.trainer_clients(client_id) where status = 'active';
create index trainer_clients_trainer_id_idx on public.trainer_clients(trainer_id);

-- 6 characters from an alphabet without 0/O/1/I.
create function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

create table public.invites (
  code text primary key default public.generate_invite_code(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_trainer_id_idx on public.invites(trainer_id);
create index invites_used_by_idx on public.invites(used_by);

-- ---------------------------------------------------------------------------
-- Exercises
-- ---------------------------------------------------------------------------

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null, -- null and not built-in = owner deleted their account
  is_builtin boolean not null default false,
  name text not null,
  description text,
  primary_muscle text check (primary_muscle in (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings',
    'glutes', 'calves', 'core', 'full_body', 'cardio')),
  secondary_muscles text[] not null default '{}',
  equipment text[] not null default '{}' check (equipment <@ array[
    'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'band', 'bodyweight',
    'pull_up_bar', 'bench', 'cardio_machine', 'other']),
  tracking_type text not null check (tracking_type in (
    'weight_reps', 'bodyweight_reps', 'assisted_reps', 'duration', 'distance_duration', 'reps_only')),
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  caution_tags text[] not null default '{}' check (caution_tags <@ array[
    'knees', 'lower_back', 'shoulders', 'hips', 'wrists', 'neck']),
  video_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  check (not is_builtin or owner_id is null)
);
create index exercises_owner_id_idx on public.exercises(owner_id);

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null, -- null = "Deleted account"
  client_id uuid references public.profiles(id) on delete cascade, -- null = template; an individual's plan uses their own id
  name text not null,
  notes text,
  start_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or client_id is not null)
);
create unique index one_active_plan_per_client on public.plans(client_id) where status = 'active';
create index plans_author_id_idx on public.plans(author_id);
create index plans_client_id_idx on public.plans(client_id);

create table public.plan_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  name text not null,
  weekdays smallint[] not null default '{}' check (weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]), -- 1=Mon … 7=Sun
  sort_order int not null,
  notes text,
  created_at timestamptz not null default now()
);
create index plan_workouts_plan_id_idx on public.plan_workouts(plan_id);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_workout_id uuid not null references public.plan_workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order int not null,
  superset_group smallint,
  equipment_note text,
  notes text,
  created_at timestamptz not null default now()
);
create index plan_exercises_plan_workout_id_idx on public.plan_exercises(plan_workout_id);
create index plan_exercises_exercise_id_idx on public.plan_exercises(exercise_id);

create table public.plan_sets (
  id uuid primary key default gen_random_uuid(),
  plan_exercise_id uuid not null references public.plan_exercises(id) on delete cascade,
  set_number int not null,
  set_type text not null default 'normal' check (set_type in ('warmup', 'normal', 'drop', 'failure')),
  target_reps_min int check (target_reps_min >= 0),
  target_reps_max int check (target_reps_max >= target_reps_min),
  target_weight_kg numeric(6, 2) check (target_weight_kg >= 0),
  target_duration_s int check (target_duration_s >= 0),
  target_distance_m int check (target_distance_m >= 0),
  rest_s int check (rest_s >= 0),
  created_at timestamptz not null default now()
);
create index plan_sets_plan_exercise_id_idx on public.plan_sets(plan_exercise_id);

-- ---------------------------------------------------------------------------
-- Intake
-- ---------------------------------------------------------------------------

create table public.intake_questions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.profiles(id) on delete cascade, -- null = default question
  key text,
  prompt text not null,
  type text not null check (type in ('single', 'multi', 'text', 'number', 'yes_no')),
  options jsonb,
  sort_order int not null,
  required boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index intake_questions_default_key on public.intake_questions(key) where trainer_id is null;
create index intake_questions_trainer_id_idx on public.intake_questions(trainer_id);

create table public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null,
  health_consent boolean not null default false,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index intake_responses_client_id_idx on public.intake_responses(client_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Logging
-- ---------------------------------------------------------------------------

create table public.workout_sessions (
  id uuid primary key, -- generated on the device so sync retries are idempotent
  client_id uuid not null references public.profiles(id) on delete cascade,
  logged_by uuid references public.profiles(id) on delete set null, -- null = "Deleted account"
  plan_workout_id uuid references public.plan_workouts(id) on delete set null,
  name text,
  started_at timestamptz not null,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_sessions_client_started_idx on public.workout_sessions(client_id, started_at desc);
create index workout_sessions_logged_by_idx on public.workout_sessions(logged_by);
create index workout_sessions_plan_workout_id_idx on public.workout_sessions(plan_workout_id);

create table public.session_sets (
  id uuid primary key, -- generated on the device
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade, -- copied from the session for RLS
  exercise_id uuid not null references public.exercises(id),
  exercise_order int not null,
  set_number int not null,
  set_type text not null default 'normal' check (set_type in ('warmup', 'normal', 'drop', 'failure')),
  reps int check (reps >= 0),
  weight_kg numeric(6, 2) check (weight_kg >= 0),
  duration_s int check (duration_s >= 0),
  distance_m int check (distance_m >= 0),
  equipment_used text,
  rpe numeric(3, 1) check (rpe between 1 and 10),
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index session_sets_session_id_idx on public.session_sets(session_id);
create index session_sets_client_id_idx on public.session_sets(client_id);
create index session_sets_exercise_id_idx on public.session_sets(exercise_id);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  measured_on date not null,
  bodyweight_kg numeric(5, 2) check (bodyweight_kg > 0),
  notes text,
  created_at timestamptz not null default now()
);
create index body_metrics_client_id_idx on public.body_metrics(client_id, measured_on desc);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  role text,
  route text,
  message text not null check (length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index feedback_user_id_idx on public.feedback(user_id);

-- ---------------------------------------------------------------------------
-- Housekeeping triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger workout_sessions_set_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- A profile row for every new auth user, with name and avatar from the Google profile.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The role can only go from null to a value. Changes by hand (no signed-in user) are allowed.
create function public.lock_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and old.role is not null and new.role is distinct from old.role then
    raise exception 'role_locked' using hint = 'The role can only be set once.';
  end if;
  return new;
end;
$$;

create trigger profiles_lock_role before update on public.profiles
  for each row execute function public.lock_profile_role();

-- session_sets.client_id always matches its session.
create function public.session_sets_fill_client()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_client uuid;
begin
  select client_id into session_client from public.workout_sessions where id = new.session_id;
  if new.client_id is null then
    new.client_id := session_client;
  elsif new.client_id is distinct from session_client then
    raise exception 'session_client_mismatch';
  end if;
  return new;
end;
$$;

create trigger session_sets_fill_client before insert or update on public.session_sets
  for each row execute function public.session_sets_fill_client();
