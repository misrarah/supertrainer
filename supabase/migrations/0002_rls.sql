-- Helper functions and row-level security. RLS is the only security layer: the browser talks to
-- Postgres directly. Helpers are SECURITY DEFINER so policies can look across tables without
-- recursing into each other's RLS.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_trainer_of(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trainer_clients
    where trainer_id = auth.uid() and client_id = p_client and status = 'active'
  );
$$;

create function public.can_access_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() = p_client or public.is_trainer_of(p_client);
$$;

-- The signed-in user's active trainer, if any.
create function public.my_trainer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select trainer_id from public.trainer_clients
  where client_id = auth.uid() and status = 'active';
$$;

create function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Built-in; your own; your active trainer's; your active clients'; or used in a session you can see
-- (so history always shows exercise names, even after a relationship ends or an owner leaves).
create function public.can_read_exercise(p_exercise uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exercises e
    where e.id = p_exercise
      and (
        e.is_builtin
        or e.owner_id = auth.uid()
        or e.owner_id = public.my_trainer_id()
        or public.is_trainer_of(e.owner_id)
        or exists (
          select 1 from public.session_sets ss
          where ss.exercise_id = e.id and public.can_access_client(ss.client_id)
        )
      )
  );
$$;

-- Readers of a plan:
--  * its author;
--  * its client, when the author is the client, a deleted account, or the client's active trainer;
--  * the client's active trainer, for plans the client wrote or whose author was deleted.
-- So when a relationship ends without handing plans over, the old trainer's plans become invisible
-- to the client and to any new trainer.
create function public.can_read_plan(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plans p
    where p.id = p_plan
      and (
        p.author_id = auth.uid()
        or (
          p.client_id = auth.uid()
          and (p.author_id is null or p.author_id = public.my_trainer_id())
        )
        or (
          p.client_id is not null
          and public.is_trainer_of(p.client_id)
          and (p.author_id is null or p.author_id = p.client_id)
        )
      )
  );
$$;

create function public.is_plan_author(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.plans where id = p_plan and author_id = auth.uid());
$$;

create function public.plan_of_workout(p_workout uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select plan_id from public.plan_workouts where id = p_workout;
$$;

create function public.plan_of_plan_exercise(p_plan_exercise uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pw.plan_id
  from public.plan_exercises pe
  join public.plan_workouts pw on pw.id = pe.plan_workout_id
  where pe.id = p_plan_exercise;
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_trainer_of(uuid),
  public.can_access_client(uuid),
  public.my_trainer_id(),
  public.my_role(),
  public.can_read_exercise(uuid),
  public.can_read_plan(uuid),
  public.is_plan_author(uuid),
  public.plan_of_workout(uuid),
  public.plan_of_plan_exercise(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.trainer_clients enable row level security;
alter table public.invites enable row level security;
alter table public.exercises enable row level security;
alter table public.plans enable row level security;
alter table public.plan_workouts enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.plan_sets enable row level security;
alter table public.intake_questions enable row level security;
alter table public.intake_responses enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;
alter table public.body_metrics enable row level security;
alter table public.feedback enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: rows are created by the auth trigger and removed by delete_account()
-- ---------------------------------------------------------------------------

create policy "profiles: read self, own clients, and all trainers" on public.profiles
  for select to authenticated
  using (id = auth.uid() or role = 'trainer' or public.is_trainer_of(id));

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- trainer_clients: written only by accept_invite() and end_client()
-- ---------------------------------------------------------------------------

create policy "trainer_clients: read own links" on public.trainer_clients
  for select to authenticated
  using (trainer_id = auth.uid() or client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- invites: accepted only through accept_invite()
-- ---------------------------------------------------------------------------

create policy "invites: trainer reads own" on public.invites
  for select to authenticated
  using (trainer_id = auth.uid());

create policy "invites: trainer creates own" on public.invites
  for insert to authenticated
  with check (trainer_id = auth.uid() and public.my_role() = 'trainer' and used_by is null);

create policy "invites: trainer deletes own unused" on public.invites
  for delete to authenticated
  using (trainer_id = auth.uid() and used_by is null);

-- ---------------------------------------------------------------------------
-- exercises: archived rather than deleted, because plans and sessions reference them
-- ---------------------------------------------------------------------------

create policy "exercises: read visible" on public.exercises
  for select to authenticated
  using (public.can_read_exercise(id));

create policy "exercises: create own" on public.exercises
  for insert to authenticated
  with check (owner_id = auth.uid() and not is_builtin and public.my_role() is not null);

create policy "exercises: update own" on public.exercises
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and not is_builtin);

-- ---------------------------------------------------------------------------
-- plans and their children: the app writes through save_plan(); direct writes are author-only
-- ---------------------------------------------------------------------------

create policy "plans: read" on public.plans
  for select to authenticated
  using (public.can_read_plan(id));

create policy "plans: author inserts" on public.plans
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (client_id is null or client_id = auth.uid() or public.is_trainer_of(client_id))
  );

create policy "plans: author updates" on public.plans
  for update to authenticated
  using (author_id = auth.uid())
  with check (
    author_id = auth.uid()
    and (client_id is null or client_id = auth.uid() or public.is_trainer_of(client_id))
  );

create policy "plans: author deletes" on public.plans
  for delete to authenticated
  using (author_id = auth.uid());

create policy "plan_workouts: read" on public.plan_workouts
  for select to authenticated
  using (public.can_read_plan(plan_id));

create policy "plan_workouts: author writes" on public.plan_workouts
  for all to authenticated
  using (public.is_plan_author(plan_id))
  with check (public.is_plan_author(plan_id));

create policy "plan_exercises: read" on public.plan_exercises
  for select to authenticated
  using (public.can_read_plan(public.plan_of_workout(plan_workout_id)));

create policy "plan_exercises: author writes" on public.plan_exercises
  for all to authenticated
  using (public.is_plan_author(public.plan_of_workout(plan_workout_id)))
  with check (
    public.is_plan_author(public.plan_of_workout(plan_workout_id))
    and public.can_read_exercise(exercise_id)
  );

create policy "plan_sets: read" on public.plan_sets
  for select to authenticated
  using (public.can_read_plan(public.plan_of_plan_exercise(plan_exercise_id)));

create policy "plan_sets: author writes" on public.plan_sets
  for all to authenticated
  using (public.is_plan_author(public.plan_of_plan_exercise(plan_exercise_id)))
  with check (public.is_plan_author(public.plan_of_plan_exercise(plan_exercise_id)));

-- ---------------------------------------------------------------------------
-- intake: questions are archived rather than deleted, because answers reference their ids
-- ---------------------------------------------------------------------------

create policy "intake_questions: read defaults, own, and own trainer's" on public.intake_questions
  for select to authenticated
  using (trainer_id is null or trainer_id = auth.uid() or trainer_id = public.my_trainer_id());

create policy "intake_questions: trainer creates own" on public.intake_questions
  for insert to authenticated
  with check (trainer_id = auth.uid() and public.my_role() = 'trainer');

create policy "intake_questions: trainer updates own" on public.intake_questions
  for update to authenticated
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Every submission is kept; the latest is the current answer set.
create policy "intake_responses: read" on public.intake_responses
  for select to authenticated
  using (public.can_access_client(client_id));

create policy "intake_responses: client submits own" on public.intake_responses
  for insert to authenticated
  with check (client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- logging
-- ---------------------------------------------------------------------------

create policy "workout_sessions: read" on public.workout_sessions
  for select to authenticated
  using (public.can_access_client(client_id));

create policy "workout_sessions: insert" on public.workout_sessions
  for insert to authenticated
  with check (public.can_access_client(client_id) and logged_by = auth.uid());

create policy "workout_sessions: update" on public.workout_sessions
  for update to authenticated
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "workout_sessions: delete" on public.workout_sessions
  for delete to authenticated
  using (public.can_access_client(client_id));

create policy "session_sets: read" on public.session_sets
  for select to authenticated
  using (public.can_access_client(client_id));

create policy "session_sets: write" on public.session_sets
  for all to authenticated
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id) and public.can_read_exercise(exercise_id));

create policy "body_metrics: read" on public.body_metrics
  for select to authenticated
  using (public.can_access_client(client_id));

create policy "body_metrics: write" on public.body_metrics
  for all to authenticated
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

-- ---------------------------------------------------------------------------
-- feedback: write-only from the app; read it in the Supabase dashboard
-- ---------------------------------------------------------------------------

create policy "feedback: insert own" on public.feedback
  for insert to authenticated
  with check (user_id = auth.uid());
