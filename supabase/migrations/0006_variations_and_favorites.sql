-- Variations: an exercise can be a variation of another (e.g. "Tempo Goblet Squat" of
-- "Goblet Squat"). Favourites: each user's own starred exercises.

alter table public.exercises
  add column variation_of uuid references public.exercises(id) on delete set null,
  add constraint exercises_not_own_variation check (variation_of <> id);

create index exercises_variation_of_idx on public.exercises(variation_of);

create table public.favorite_exercises (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
create index favorite_exercises_exercise_id_idx on public.favorite_exercises(exercise_id);

alter table public.favorite_exercises enable row level security;

create policy "favorite_exercises: read own" on public.favorite_exercises
  for select to authenticated
  using (user_id = auth.uid());

create policy "favorite_exercises: add own, for exercises you can see" on public.favorite_exercises
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_read_exercise(exercise_id));

create policy "favorite_exercises: remove own" on public.favorite_exercises
  for delete to authenticated
  using (user_id = auth.uid());

-- A variation must be of an exercise its author can see.
create function public.check_variation_visible()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.variation_of is not null
     and new.variation_of is distinct from old.variation_of
     and auth.uid() is not null
     and not public.can_read_exercise(new.variation_of) then
    raise exception 'exercise_not_found';
  end if;
  return new;
end;
$$;

create trigger exercises_check_variation before insert or update on public.exercises
  for each row execute function public.check_variation_visible();

-- end_client() copies exercises column by column; include the new one.
create or replace function public.end_client(p_client uuid, p_allow_retain boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_exercise public.exercises;
  v_copy_id uuid;
begin
  update public.trainer_clients set status = 'ended', ended_at = now()
  where trainer_id = v_uid and client_id = p_client and status = 'active';
  if not found then
    raise exception 'not_your_client';
  end if;

  if not p_allow_retain then
    update public.plans set status = 'archived'
    where author_id = v_uid and client_id = p_client and status = 'active';
    return;
  end if;

  for v_exercise in
    select e.* from public.exercises e
    where e.owner_id = v_uid
      and exists (
        select 1
        from public.plan_exercises pe
        join public.plan_workouts pw on pw.id = pe.plan_workout_id
        join public.plans p on p.id = pw.plan_id
        where pe.exercise_id = e.id and p.author_id = v_uid and p.client_id = p_client
      )
  loop
    insert into public.exercises
      (owner_id, name, description, movement_pattern, primary_muscle, secondary_muscles, equipment,
       tracking_type, difficulty, caution_tags, video_url, archived, variation_of)
    values
      (p_client, v_exercise.name, v_exercise.description, v_exercise.movement_pattern,
       v_exercise.primary_muscle, v_exercise.secondary_muscles, v_exercise.equipment,
       v_exercise.tracking_type, v_exercise.difficulty, v_exercise.caution_tags,
       v_exercise.video_url, v_exercise.archived,
       -- keep the link only if the client will still be able to see the parent
       case when exists (select 1 from public.exercises p
                         where p.id = v_exercise.variation_of and (p.is_builtin or p.owner_id = p_client))
            then v_exercise.variation_of end)
    returning id into v_copy_id;

    update public.plan_exercises pe set exercise_id = v_copy_id
    from public.plan_workouts pw, public.plans p
    where pw.id = pe.plan_workout_id and p.id = pw.plan_id
      and p.author_id = v_uid and p.client_id = p_client
      and pe.exercise_id = v_exercise.id;
  end loop;

  update public.plans set author_id = p_client
  where author_id = v_uid and client_id = p_client;
end;
$$;

revoke execute on function public.end_client(uuid, boolean) from public, anon;
grant execute on function public.end_client(uuid, boolean) to authenticated;
revoke execute on function public.check_variation_visible() from public, anon, authenticated;
