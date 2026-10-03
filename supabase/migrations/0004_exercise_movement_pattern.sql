-- Group exercises by movement so the library can show every variation of, say, a squat, from a
-- chair sit-to-stand up to a barbell back squat.
alter table public.exercises
  add column movement_pattern text check (movement_pattern in (
    'squat', 'lunge', 'hinge', 'push_horizontal', 'push_vertical', 'pull_horizontal',
    'pull_vertical', 'carry', 'core', 'isolation', 'cardio'));

create index exercises_movement_pattern_idx on public.exercises(movement_pattern);

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
       tracking_type, difficulty, caution_tags, video_url, archived)
    values
      (p_client, v_exercise.name, v_exercise.description, v_exercise.movement_pattern,
       v_exercise.primary_muscle, v_exercise.secondary_muscles, v_exercise.equipment,
       v_exercise.tracking_type, v_exercise.difficulty, v_exercise.caution_tags,
       v_exercise.video_url, v_exercise.archived)
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
