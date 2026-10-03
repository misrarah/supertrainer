-- RPCs for operations that span several tables or need checks RLS alone can't express.
-- Errors are raised with short snake_case messages that the app maps to friendly text.

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------

-- Lets the join page show who an invite is from, signed in or not.
create function public.peek_invite(p_code text)
returns table (trainer_display_name text, trainer_avatar_url text, valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, p.avatar_url, (i.used_by is null and i.expires_at > now())
  from public.invites i
  join public.profiles p on p.id = i.trainer_id
  where i.code = upper(trim(p_code));
$$;

create function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
  v_role text;
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;

  select * into v_invite from public.invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'invite_not_found';
  end if;
  if v_invite.used_by is not null then
    raise exception 'invite_used';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  select role into v_role from public.profiles where id = v_uid for update;
  if v_role = 'trainer' then
    raise exception 'trainer_cannot_join';
  end if;
  if exists (select 1 from public.trainer_clients where client_id = v_uid and status = 'active') then
    raise exception 'already_has_trainer';
  end if;

  if v_role is null then
    update public.profiles set role = 'user' where id = v_uid;
  end if;

  insert into public.trainer_clients (trainer_id, client_id) values (v_invite.trainer_id, v_uid);
  update public.invites set used_by = v_uid, used_at = now() where code = v_invite.code;

  return v_invite.trainer_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

-- Writes a whole plan tree in one transaction and returns the plan id.
--
-- Shape (ids are optional; omit them for new rows):
-- {
--   "id", "name", "notes", "client_id", "start_date", "status",
--   "workouts": [{
--     "id", "name", "weekdays": [1..7], "notes",
--     "exercises": [{
--       "exercise_id", "superset_group", "equipment_note", "notes",
--       "sets": [{ "set_type", "target_reps_min", "target_reps_max", "target_weight_kg",
--                  "target_duration_s", "target_distance_m", "rest_s" }]
--     }]
--   }]
-- }
--
-- Order comes from array position. Workouts keep their ids so logged sessions stay linked;
-- exercises and sets are replaced. Saving a plan as active archives the client's previous one.
create function public.save_plan(p_plan jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plan_id uuid := nullif(p_plan ->> 'id', '')::uuid;
  v_client uuid := nullif(p_plan ->> 'client_id', '')::uuid;
  v_status text := coalesce(nullif(p_plan ->> 'status', ''), 'draft');
  v_workout jsonb;
  v_workout_pos int;
  v_workout_id uuid;
  v_exercise jsonb;
  v_exercise_pos int;
  v_plan_exercise_id uuid;
  v_set jsonb;
  v_set_pos int;
  v_kept uuid[] := '{}';
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;
  if public.my_role() is null then
    raise exception 'not_onboarded';
  end if;
  if v_client is not null and v_client <> v_uid and not public.is_trainer_of(v_client) then
    raise exception 'not_your_client';
  end if;
  if v_plan_id is not null
     and not exists (select 1 from public.plans where id = v_plan_id and author_id = v_uid) then
    raise exception 'plan_not_found';
  end if;

  if v_status = 'active' then
    if v_client is null then
      raise exception 'template_cannot_be_active';
    end if;
    update public.plans set status = 'archived'
    where client_id = v_client and status = 'active' and id is distinct from v_plan_id;
  end if;

  if v_plan_id is null then
    insert into public.plans (author_id, client_id, name, notes, start_date, status)
    values (v_uid, v_client, p_plan ->> 'name', p_plan ->> 'notes',
            nullif(p_plan ->> 'start_date', '')::date, v_status)
    returning id into v_plan_id;
  else
    update public.plans
    set client_id = v_client,
        name = p_plan ->> 'name',
        notes = p_plan ->> 'notes',
        start_date = nullif(p_plan ->> 'start_date', '')::date,
        status = v_status
    where id = v_plan_id;
  end if;

  for v_workout, v_workout_pos in
    select value, ordinality from jsonb_array_elements(coalesce(p_plan -> 'workouts', '[]')) with ordinality
  loop
    v_workout_id := null;
    insert into public.plan_workouts (id, plan_id, name, weekdays, sort_order, notes)
    values (
      coalesce(nullif(v_workout ->> 'id', '')::uuid, gen_random_uuid()),
      v_plan_id,
      v_workout ->> 'name',
      array(select jsonb_array_elements_text(coalesce(v_workout -> 'weekdays', '[]'))::smallint),
      v_workout_pos,
      v_workout ->> 'notes'
    )
    on conflict (id) do update
      set name = excluded.name,
          weekdays = excluded.weekdays,
          sort_order = excluded.sort_order,
          notes = excluded.notes
      where public.plan_workouts.plan_id = v_plan_id
    returning id into v_workout_id;

    if v_workout_id is null then
      raise exception 'workout_belongs_to_another_plan';
    end if;
    v_kept := v_kept || v_workout_id;

    delete from public.plan_exercises where plan_workout_id = v_workout_id;

    for v_exercise, v_exercise_pos in
      select value, ordinality from jsonb_array_elements(coalesce(v_workout -> 'exercises', '[]')) with ordinality
    loop
      if not public.can_read_exercise((v_exercise ->> 'exercise_id')::uuid) then
        raise exception 'exercise_not_found';
      end if;

      insert into public.plan_exercises
        (plan_workout_id, exercise_id, sort_order, superset_group, equipment_note, notes)
      values (
        v_workout_id,
        (v_exercise ->> 'exercise_id')::uuid,
        v_exercise_pos,
        nullif(v_exercise ->> 'superset_group', '')::smallint,
        v_exercise ->> 'equipment_note',
        v_exercise ->> 'notes'
      )
      returning id into v_plan_exercise_id;

      for v_set, v_set_pos in
        select value, ordinality from jsonb_array_elements(coalesce(v_exercise -> 'sets', '[]')) with ordinality
      loop
        insert into public.plan_sets
          (plan_exercise_id, set_number, set_type, target_reps_min, target_reps_max,
           target_weight_kg, target_duration_s, target_distance_m, rest_s)
        values (
          v_plan_exercise_id,
          v_set_pos,
          coalesce(nullif(v_set ->> 'set_type', ''), 'normal'),
          nullif(v_set ->> 'target_reps_min', '')::int,
          nullif(v_set ->> 'target_reps_max', '')::int,
          nullif(v_set ->> 'target_weight_kg', '')::numeric,
          nullif(v_set ->> 'target_duration_s', '')::int,
          nullif(v_set ->> 'target_distance_m', '')::int,
          nullif(v_set ->> 'rest_s', '')::int
        );
      end loop;
    end loop;
  end loop;

  delete from public.plan_workouts where plan_id = v_plan_id and not (id = any (v_kept));

  return v_plan_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ending a relationship
-- ---------------------------------------------------------------------------

-- Called by the trainer. With p_allow_retain, plans the trainer wrote for this client are handed to
-- the client, along with their own copies of the trainer's custom exercises used in them. Without
-- it, those plans stay with the trainer (archived) and the client can no longer see them.
-- The client always keeps their logged sessions.
create function public.end_client(p_client uuid, p_allow_retain boolean default true)
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
      (owner_id, name, description, primary_muscle, secondary_muscles, equipment,
       tracking_type, difficulty, caution_tags, video_url, archived)
    values
      (p_client, v_exercise.name, v_exercise.description, v_exercise.primary_muscle,
       v_exercise.secondary_muscles, v_exercise.equipment, v_exercise.tracking_type,
       v_exercise.difficulty, v_exercise.caution_tags, v_exercise.video_url, v_exercise.archived)
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

-- ---------------------------------------------------------------------------
-- Account deletion
-- ---------------------------------------------------------------------------

-- Trainers hand every active client their plans first. Plans the caller still authors (templates,
-- and plans kept private when a relationship ended) are deleted so they never surface as
-- "Deleted account" plans. Unused custom exercises are deleted; used ones lose their owner.
-- Everything else follows the foreign keys: the caller's own data cascades, and their name on
-- other people's rows becomes null ("Deleted account").
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_client uuid;
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;

  for v_client in
    select client_id from public.trainer_clients where trainer_id = v_uid and status = 'active'
  loop
    perform public.end_client(v_client, true);
  end loop;

  delete from public.plans where author_id = v_uid;

  delete from public.exercises e
  where e.owner_id = v_uid
    and not exists (select 1 from public.plan_exercises pe where pe.exercise_id = e.id)
    and not exists (select 1 from public.session_sets ss where ss.exercise_id = e.id);

  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: Supabase grants new functions to anon and authenticated by default.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.peek_invite(text) to anon, authenticated;
grant execute on function
  public.accept_invite(text),
  public.save_plan(jsonb),
  public.end_client(uuid, boolean),
  public.delete_account(),
  -- used as a column default, so it runs with the caller's privileges
  public.generate_invite_code(),
  -- used by RLS policies
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
