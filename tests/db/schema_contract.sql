begin;

create extension if not exists pgtap with schema extensions;
select plan(37);

select ok(
  to_regclass('public.job_descriptions') is not null,
  'job_descriptions is the canonical job table'
);

select ok(
  to_regclass('public.jobs') is null,
  'the obsolete jobs table is not exposed'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_descriptions'
      and column_name = 'content'
      and is_nullable = 'NO'
  ),
  'job descriptions store required content'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_descriptions'
      and column_name = 'description'
  ),
  'job descriptions do not retain the obsolete description column'
);

select ok(
  to_regclass('public.dimension_scores') is not null,
  'dimension scores are normalized'
);

select ok(
  to_regclass('public.keyword_matches') is not null,
  'keyword matches are normalized'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resumes'
      and column_name = 'deleted_at'
  ),
  'resumes support deletion lifecycle tracking'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scans'
      and column_name = 'resume_version_id'
  ),
  'scans retain the analyzed resume version'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scans'
      and column_name = 'job_description_id'
  ),
  'scans retain the analyzed job description'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scans'
      and column_name = 'confidence'
  ),
  'scans persist analysis confidence'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scans'
      and column_name = 'score_stale'
      and is_nullable = 'NO'
  ),
  'scans record whether an immutable result is stale'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scan_results'
      and column_name = 'canonical_document'
  ),
  'scan results can retain their exact canonical source document'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any (
        array[
          'profiles',
          'teams',
          'team_members',
          'team_invitations',
          'resumes',
          'resume_versions',
          'job_descriptions',
          'scans',
          'scan_results',
          'dimension_scores',
          'keyword_matches',
          'findings',
          'recommendations',
          'report_exports',
          'report_shares',
          'comments',
          'subscriptions',
          'notification_preferences',
          'privacy_settings',
          'quota_ledger',
          'rate_limit_buckets',
          'contact_messages',
          'newsletter_subscriptions'
        ]
      )
      and not c.relrowsecurity
  ),
  0,
  'RLS is enabled on every exposed public table'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('dimension_scores', 'keyword_matches')
      and cmd <> 'SELECT'
  ),
  0,
  'normalized analyzer output has no direct client write policy'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'findings'
      and column_name = 'why_it_matters'
  ),
  'findings expose core evidence fields outside JSON payloads'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recommendations'
      and column_name = 'original_text'
  ),
  'recommendations expose original and proposed copy fields'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'report_shares'
      and policyname = 'shares_insert_owner'
      and with_check like '%can_edit_scan%'
  ),
  'external share creation requires scan edit permission'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.apply_recommendation_version(uuid,text,text,text,text)',
    'EXECUTE'
  ),
  'authenticated users can invoke the guarded recommendation transaction'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.apply_recommendation_version(uuid,text,text,text,text)',
    'EXECUTE'
  ),
  'anonymous users cannot invoke the recommendation transaction'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('scans', 'scan_results')
      and cmd in ('INSERT', 'UPDATE')
  ),
  0,
  'analyzer-owned scan tables expose no browser write policy'
);

select ok(
  not has_table_privilege('authenticated', 'public.scans', 'INSERT'),
  'authenticated clients cannot insert analyzer-owned scans'
);

select ok(
  not has_table_privilege('authenticated', 'public.scans', 'UPDATE'),
  'authenticated clients cannot update analyzer-owned scans'
);

select ok(
  not has_table_privilege('authenticated', 'public.scan_results', 'INSERT'),
  'authenticated clients cannot insert canonical scan results'
);

select ok(
  not has_table_privilege('authenticated', 'public.scan_results', 'UPDATE'),
  'authenticated clients cannot update canonical scan results'
);

select ok(
  has_table_privilege('service_role', 'public.scans', 'INSERT')
  and has_table_privilege('service_role', 'public.scans', 'UPDATE')
  and has_table_privilege('service_role', 'public.scan_results', 'INSERT')
  and has_table_privilege('service_role', 'public.scan_results', 'UPDATE'),
  'the service role retains the analyzer persistence path'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.release_scan_quota(uuid)',
    'EXECUTE'
  ),
  'authenticated clients cannot release reserved quota'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.release_scan_quota(uuid)',
    'EXECUTE'
  ),
  'anonymous clients cannot release reserved quota'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.release_scan_quota(uuid)',
    'EXECUTE'
  ),
  'the service role can release reserved quota after failed analysis'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.reserve_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ),
  'authenticated clients cannot choose arbitrary rate-limit buckets'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.reserve_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ),
  'anonymous clients cannot choose arbitrary rate-limit buckets'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.reserve_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ),
  'the service role retains the rate-limit reservation path'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'comments_insert_team'
      and with_check like '%can_contribute_team%'
  ),
  'comment creation requires contributor permission rather than view access'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd <> 'SELECT'
      and (
        coalesce(qual, '') like '%resumes%'
        or coalesce(with_check, '') like '%resumes%'
        or coalesce(qual, '') like '%reports%'
        or coalesce(with_check, '') like '%reports%'
      )
  ),
  0,
  'private resume and report object mutation is service-role-only'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.scans'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%deterministic%'
  ),
  'scans accept deterministic analysis mode explicitly'
);

select ok(
  to_regprocedure(
    'public.accept_team_invitation(text,uuid,text)'
  ) is not null,
  'team invitations expose one atomic server acceptance workflow'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.accept_team_invitation(text,uuid,text)',
    'EXECUTE'
  ),
  'the service role can accept a verified team invitation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.accept_team_invitation(text,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.accept_team_invitation(text,uuid,text)',
    'EXECUTE'
  ),
  'browser roles cannot invoke the invitation acceptance transaction'
);

select * from finish();
rollback;
