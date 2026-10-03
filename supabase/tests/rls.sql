-- Row-level security tests. Run with `npm run db:test` (local Supabase must be running).
--
-- Cast: trainers T1 and T2; clients C1 (of T1) and C2 (of T2); new users C3 and C4 with no role.
-- Each block switches identity with `as <name>` comments: reset role, set the JWT, set role.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 't1@test.local', '{"full_name": "Trainer One"}'),
  ('00000000-0000-0000-0000-0000000000a2', 't2@test.local', '{"full_name": "Trainer Two"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'c1@test.local', '{"full_name": "Client One"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'c2@test.local', '{"full_name": "Client Two"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'c3@test.local', '{"full_name": "Client Three"}'),
  ('00000000-0000-0000-0000-0000000000c4', 'c4@test.local', '{"full_name": "Client Four"}');

update public.profiles set role = 'trainer'
where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2');
update public.profiles set role = 'user'
where id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');

insert into public.trainer_clients (trainer_id, client_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c2');

insert into public.exercises (id, owner_id, name, tracking_type) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'T1 Special', 'weight_reps'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a2', 'T2 Special', 'weight_reps');

insert into public.plans (id, author_id, client_id, name, status) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Plan 1', 'active'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c2', 'Plan 2', 'active');
insert into public.plan_workouts (id, plan_id, name, sort_order) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'Day A', 1),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'Day A', 1);
insert into public.plan_exercises (plan_workout_id, exercise_id, sort_order) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 1),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e2', 1);

insert into public.workout_sessions (id, client_id, logged_by, name, started_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'Day A', now()),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000c2', 'Day A', now());
insert into public.session_sets (id, session_id, exercise_id, exercise_order, set_number, reps, weight_kg) values
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 1, 1, 8, 40),
  (gen_random_uuid(), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e2', 1, 1, 8, 40);

insert into public.invites (code, trainer_id, expires_at) values
  ('GOODAA', '00000000-0000-0000-0000-0000000000a1', now() + interval '1 day'),
  ('EXPRED', '00000000-0000-0000-0000-0000000000a1', now() - interval '1 day'),
  ('TWOINV', '00000000-0000-0000-0000-0000000000a2', now() + interval '1 day');

select is(
  (select client_id from public.session_sets where session_id = '00000000-0000-0000-0000-0000000000f1'),
  '00000000-0000-0000-0000-0000000000c1'::uuid,
  'session_sets.client_id is filled from the session'
);

-- ---------------------------------------------------------------------------
-- as T1
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000c2'), 0,
  '1. a trainer cannot read another trainer''s client');
select is((select count(*)::int from public.workout_sessions where client_id = '00000000-0000-0000-0000-0000000000c2'), 0,
  '1. a trainer cannot read another trainer''s client''s sessions');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 1,
  'a trainer can read their own client');
select is((select count(*)::int from public.workout_sessions where client_id = '00000000-0000-0000-0000-0000000000c1'), 1,
  'a trainer can read their own client''s sessions');

-- ---------------------------------------------------------------------------
-- as C1
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.workout_sessions where client_id = '00000000-0000-0000-0000-0000000000c2'), 0,
  '2. a client cannot read another client''s sessions');
select is((select count(*)::int from public.session_sets where client_id = '00000000-0000-0000-0000-0000000000c2'), 0,
  '2. a client cannot read another client''s sets');
select is((select count(*)::int from public.workout_sessions), 1,
  'a client reads only their own sessions');

update public.plans set name = 'Hacked' where id = '00000000-0000-0000-0000-0000000000b1';
select is((select name from public.plans where id = '00000000-0000-0000-0000-0000000000b1'), 'Plan 1',
  '3. a client cannot edit their trainer''s plan directly');
select throws_ok(
  $$ select public.save_plan('{"id": "00000000-0000-0000-0000-0000000000b1", "name": "Hacked"}') $$,
  'P0001', 'plan_not_found',
  '3. a client cannot edit their trainer''s plan through save_plan');
select is((select count(*)::int from public.plan_exercises), 1,
  'a client can read the plan their trainer assigned');

select throws_ok(
  $$ update public.profiles set role = 'trainer' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  'P0001', 'role_locked',
  '4. a user cannot change their role once set');

select is((select count(*)::int from public.exercises where id = '00000000-0000-0000-0000-0000000000e1'), 1,
  'a client can see their trainer''s custom exercise');
select cmp_ok((select count(*)::int from public.exercises where is_builtin), '>=', 100,
  'everyone signed in can see the built-in exercises');

-- The app inserts and reads the saved row back in one request (insert ... returning).
select lives_ok(
  $$ insert into public.exercises (owner_id, name, tracking_type)
     values ('00000000-0000-0000-0000-0000000000c1', 'My Own Move', 'reps_only') returning id $$,
  'a user can create an exercise and read it back in the same request');
select throws_ok(
  $$ insert into public.exercises (owner_id, name, tracking_type)
     values ('00000000-0000-0000-0000-0000000000a1', 'Forged', 'reps_only') $$,
  '42501', null,
  'a user cannot create an exercise owned by someone else');
select lives_ok(
  $$ insert into public.plans (author_id, client_id, name)
     values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c1', 'Own plan')
     returning id $$,
  'a user can create a plan and read it back in the same request');

select lives_ok(
  $$ insert into public.feedback (user_id, role, route, message)
     values ('00000000-0000-0000-0000-0000000000c1', 'user', '/u', 'Nice app') $$,
  'any signed-in user can send feedback');
select is((select count(*)::int from public.feedback), 0, 'nobody can read feedback through the API');

-- ---------------------------------------------------------------------------
-- as T2
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.exercises where id = '00000000-0000-0000-0000-0000000000e1'), 0,
  'another trainer cannot see a trainer''s custom exercise');
select is((select count(*)::int from public.plans where id = '00000000-0000-0000-0000-0000000000b1'), 0,
  'another trainer cannot see a trainer''s plan');

-- ---------------------------------------------------------------------------
-- Invites: as C3 (no role yet), then C4
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c3", "role": "authenticated"}', true);
set local role authenticated;

select is((select trainer_display_name from public.peek_invite('goodaa')), 'Trainer One',
  'peek_invite shows the trainer''s name');
select lives_ok($$ select public.accept_invite('GOODAA') $$, 'a new user can accept a valid invite');
select is((select role from public.profiles where id = '00000000-0000-0000-0000-0000000000c3'), 'user',
  'accepting an invite sets the role to user');
select throws_ok($$ select public.accept_invite('TWOINV') $$, 'P0001', 'already_has_trainer',
  '6. a user with an active trainer cannot accept a second invite');

select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a2'), 1,
  '9. any signed-in user can read trainer profiles');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000c2'), 0,
  '9. users cannot read other users'' profiles');

reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c4", "role": "authenticated"}', true);
set local role authenticated;

select throws_ok($$ select public.accept_invite('GOODAA') $$, 'P0001', 'invite_used',
  '5. an invite cannot be used twice');
select throws_ok($$ select public.accept_invite('EXPRED') $$, 'P0001', 'invite_expired',
  '5. an invite cannot be used after it expires');
select is((select valid from public.peek_invite('GOODAA')), false, 'peek_invite reports used invites as invalid');

-- ---------------------------------------------------------------------------
-- Ending a relationship without handing plans over: T1 ends C1
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ select public.end_client('00000000-0000-0000-0000-0000000000c1', false) $$,
  'a trainer can end a relationship');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000b1'), 'archived',
  'the trainer keeps the plan, archived');
select is((select count(*)::int from public.workout_sessions where client_id = '00000000-0000-0000-0000-0000000000c1'), 0,
  'the trainer loses access to the ended client''s sessions');

reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.plans where id = '00000000-0000-0000-0000-0000000000b1'), 0,
  '7. the client can no longer read a plan that was not handed over');
select is((select count(*)::int from public.workout_sessions), 1,
  '7. the client keeps their own sessions');
select is(
  (select e.name from public.session_sets ss join public.exercises e on e.id = ss.exercise_id),
  'T1 Special',
  '7. the client can still read exercise names in their history');

-- ---------------------------------------------------------------------------
-- Ending a relationship and handing plans over: T2 ends C2
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ select public.end_client('00000000-0000-0000-0000-0000000000c2', true) $$,
  'a trainer can end a relationship and hand plans over');
select is((select count(*)::int from public.plans where id = '00000000-0000-0000-0000-0000000000b2'), 0,
  'the trainer no longer sees a handed-over plan');
select is((select count(*)::int from public.exercises where id = '00000000-0000-0000-0000-0000000000e2'), 1,
  'the trainer keeps their original exercise');

reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated"}', true);
set local role authenticated;

select is((select author_id from public.plans where id = '00000000-0000-0000-0000-0000000000b2'),
  '00000000-0000-0000-0000-0000000000c2'::uuid,
  '8. the handed-over plan now belongs to the client');
select is(
  (select e.owner_id from public.plan_exercises pe join public.exercises e on e.id = pe.exercise_id
   where pe.plan_workout_id = '00000000-0000-0000-0000-0000000000d2'),
  '00000000-0000-0000-0000-0000000000c2'::uuid,
  '8. the plan uses the client''s own copy of the trainer''s exercise');
update public.plans set name = 'Mine now' where id = '00000000-0000-0000-0000-0000000000b2';
select is((select name from public.plans where id = '00000000-0000-0000-0000-0000000000b2'), 'Mine now',
  '8. the client can edit the handed-over plan');
update public.exercises set name = 'My Special'
where owner_id = '00000000-0000-0000-0000-0000000000c2';
select is((select count(*)::int from public.exercises where name = 'My Special'), 1,
  '8. the client can edit the copied exercise');

-- ---------------------------------------------------------------------------
-- save_plan
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select public.save_plan(jsonb_build_object(
       'name', 'New plan',
       'client_id', '00000000-0000-0000-0000-0000000000c2',
       'status', 'active',
       'workouts', jsonb_build_array(jsonb_build_object(
         'name', 'Day A', 'weekdays', jsonb_build_array(1, 4),
         'exercises', jsonb_build_array(jsonb_build_object(
           'exercise_id', (select id from public.exercises where name = 'Goblet Squat'),
           'sets', jsonb_build_array(
             jsonb_build_object('target_reps_min', 8, 'target_reps_max', 12, 'target_weight_kg', 16),
             jsonb_build_object('target_reps_min', 8, 'target_reps_max', 12, 'target_weight_kg', 16)))))))) $$,
  'an individual can save a whole plan tree');
select is((select status from public.plans where id = '00000000-0000-0000-0000-0000000000b2'), 'archived',
  'activating a plan archives the previous active plan');
select is((select count(*)::int from public.plan_sets ps
           join public.plan_exercises pe on pe.id = ps.plan_exercise_id
           join public.plan_workouts pw on pw.id = pe.plan_workout_id
           join public.plans p on p.id = pw.plan_id
           where p.name = 'New plan'), 2,
  'save_plan writes every set');
select throws_ok(
  $$ select public.save_plan(jsonb_build_object(
       'name', 'Sneaky', 'client_id', '00000000-0000-0000-0000-0000000000c1')) $$,
  'P0001', 'not_your_client',
  'save_plan rejects plans for someone else''s client');
select throws_ok(
  $$ select public.save_plan(jsonb_build_object('name', 'Sneaky', 'workouts', jsonb_build_array(
       jsonb_build_object('name', 'X', 'exercises', jsonb_build_array(
         jsonb_build_object('exercise_id', '00000000-0000-0000-0000-0000000000e1')))))) $$,
  'P0001', 'exercise_not_found',
  'save_plan rejects exercises the author cannot see');

-- ---------------------------------------------------------------------------
-- Account deletion: T1 (who still trains C3) deletes their account
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
set local role authenticated;

select lives_ok($$ select public.delete_account() $$, 'a trainer can delete their account');

reset role;
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'the profile is gone');
select is((select count(*)::int from public.plans where id = '00000000-0000-0000-0000-0000000000b1'), 0,
  'plans the trainer kept private are deleted with the account');
select is((select status from public.trainer_clients where client_id = '00000000-0000-0000-0000-0000000000c3'), null,
  'the trainer''s client links are removed');
select ok((select owner_id is null from public.exercises where id = '00000000-0000-0000-0000-0000000000e1'),
  'an exercise used in history survives with no owner ("Deleted account")');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated"}', true);
set local role authenticated;
select is(
  (select e.name from public.session_sets ss join public.exercises e on e.id = ss.exercise_id),
  'T1 Special',
  'the client still sees exercise names in their history after the trainer leaves');

reset role;
select * from finish();
rollback;
