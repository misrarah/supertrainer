-- The read policies on exercises and plans called helpers that look the row up again by id. A
-- statement can't see rows it is inserting, so `insert ... returning` (which the app uses to get
-- the saved row back) failed the read check. Check the row's own columns instead.

-- Exercises used in a session the caller can see, so history always shows exercise names.
create function public.exercise_in_visible_session(p_exercise uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.session_sets ss
    where ss.exercise_id = p_exercise and public.can_access_client(ss.client_id)
  );
$$;

revoke execute on function public.exercise_in_visible_session(uuid) from public, anon;
grant execute on function public.exercise_in_visible_session(uuid) to authenticated;

drop policy "exercises: read visible" on public.exercises;
create policy "exercises: read visible" on public.exercises
  for select to authenticated
  using (
    is_builtin
    or owner_id = auth.uid()
    or owner_id = public.my_trainer_id()
    or public.is_trainer_of(owner_id)
    or public.exercise_in_visible_session(id)
  );

drop policy "plans: read" on public.plans;
create policy "plans: read" on public.plans
  for select to authenticated
  using (
    author_id = auth.uid()
    or (client_id = auth.uid() and (author_id is null or author_id = public.my_trainer_id()))
    or (
      client_id is not null
      and public.is_trainer_of(client_id)
      and (author_id is null or author_id = client_id)
    )
  );

-- can_read_exercise() and can_read_plan() stay for checks on rows that already exist (save_plan,
-- child tables, session sets); keep them in step with the policies above.
create or replace function public.can_read_exercise(p_exercise uuid)
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
        or public.exercise_in_visible_session(e.id)
      )
  );
$$;
