begin;

create extension if not exists pgtap with schema extensions;
select plan(54);

-- Additional identities used to exercise isolation and every team permission tier.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '99999999-9999-4999-8999-999999999999',
    'authenticated',
    'authenticated',
    'other-user@example.test',
    extensions.crypt('LocalTestOnly!2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'authenticated',
    'authenticated',
    'admin@example.test',
    extensions.crypt('LocalTestOnly!2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated',
    'authenticated',
    'coach@example.test',
    extensions.crypt('LocalTestOnly!2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'member@example.test',
    extensions.crypt('LocalTestOnly!2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'authenticated',
    'authenticated',
    'viewer@example.test',
    extensions.crypt('LocalTestOnly!2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into public.team_members (team_id, user_id, role, status)
values
  (
    '77777777-7777-4777-8777-777777777777',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'admin',
    'active'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'coach',
    'active'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'member',
    'active'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'viewer',
    'active'
  )
on conflict (team_id, user_id) do update
set role = excluded.role,
    status = excluded.status;

insert into public.team_invitations (
  team_id,
  invited_by,
  email,
  role,
  token_hash,
  expires_at
)
values (
  '77777777-7777-4777-8777-777777777777',
  '11111111-1111-4111-8111-111111111111',
  'other-user@example.test',
  'viewer',
  repeat('9', 64),
  now() + interval '1 day'
)
on conflict (token_hash) do update
set accepted_at = null,
    revoked_at = null,
    expires_at = excluded.expires_at;

insert into public.scans (
  id,
  user_id,
  target_role,
  status,
  overall_score,
  analysis_mode
)
values (
  '99999999-0000-4000-8000-000000000001',
  '99999999-9999-4999-8999-999999999999',
  'Private role',
  'complete',
  50,
  'demo'
)
on conflict (id) do nothing;

insert into public.scan_results (scan_id, user_id, result, confidence)
values (
  '99999999-0000-4000-8000-000000000001',
  '99999999-9999-4999-8999-999999999999',
  '{"private":true}'::jsonb,
  0.8
)
on conflict (scan_id) do nothing;

insert into public.dimension_scores (
  scan_id,
  dimension_key,
  label,
  score,
  explanation
)
values (
  '99999999-0000-4000-8000-000000000001',
  'private',
  'Private score',
  50,
  'This row must inherit the private parent authorization.'
)
on conflict (scan_id, dimension_key) do nothing;

insert into public.scans (
  id,
  user_id,
  team_id,
  target_role,
  status,
  overall_score,
  analysis_mode
)
values (
  'eeeeeeee-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '77777777-7777-4777-8777-777777777777',
  'Shared product role',
  'complete',
  72,
  'demo'
)
on conflict (id) do nothing;

insert into public.scan_results (scan_id, user_id, result, confidence)
values (
  'eeeeeeee-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '{
    "dimensionScores":[
      {
        "key":"impact",
        "label":"Impact",
        "score":72,
        "explanation":"Shared nested analysis fixture."
      }
    ],
    "keywords":[]
  }'::jsonb,
  0.9
)
on conflict (scan_id) do update
set result = excluded.result,
    confidence = excluded.confidence;

insert into public.scans (
  id,
  user_id,
  target_role,
  status,
  analysis_mode
)
values (
  'aaaaaaaa-0000-4000-8000-000000000010',
  '11111111-1111-4111-8111-111111111111',
  'Analyzer ownership test',
  'complete',
  'deterministic'
)
on conflict (id) do nothing;

update public.subscriptions
set scans_used = 0,
    scan_limit = 1
where user_id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select is(
  (
    select count(*)::integer
    from public.scans
    where id = '66666666-6666-4666-8666-666666666666'
  ),
  1,
  'a user can read their own scan'
);

select is(
  (
    select count(*)::integer
    from public.scans
    where id = '99999999-0000-4000-8000-000000000001'
  ),
  0,
  'a user cannot read another user scan'
);

select is(
  (
    select count(*)::integer
    from public.scan_results
    where scan_id = '99999999-0000-4000-8000-000000000001'
  ),
  0,
  'nested scan results inherit parent authorization'
);

select is(
  (
    select count(*)::integer
    from public.dimension_scores
    where scan_id = '66666666-6666-4666-8666-666666666666'
  ),
  7,
  'seeded dimension scores are normalized and visible through their parent'
);

select is(
  (
    select count(*)::integer
    from public.keyword_matches
    where scan_id = '66666666-6666-4666-8666-666666666666'
  ),
  19,
  'seeded keyword matches are normalized and visible through their parent'
);

select is(
  (
    select count(*)::integer
    from public.findings
    where scan_id = '66666666-6666-4666-8666-666666666666'
      and title <> ''
      and why_it_matters <> ''
      and recommendation <> ''
  ),
  2,
  'seeded findings persist their explicit workflow fields'
);

select is(
  (
    select count(*)::integer
    from public.dimension_scores
    where scan_id = '99999999-0000-4000-8000-000000000001'
  ),
  0,
  'normalized child rows do not bypass cross-user isolation'
);

select throws_ok(
  $$update public.scans
    set user_id = '99999999-9999-4999-8999-999999999999'
    where id = '66666666-6666-4666-8666-666666666666'$$,
  '42501',
  'permission denied for table scans',
  'browser roles cannot update analyzer-owned scans, including ownership'
);

select throws_ok(
  $$insert into public.scans (
      id,
      user_id,
      target_role,
      status,
      analysis_mode
    )
    values (
      'aaaaaaaa-0000-4000-8000-000000000011',
      '11111111-1111-4111-8111-111111111111',
      'Forged client analysis',
      'complete',
      'deterministic'
    )$$,
  '42501',
  'permission denied for table scans',
  'authenticated clients cannot insert analyzer-owned scans'
);

select throws_ok(
  $$insert into public.scan_results (scan_id, user_id, result, confidence)
    values (
      'aaaaaaaa-0000-4000-8000-000000000010',
      '99999999-9999-4999-8999-999999999999',
      '{"dimensionScores":[],"keywords":[]}'::jsonb,
      0.5
    )$$,
  '42501',
  'permission denied for table scan_results',
  'authenticated clients cannot insert canonical scan results'
);

select is(
  (
    select count(*)::integer
    from public.scan_results
    where scan_id = 'aaaaaaaa-0000-4000-8000-000000000010'
  ),
  0,
  'a denied scan-result write leaves no forged child row'
);

select throws_ok(
  $$insert into public.dimension_scores (
      scan_id,
      dimension_key,
      label,
      score,
      explanation
    )
    values (
      '66666666-6666-4666-8666-666666666666',
      'forged',
      'Forged client score',
      100,
      'Direct client analysis writes are forbidden.'
    )$$,
  '42501',
  'new row violates row-level security policy for table "dimension_scores"',
  'clients cannot write trusted normalized scores directly'
);

select is(
  (
    select count(*)::integer
    from public.scans
    where id = 'eeeeeeee-0000-4000-8000-000000000001'
  ),
  1,
  'the team owner can read all workspace scans'
);

select lives_ok(
  $$insert into public.report_shares (
      scan_id,
      user_id,
      token_hash,
      expires_at
    )
    values (
      'eeeeeeee-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      repeat('a', 64),
      now() + interval '7 days'
    )$$,
  'the team owner can create a revocable share'
);

select lives_ok(
  $$insert into public.comments (
      user_id,
      scan_id,
      body
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      'eeeeeeee-0000-4000-8000-000000000001',
      'Owner review note.'
    )$$,
  'a resource owner can comment on an authorized scan'
);

select throws_ok(
  $$update public.recommendations
    set status = 'applied',
        created_version_id = '33333333-3333-4333-8333-333333333332'
    where scan_id = '66666666-6666-4666-8666-666666666666'
      and external_id = 'demo-rewrite-launch-planning'$$,
  'P0001',
  'applied recommendations require the atomic workflow',
  'a client cannot bypass atomic version creation'
);

select ok(
  public.apply_recommendation_version(
    '66666666-6666-4666-8666-666666666666',
    'demo-rewrite-launch-planning',
    '• Responsible for coordinating launch planning with sales and marketing stakeholders.',
    '• Coordinated launch planning with sales and marketing stakeholders.',
    'Clarify ownership of launch planning'
  ) is not null,
  'applying a recommendation atomically creates a resume version'
);

select is(
  (
    select count(*)::integer
    from public.resume_versions
    where resume_id = '22222222-2222-4222-8222-222222222222'
      and version_number = 3
      and content like '%• Coordinated launch planning with sales and marketing stakeholders.%'
  ),
  1,
  'the immutable version contains the exact confirmed rewrite'
);

select ok(
  (
    select score_stale
    from public.scans
    where id = '66666666-6666-4666-8666-666666666666'
  ),
  'an applied rewrite marks prior scoring stale'
);

select is(
  (
    select count(*)::integer
    from public.recommendations
    where scan_id = '66666666-6666-4666-8666-666666666666'
      and external_id = 'demo-rewrite-launch-planning'
      and status = 'applied'
      and created_version_id is not null
  ),
  1,
  'the recommendation records its applied version'
);

select is(
  public.apply_recommendation_version(
    '66666666-6666-4666-8666-666666666666',
    'demo-rewrite-launch-planning',
    '• Responsible for coordinating launch planning with sales and marketing stakeholders.',
    '• Coordinated launch planning with sales and marketing stakeholders.',
    'Clarify ownership of launch planning'
  ),
  (
    select created_version_id
    from public.recommendations
    where scan_id = '66666666-6666-4666-8666-666666666666'
      and external_id = 'demo-rewrite-launch-planning'
  ),
  'an exact replay returns the existing version id'
);

select is(
  (
    select count(*)::integer
    from public.resume_versions
    where resume_id = '22222222-2222-4222-8222-222222222222'
      and version_number = 3
  ),
  1,
  'an idempotent replay does not create a duplicate version'
);

select throws_ok(
  $$select public.apply_recommendation_version(
      '66666666-6666-4666-8666-666666666666',
      'demo-rewrite-launch-planning',
      'not the stored source',
      '• Coordinated launch planning with sales and marketing stakeholders.',
      'Clarify ownership of launch planning'
    )$$,
  'P0001',
  'recommendation content does not match',
  'the RPC rejects tampered recommendation content'
);

select ok(
  public.reserve_scan_quota('aaaaaaaa-0000-4000-8000-000000000001'),
  'the first quota reservation succeeds'
);

select ok(
  public.reserve_scan_quota('aaaaaaaa-0000-4000-8000-000000000001'),
  'the same scan reservation is idempotent'
);

select ok(
  not public.reserve_scan_quota('aaaaaaaa-0000-4000-8000-000000000002'),
  'a distinct reservation is rejected at the atomic quota limit'
);

select is(
  (
    select count(*)::integer
    from public.quota_ledger
    where user_id = '11111111-1111-4111-8111-111111111111'
      and scan_id = 'aaaaaaaa-0000-4000-8000-000000000001'
  ),
  1,
  'idempotent quota reservation creates one ledger row'
);

select is(
  (
    select scans_used
    from public.subscriptions
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  1,
  'quota usage is incremented exactly once'
);

select throws_ok(
  $$select public.release_scan_quota(
      'aaaaaaaa-0000-4000-8000-000000000001'
    )$$,
  '42501',
  'permission denied for function release_scan_quota',
  'authenticated clients cannot release reserved quota'
);

select throws_ok(
  $$select public.reserve_rate_limit(
      'forged-client-bucket',
      repeat('f', 64),
      1000000,
      1
    )$$,
  '42501',
  'permission denied for function reserve_rate_limit',
  'authenticated clients cannot choose generic rate-limit parameters'
);

reset role;
set local role service_role;

select ok(
  public.reserve_rate_limit(
    'db-test',
    repeat('e', 64),
    2,
    60
  ),
  'the service workflow can reserve a rate-limit bucket'
);

select ok(
  public.release_scan_quota('aaaaaaaa-0000-4000-8000-000000000001'),
  'the service workflow can release quota after a failed scan'
);

select is(
  public.accept_team_invitation(
    repeat('9', 64),
    '99999999-9999-4999-8999-999999999999',
    'OTHER-USER@example.test'
  ),
  '77777777-7777-4777-8777-777777777777'::uuid,
  'the service workflow accepts a matching unexpired invitation atomically'
);

select is(
  (
    select role
    from public.team_members
    where team_id = '77777777-7777-4777-8777-777777777777'
      and user_id = '99999999-9999-4999-8999-999999999999'
  ),
  'viewer',
  'invitation acceptance creates membership with the invited role'
);

select ok(
  (
    select accepted_at is not null
    from public.team_invitations
    where token_hash = repeat('9', 64)
  ),
  'invitation acceptance marks the locked invitation consumed'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  true
);

select throws_ok(
  $$update public.scans
    set target_role = 'Admin direct analyzer edit'
    where id = 'eeeeeeee-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table scans',
  'an admin cannot directly mutate analyzer-owned scan output'
);

select is(
  (
    select count(*)::integer
    from public.subscriptions
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  1,
  'an admin can read workspace billing state'
);

select set_config(
  'request.jwt.claim.sub',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  true
);

select throws_ok(
  $$update public.scans
    set target_role = 'Coach direct analyzer edit'
    where id = 'eeeeeeee-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table scans',
  'a coach cannot directly mutate analyzer-owned scan output'
);

select lives_ok(
  $$insert into public.report_shares (
      scan_id,
      user_id,
      token_hash,
      expires_at
    )
    values (
      'eeeeeeee-0000-4000-8000-000000000001',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      repeat('c', 64),
      now() + interval '7 days'
    )$$,
  'a coach can create a share for a scan they may edit'
);

select set_config(
  'request.jwt.claim.sub',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  true
);

select is(
  (
    select count(*)::integer
    from public.scans
    where id = 'eeeeeeee-0000-4000-8000-000000000001'
  ),
  1,
  'a member can read shared workspace scans'
);

select throws_ok(
  $$update public.scans
    set target_role = 'Member direct analyzer edit'
    where id = 'eeeeeeee-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table scans',
  'a member cannot directly mutate analyzer-owned scan output'
);

select lives_ok(
  $$insert into public.job_descriptions (
      id,
      user_id,
      team_id,
      title,
      content
    )
    values (
      'bbbbbbbb-0000-4000-8000-000000000001',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '77777777-7777-4777-8777-777777777777',
      'Member-owned role',
      'A member can manage a role description they created.'
    )$$,
  'a member can create their own team resource'
);

select lives_ok(
  $$insert into public.comments (
      user_id,
      scan_id,
      body
    )
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'eeeeeeee-0000-4000-8000-000000000001',
      'Member contribution note.'
    )$$,
  'a member can comment on a shared workspace scan'
);

select is(
  (
    with updated as (
      update public.job_descriptions
      set title = 'Member-owned role, updated'
      where id = 'bbbbbbbb-0000-4000-8000-000000000001'
      returning id
    )
    select count(*)::integer
    from updated
  ),
  1,
  'a member can update their own team resource'
);

select set_config(
  'request.jwt.claim.sub',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  true
);

select is(
  (
    select count(*)::integer
    from public.scans
    where id = 'eeeeeeee-0000-4000-8000-000000000001'
  ),
  1,
  'a viewer can read shared workspace scans'
);

select is(
  (
    select count(*)::integer
    from public.scan_results
    where scan_id = 'eeeeeeee-0000-4000-8000-000000000001'
  ),
  1,
  'a viewer can read nested analysis through an authorized parent'
);

select throws_ok(
  $$update public.scans
    set target_role = 'Viewer direct analyzer edit'
    where id = 'eeeeeeee-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table scans',
  'a viewer cannot directly mutate analyzer-owned scan output'
);

select throws_ok(
  $$insert into public.report_shares (
      scan_id,
      user_id,
      token_hash,
      expires_at
    )
    values (
      'eeeeeeee-0000-4000-8000-000000000001',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      repeat('d', 64),
      now() + interval '7 days'
    )$$,
  '42501',
  'new row violates row-level security policy for table "report_shares"',
  'a viewer cannot create an externally accessible share'
);

select throws_ok(
  $$insert into public.comments (
      user_id,
      scan_id,
      body
    )
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'eeeeeeee-0000-4000-8000-000000000001',
      'Viewer write attempt.'
    )$$,
  '42501',
  'new row violates row-level security policy for table "comments"',
  'a viewer cannot insert comments on shared resources'
);

select throws_ok(
  $$select public.apply_recommendation_version(
      '66666666-6666-4666-8666-666666666666',
      'demo-rewrite-launch-planning',
      '• Responsible for coordinating launch planning with sales and marketing stakeholders.',
      '• Coordinated launch planning with sales and marketing stakeholders.',
      'Clarify ownership of launch planning'
    )$$,
  'P0001',
  'scan has no editable resume',
  'a viewer cannot apply a recommendation outside their editable scope'
);

select throws_ok(
  $$insert into public.job_descriptions (
      user_id,
      team_id,
      title,
      content
    )
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      '77777777-7777-4777-8777-777777777777',
      'Viewer write attempt',
      'A viewer must not be able to create shared resources.'
    )$$,
  '42501',
  'new row violates row-level security policy for table "job_descriptions"',
  'a viewer is read-only for shared workspace resources'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*)::integer from public.scans),
  0,
  'anonymous requests cannot enumerate scans'
);

select is(
  (select count(*)::integer from public.contact_messages),
  0,
  'anonymous requests cannot enumerate contact submissions'
);

select is(
  (select count(*)::integer from public.dimension_scores),
  0,
  'anonymous requests cannot enumerate normalized analysis rows'
);

select * from finish();
rollback;
