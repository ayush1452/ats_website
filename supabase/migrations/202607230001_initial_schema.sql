begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  target_role text not null default '',
  seniority text not null default '',
  industry text not null default '',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'coach', 'member', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  role text not null check (role in ('admin', 'coach', 'member', 'viewer')),
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  original_filename text check (char_length(original_filename) <= 255),
  storage_path text unique check (char_length(storage_path) <= 500),
  extracted_text text,
  current_version_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_active_idx
  on public.resumes(user_id, updated_at desc)
  where deleted_at is null;

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  name text not null check (char_length(name) between 1 and 200),
  content text not null,
  source text not null check (source in ('upload', 'paste', 'rewrite', 'restore')),
  change_summary text not null default '',
  score numeric(5,2) check (score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (resume_id, version_number)
);

alter table public.resumes
  add constraint resumes_current_version_fk
  foreign key (current_version_id)
  references public.resume_versions(id)
  on delete set null
  deferrable initially deferred;

create table public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  company text check (char_length(company) <= 200),
  content text not null check (char_length(content) between 1 and 200_000),
  source_url text check (char_length(source_url) <= 2_000),
  detected_seniority text check (char_length(detected_seniority) <= 80),
  detected_industry text check (char_length(detected_industry) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_descriptions_user_updated_idx
  on public.job_descriptions(user_id, updated_at desc);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  job_description_id uuid references public.job_descriptions(id) on delete set null,
  target_role text not null default '',
  company text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'complete', 'failed')),
  overall_score numeric(5,2) check (overall_score between 0 and 100),
  role_match_score numeric(5,2) check (role_match_score between 0 and 100),
  ats_parse_score numeric(5,2) check (ats_parse_score between 0 and 100),
  confidence numeric(4,3) check (confidence between 0 and 1),
  score_stale boolean not null default false,
  analysis_mode text not null default 'demo' check (
    analysis_mode in ('demo', 'deterministic', 'hybrid')
  ),
  analyzer_version text not null default '1.0.0',
  schema_version integer not null default 1 check (schema_version > 0),
  weight_snapshot jsonb not null default '{}'::jsonb,
  idempotency_key text check (char_length(idempotency_key) <= 128),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index scans_user_idempotency_key_idx
  on public.scans(user_id, idempotency_key)
  where idempotency_key is not null;

create index scans_user_created_idx
  on public.scans(user_id, created_at desc);

create index scans_team_created_idx
  on public.scans(team_id, created_at desc)
  where team_id is not null;

create table public.scan_results (
  scan_id uuid primary key references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result jsonb not null,
  canonical_document jsonb check (
    canonical_document is null
    or jsonb_typeof(canonical_document) = 'object'
  ),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dimension_scores (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  dimension_key text not null check (
    char_length(dimension_key) between 1 and 80
    and dimension_key ~ '^[a-z0-9][a-z0-9_-]*$'
  ),
  label text not null check (char_length(label) between 1 and 120),
  score numeric(5,2) not null check (score between 0 and 100),
  explanation text not null check (char_length(explanation) between 1 and 2_000),
  created_at timestamptz not null default now(),
  unique (scan_id, dimension_key)
);

create index dimension_scores_scan_score_idx
  on public.dimension_scores(scan_id, score);

create table public.keyword_matches (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  keyword text not null check (char_length(keyword) between 1 and 160),
  normalized_keyword text not null check (
    char_length(normalized_keyword) between 1 and 160
    and normalized_keyword = lower(btrim(normalized_keyword))
  ),
  status text not null check (
    status in (
      'strong',
      'matched',
      'partial',
      'related',
      'missing',
      'uncertain',
      'overused'
    )
  ),
  keyword_group text not null check (char_length(keyword_group) between 1 and 120),
  requirement_type text not null check (
    requirement_type in ('must-have', 'preferred', 'context')
  ),
  importance numeric(4,2) not null check (importance between 0 and 10),
  resume_frequency integer not null check (resume_frequency >= 0),
  job_frequency integer not null check (job_frequency >= 0),
  score_impact numeric(5,2) not null check (score_impact between 0 and 100),
  recommended_section text check (char_length(recommended_section) <= 120),
  evidence text check (char_length(evidence) <= 2_000),
  created_at timestamptz not null default now(),
  unique (scan_id, normalized_keyword)
);

create index keyword_matches_scan_status_idx
  on public.keyword_matches(scan_id, status);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  category text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'passed')),
  title text not null check (char_length(title) between 1 and 240),
  description text not null check (char_length(description) between 1 and 4_000),
  why_it_matters text not null check (char_length(why_it_matters) between 1 and 4_000),
  recommendation text not null check (char_length(recommendation) between 1 and 4_000),
  source_text text check (char_length(source_text) <= 20_000),
  source_section text check (char_length(source_section) <= 120),
  source_start integer check (source_start >= 0),
  source_end integer check (source_end >= 0),
  score_impact numeric(5,2) not null check (score_impact between 0 and 100),
  effort text not null check (effort in ('low', 'medium', 'high')),
  requires_verification boolean not null default false,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_start is null and source_end is null)
    or (
      source_start is not null
      and source_end is not null
      and source_end >= source_start
    )
  ),
  unique (scan_id, external_id)
);

create index findings_scan_status_idx
  on public.findings(scan_id, status, severity);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  finding_id uuid references public.findings(id) on delete set null,
  title text not null check (char_length(title) between 1 and 240),
  original_text text not null check (char_length(original_text) <= 20_000),
  suggested_text text not null check (char_length(suggested_text) <= 20_000),
  rationale text not null check (char_length(rationale) between 1 and 4_000),
  changes jsonb not null default '[]'::jsonb check (jsonb_typeof(changes) = 'array'),
  requires_verification boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  created_version_id uuid references public.resume_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, external_id)
);

create index recommendations_scan_status_idx
  on public.recommendations(scan_id, status);

create table public.report_exports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  format text not null default 'pdf' check (format in ('pdf', 'json')),
  storage_path text unique,
  created_at timestamptz not null default now()
);

create table public.report_shares (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index report_shares_active_token_idx
  on public.report_shares(token_hash, expires_at)
  where revoked_at is null;

create index report_shares_team_created_idx
  on public.report_shares(team_id, created_at desc)
  where team_id is not null;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5_000),
  finding_external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(scan_id, resume_id) = 1)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'career', 'teams')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  scans_used integer not null default 0 check (scans_used >= 0),
  scan_limit integer not null default 3 check (scan_limit > 0),
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scan_complete boolean not null default true,
  product_updates boolean not null default false,
  team_activity boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  retention_days integer not null default 365 check (retention_days between 1 and 3650),
  auto_delete_uploads boolean not null default false,
  analytics_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quota_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid not null,
  units integer not null default 1 check (units > 0),
  created_at timestamptz not null default now(),
  unique (user_id, scan_id)
);

create table public.rate_limit_buckets (
  namespace text not null,
  key_hash text not null check (char_length(key_hash) = 64),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (namespace, key_hash)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  company text check (char_length(company) <= 160),
  topic text check (char_length(topic) <= 120),
  message text not null check (char_length(message) between 20 and 5_000),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.can_view_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
        )
      )
  );
$$;

create or replace function public.can_edit_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
            and tm.role in ('owner', 'admin', 'coach')
        )
      )
  );
$$;

create or replace function public.can_contribute_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
            and tm.role in ('owner', 'admin', 'coach', 'member')
        )
      )
  );
$$;

create or replace function public.can_admin_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and (
        t.owner_id = auth.uid()
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = t.id
            and tm.user_id = auth.uid()
            and tm.status = 'active'
            and tm.role in ('owner', 'admin')
        )
      )
  );
$$;

create or replace function public.can_view_resume(p_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.resumes r
    where r.id = p_resume_id
      and (r.user_id = auth.uid() or (r.team_id is not null and public.can_view_team(r.team_id)))
  );
$$;

create or replace function public.can_edit_resume(p_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.resumes r
    where r.id = p_resume_id
      and (r.user_id = auth.uid() or (r.team_id is not null and public.can_edit_team(r.team_id)))
  );
$$;

create or replace function public.can_view_scan(p_scan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.scans s
    where s.id = p_scan_id
      and (s.user_id = auth.uid() or (s.team_id is not null and public.can_view_team(s.team_id)))
  );
$$;

create or replace function public.can_edit_scan(p_scan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.scans s
    where s.id = p_scan_id
      and (s.user_id = auth.uid() or (s.team_id is not null and public.can_edit_team(s.team_id)))
  );
$$;

revoke all on function public.can_view_team(uuid) from public;
revoke all on function public.can_edit_team(uuid) from public;
revoke all on function public.can_contribute_team(uuid) from public;
revoke all on function public.can_admin_team(uuid) from public;
revoke all on function public.can_view_resume(uuid) from public;
revoke all on function public.can_edit_resume(uuid) from public;
revoke all on function public.can_view_scan(uuid) from public;
revoke all on function public.can_edit_scan(uuid) from public;
grant execute on function public.can_view_team(uuid) to anon, authenticated;
grant execute on function public.can_edit_team(uuid) to anon, authenticated;
grant execute on function public.can_contribute_team(uuid) to anon, authenticated;
grant execute on function public.can_admin_team(uuid) to anon, authenticated;
grant execute on function public.can_view_resume(uuid) to anon, authenticated;
grant execute on function public.can_edit_resume(uuid) to anon, authenticated;
grant execute on function public.can_view_scan(uuid) to anon, authenticated;
grant execute on function public.can_edit_scan(uuid) to anon, authenticated;

create or replace function public.protect_resource_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'resource ownership cannot be changed';
  end if;
  if to_jsonb(new) ? 'team_id' and (to_jsonb(new)->>'team_id') is distinct from (to_jsonb(old)->>'team_id') then
    raise exception 'resource team cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.sync_resume_version_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  select r.user_id
  into v_user_id
  from public.resumes r
  where r.id = new.resume_id;

  if not found then
    raise exception 'resume does not exist';
  end if;

  new.user_id := v_user_id;
  return new;
end;
$$;

create or replace function public.sync_scan_child_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  select s.user_id
  into v_user_id
  from public.scans s
  where s.id = new.scan_id;

  if not found then
    raise exception 'scan does not exist';
  end if;

  new.user_id := v_user_id;
  return new;
end;
$$;

create or replace function public.sync_scan_resource_team()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team_id uuid;
begin
  select s.team_id
  into v_team_id
  from public.scans s
  where s.id = new.scan_id;

  if not found then
    raise exception 'scan does not exist';
  end if;

  new.team_id := v_team_id;
  return new;
end;
$$;

create or replace function public.sync_comment_team()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.scan_id is not null then
    select s.team_id
    into new.team_id
    from public.scans s
    where s.id = new.scan_id;
  else
    select r.team_id
    into new.team_id
    from public.resumes r
    where r.id = new.resume_id;
  end if;

  if not found then
    raise exception 'comment parent does not exist';
  end if;
  return new;
end;
$$;

create or replace function public.protect_comment_target()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.scan_id is distinct from old.scan_id
     or new.resume_id is distinct from old.resume_id then
    raise exception 'comment target cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.validate_scan_references()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.resume_id is not null and not exists (
    select 1
    from public.resumes r
    where r.id = new.resume_id
      and (
        r.user_id = new.user_id
        or (
          new.team_id is not null
          and r.team_id = new.team_id
        )
      )
  ) then
    raise exception 'resume is outside the scan scope';
  end if;

  if new.resume_version_id is not null and not exists (
    select 1
    from public.resume_versions rv
    join public.resumes r on r.id = rv.resume_id
    where rv.id = new.resume_version_id
      and new.resume_id = rv.resume_id
      and (
        r.user_id = new.user_id
        or (
          new.team_id is not null
          and r.team_id = new.team_id
        )
      )
  ) then
    raise exception 'resume version is outside the scan scope';
  end if;

  if new.job_description_id is not null and not exists (
    select 1
    from public.job_descriptions j
    where j.id = new.job_description_id
      and (
        j.user_id = new.user_id
        or (
          new.team_id is not null
          and j.team_id = new.team_id
        )
      )
  ) then
    raise exception 'job description is outside the scan scope';
  end if;

  return new;
end;
$$;

create or replace function public.sync_normalized_analysis()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.dimension_scores
  where scan_id = new.scan_id;

  insert into public.dimension_scores (
    scan_id,
    dimension_key,
    label,
    score,
    explanation
  )
  select distinct on (entry.value->>'key')
    new.scan_id,
    entry.value->>'key',
    entry.value->>'label',
    (entry.value->>'score')::numeric,
    entry.value->>'explanation'
  from jsonb_array_elements(
    case
      when jsonb_typeof(new.result->'dimensionScores') = 'array'
        then new.result->'dimensionScores'
      else '[]'::jsonb
    end
  ) as entry(value)
  order by entry.value->>'key';

  delete from public.keyword_matches
  where scan_id = new.scan_id;

  insert into public.keyword_matches (
    scan_id,
    keyword,
    normalized_keyword,
    status,
    keyword_group,
    requirement_type,
    importance,
    resume_frequency,
    job_frequency,
    score_impact,
    recommended_section,
    evidence
  )
  select distinct on (lower(btrim(entry.value->>'keyword')))
    new.scan_id,
    entry.value->>'keyword',
    lower(btrim(entry.value->>'keyword')),
    entry.value->>'status',
    entry.value->>'group',
    entry.value->>'requirementType',
    (entry.value->>'importance')::numeric,
    (entry.value->>'resumeFrequency')::integer,
    (entry.value->>'jobFrequency')::integer,
    (entry.value->>'scoreImpact')::numeric,
    nullif(entry.value->>'recommendedSection', ''),
    nullif(entry.value->>'evidence', '')
  from jsonb_array_elements(
    case
      when jsonb_typeof(new.result->'keywords') = 'array'
        then new.result->'keywords'
      else '[]'::jsonb
    end
  ) as entry(value)
  order by lower(btrim(entry.value->>'keyword'));

  insert into public.findings (
    scan_id,
    user_id,
    external_id,
    category,
    severity,
    title,
    description,
    why_it_matters,
    recommendation,
    source_text,
    source_section,
    source_start,
    source_end,
    score_impact,
    effort,
    requires_verification,
    status,
    payload
  )
  select
    new.scan_id,
    new.user_id,
    entry.value->>'id',
    entry.value->>'category',
    entry.value->>'severity',
    entry.value->>'title',
    entry.value->>'description',
    entry.value->>'whyItMatters',
    entry.value->>'recommendation',
    nullif(entry.value->>'sourceText', ''),
    nullif(entry.value->>'sourceSection', ''),
    (entry.value->>'sourceStart')::integer,
    (entry.value->>'sourceEnd')::integer,
    (entry.value->>'scoreImpact')::numeric,
    entry.value->>'effort',
    coalesce((entry.value->>'requiresVerification')::boolean, false),
    coalesce(entry.value->>'status', 'open'),
    entry.value
  from jsonb_array_elements(
    case
      when jsonb_typeof(new.result->'findings') = 'array'
        then new.result->'findings'
      else '[]'::jsonb
    end
  ) as entry(value)
  on conflict (scan_id, external_id) do nothing;

  insert into public.recommendations (
    scan_id,
    user_id,
    external_id,
    finding_id,
    title,
    original_text,
    suggested_text,
    rationale,
    changes,
    requires_verification,
    status,
    payload
  )
  select
    new.scan_id,
    new.user_id,
    entry.value->>'id',
    (
      select f.id
      from public.findings f
      where f.scan_id = new.scan_id
        and f.external_id = entry.value->>'findingId'
      limit 1
    ),
    entry.value->>'title',
    coalesce(entry.value->>'originalText', ''),
    coalesce(entry.value->>'suggestedText', ''),
    entry.value->>'rationale',
    coalesce(entry.value->'changes', '[]'::jsonb),
    coalesce((entry.value->>'requiresVerification')::boolean, true),
    coalesce(entry.value->>'status', 'pending'),
    entry.value
  from jsonb_array_elements(
    case
      when jsonb_typeof(new.result->'recommendations') = 'array'
        then new.result->'recommendations'
      else '[]'::jsonb
    end
  ) as entry(value)
  on conflict (scan_id, external_id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_finding_analysis()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if (
    to_jsonb(new) - array['status', 'updated_at']
  ) is distinct from (
    to_jsonb(old) - array['status', 'updated_at']
  ) then
    raise exception 'finding analysis fields are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.protect_recommendation_analysis()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if (
    to_jsonb(new) - array['status', 'created_version_id', 'updated_at']
  ) is distinct from (
    to_jsonb(old) - array['status', 'created_version_id', 'updated_at']
  ) then
    raise exception 'recommendation analysis fields are immutable';
  end if;
  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'recommendation status is terminal';
  end if;
  if new.status = 'applied' and new.created_version_id is null then
    raise exception 'an applied recommendation requires a resume version';
  end if;
  if new.status = 'applied' and not exists (
    select 1
    from public.scans s
    join public.resume_versions rv
      on rv.resume_id = s.resume_id
    where s.id = new.scan_id
      and rv.id = new.created_version_id
  ) then
    raise exception 'applied version is outside the scan resume';
  end if;
  if new.status = 'applied'
     and current_setting(
       'resumepilot.applying_recommendation',
       true
     ) is distinct from new.id::text then
    raise exception 'applied recommendations require the atomic workflow';
  end if;
  return new;
end;
$$;

create trigger resume_versions_sync_owner before insert on public.resume_versions
for each row execute function public.sync_resume_version_owner();
create trigger scan_results_sync_owner before insert on public.scan_results
for each row execute function public.sync_scan_child_owner();
create trigger findings_sync_owner before insert on public.findings
for each row execute function public.sync_scan_child_owner();
create trigger recommendations_sync_owner before insert on public.recommendations
for each row execute function public.sync_scan_child_owner();
create trigger report_exports_sync_team before insert or update on public.report_exports
for each row execute function public.sync_scan_resource_team();
create trigger report_shares_sync_team before insert or update on public.report_shares
for each row execute function public.sync_scan_resource_team();
create trigger comments_sync_team before insert or update on public.comments
for each row execute function public.sync_comment_team();
create trigger scans_validate_references before insert or update on public.scans
for each row execute function public.validate_scan_references();
create trigger scan_results_sync_normalized_analysis
after insert or update of result on public.scan_results
for each row execute function public.sync_normalized_analysis();

create trigger resumes_protect_ownership before update on public.resumes
for each row execute function public.protect_resource_ownership();
create trigger job_descriptions_protect_ownership before update on public.job_descriptions
for each row execute function public.protect_resource_ownership();
create trigger scans_protect_ownership before update on public.scans
for each row execute function public.protect_resource_ownership();
create trigger scan_results_protect_ownership before update on public.scan_results
for each row execute function public.protect_resource_ownership();
create trigger findings_protect_ownership before update on public.findings
for each row execute function public.protect_resource_ownership();
create trigger recommendations_protect_ownership before update on public.recommendations
for each row execute function public.protect_resource_ownership();
create trigger findings_protect_analysis before update on public.findings
for each row execute function public.protect_finding_analysis();
create trigger recommendations_protect_analysis before update on public.recommendations
for each row execute function public.protect_recommendation_analysis();
create trigger report_exports_protect_ownership before update on public.report_exports
for each row execute function public.protect_resource_ownership();
create trigger report_shares_protect_ownership before update on public.report_shares
for each row execute function public.protect_resource_ownership();
create trigger comments_protect_ownership before update on public.comments
for each row execute function public.protect_resource_ownership();
create trigger comments_protect_target before update on public.comments
for each row execute function public.protect_comment_target();

create or replace function public.protect_team_owner()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'team ownership cannot be changed directly';
  end if;
  return new;
end;
$$;

create trigger teams_protect_owner before update on public.teams
for each row execute function public.protect_team_owner();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  insert into public.privacy_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.reserve_scan_quota(p_scan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
begin
  if v_user_id is null then
    return false;
  end if;

  if exists (
    select 1 from public.quota_ledger
    where user_id = v_user_id and scan_id = p_scan_id
  ) then
    return true;
  end if;

  insert into public.subscriptions (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_subscription
  from public.subscriptions
  where user_id = v_user_id
  for update;

  if exists (
    select 1 from public.quota_ledger
    where user_id = v_user_id and scan_id = p_scan_id
  ) then
    return true;
  end if;

  if now() >= v_subscription.current_period_end then
    update public.subscriptions
    set scans_used = 0,
        current_period_start = now(),
        current_period_end = now() + interval '1 month',
        updated_at = now()
    where user_id = v_user_id
    returning * into v_subscription;
  end if;

  if v_subscription.scans_used >= v_subscription.scan_limit then
    return false;
  end if;

  insert into public.quota_ledger (user_id, scan_id)
  values (v_user_id, p_scan_id)
  on conflict (user_id, scan_id) do nothing;

  update public.subscriptions
  set scans_used = scans_used + 1,
      updated_at = now()
  where user_id = v_user_id;
  return true;
end;
$$;

revoke all on function public.reserve_scan_quota(uuid) from public;
grant execute on function public.reserve_scan_quota(uuid) to authenticated;

create or replace function public.release_scan_quota(p_scan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_deleted integer;
begin
  select q.user_id
  into v_user_id
  from public.quota_ledger q
  where q.scan_id = p_scan_id
  order by q.id
  limit 1
  for update;

  if not found then
    return false;
  end if;

  delete from public.quota_ledger
  where user_id = v_user_id and scan_id = p_scan_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 1 then
    update public.subscriptions
    set scans_used = greatest(0, scans_used - 1),
        updated_at = now()
    where user_id = v_user_id;
  end if;
  return v_deleted = 1;
end;
$$;

revoke all on function public.release_scan_quota(uuid) from public;
revoke execute on function public.release_scan_quota(uuid) from anon, authenticated;
grant execute on function public.release_scan_quota(uuid) to service_role;

create or replace function public.apply_recommendation_version(
  p_scan_id uuid,
  p_recommendation_external_id text,
  p_original_text text,
  p_suggested_text text,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_resume_id uuid;
  v_recommendation public.recommendations%rowtype;
  v_latest_version public.resume_versions%rowtype;
  v_new_version_id uuid := gen_random_uuid();
  v_new_content text;
  v_source_position integer;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;
  if p_recommendation_external_id is null
     or p_original_text is null
     or p_suggested_text is null
     or p_title is null
     or char_length(p_recommendation_external_id) not between 1 and 128
     or char_length(p_original_text) not between 1 and 20_000
     or char_length(p_suggested_text) not between 1 and 20_000
     or char_length(p_title) not between 1 and 240 then
    raise exception 'recommendation input is invalid';
  end if;

  select s.resume_id
  into v_resume_id
  from public.scans s
  where s.id = p_scan_id
    and public.can_edit_scan(s.id)
  for update;

  if not found or v_resume_id is null then
    raise exception 'scan has no editable resume';
  end if;

  perform 1
  from public.resumes r
  where r.id = v_resume_id
    and r.deleted_at is null
    and public.can_edit_resume(r.id)
  for update;

  if not found then
    raise exception 'resume is not editable';
  end if;

  select r.*
  into v_recommendation
  from public.recommendations r
  where r.scan_id = p_scan_id
    and r.external_id = p_recommendation_external_id
  for update;

  if not found then
    raise exception 'recommendation was not found';
  end if;

  if v_recommendation.original_text is distinct from p_original_text
     or v_recommendation.suggested_text is distinct from p_suggested_text
     or v_recommendation.title is distinct from p_title then
    raise exception 'recommendation content does not match';
  end if;

  if v_recommendation.status = 'applied'
     and v_recommendation.created_version_id is not null then
    return v_recommendation.created_version_id;
  end if;
  if v_recommendation.status <> 'pending' then
    raise exception 'recommendation is no longer pending';
  end if;

  select rv.*
  into v_latest_version
  from public.resume_versions rv
  where rv.resume_id = v_resume_id
  order by rv.version_number desc
  limit 1
  for update;

  if not found then
    raise exception 'resume has no source version';
  end if;

  v_source_position := strpos(v_latest_version.content, p_original_text);
  if v_source_position = 0 then
    raise exception 'original recommendation text is stale';
  end if;

  v_new_content := overlay(
    v_latest_version.content
    placing p_suggested_text
    from v_source_position
    for char_length(p_original_text)
  );

  insert into public.resume_versions (
    id,
    resume_id,
    user_id,
    version_number,
    name,
    content,
    source,
    change_summary,
    score
  )
  values (
    v_new_version_id,
    v_resume_id,
    auth.uid(),
    v_latest_version.version_number + 1,
    left(p_title, 200),
    v_new_content,
    'rewrite',
    'Applied recommendation: ' || p_title,
    null
  );

  update public.resumes
  set current_version_id = v_new_version_id
  where id = v_resume_id;

  update public.scans
  set score_stale = true
  where id = p_scan_id;

  perform set_config(
    'resumepilot.applying_recommendation',
    v_recommendation.id::text,
    true
  );
  update public.recommendations
  set status = 'applied',
      created_version_id = v_new_version_id
  where id = v_recommendation.id;
  perform set_config(
    'resumepilot.applying_recommendation',
    '',
    true
  );

  return v_new_version_id;
end;
$$;

revoke all on function public.apply_recommendation_version(
  uuid,
  text,
  text,
  text,
  text
) from public;
grant execute on function public.apply_recommendation_version(
  uuid,
  text,
  text,
  text,
  text
) to authenticated;

create or replace function public.reserve_rate_limit(
  p_namespace text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bucket public.rate_limit_buckets%rowtype;
begin
  if char_length(p_key_hash) <> 64
     or p_limit < 1
     or p_window_seconds < 1
     or char_length(p_namespace) not between 1 and 80 then
    return false;
  end if;

  insert into public.rate_limit_buckets(namespace, key_hash, window_started_at, request_count)
  values (p_namespace, p_key_hash, now(), 1)
  on conflict (namespace, key_hash) do nothing;

  select * into v_bucket
  from public.rate_limit_buckets
  where namespace = p_namespace and key_hash = p_key_hash
  for update;

  if v_bucket.window_started_at + make_interval(secs => p_window_seconds) <= now() then
    update public.rate_limit_buckets
    set window_started_at = now(), request_count = 1
    where namespace = p_namespace and key_hash = p_key_hash;
    return true;
  end if;

  if v_bucket.request_count >= p_limit then
    return false;
  end if;

  update public.rate_limit_buckets
  set request_count = request_count + 1
  where namespace = p_namespace and key_hash = p_key_hash;
  return true;
end;
$$;

revoke all on function public.reserve_rate_limit(text, text, integer, integer) from public;
revoke execute on function public.reserve_rate_limit(text, text, integer, integer)
from anon, authenticated;
grant execute on function public.reserve_rate_limit(text, text, integer, integer)
to service_role;

create or replace function public.accept_team_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_invitation public.team_invitations%rowtype;
begin
  if char_length(p_token_hash) <> 64
     or p_user_id is null
     or p_user_email is null
     or not exists (
       select 1
       from auth.users u
       where u.id = p_user_id
         and lower(btrim(u.email)) = lower(btrim(p_user_email))
     ) then
    raise exception 'invitation is invalid or expired';
  end if;

  select *
  into v_invitation
  from public.team_invitations i
  where i.token_hash = p_token_hash
    and i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at > now()
    and lower(btrim(i.email)) = lower(btrim(p_user_email))
  for update;

  if not found then
    raise exception 'invitation is invalid or expired';
  end if;

  insert into public.team_members (
    team_id,
    user_id,
    role,
    status
  )
  values (
    v_invitation.team_id,
    p_user_id,
    v_invitation.role,
    'active'
  )
  on conflict (team_id, user_id) do update
  set role = case
        when public.team_members.role = 'owner'
          then public.team_members.role
        else excluded.role
      end,
      status = 'active',
      updated_at = now();

  update public.team_invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.team_id;
end;
$$;

revoke all on function public.accept_team_invitation(text, uuid, text)
from public;
revoke execute on function public.accept_team_invitation(text, uuid, text)
from anon, authenticated;
grant execute on function public.accept_team_invitation(text, uuid, text)
to service_role;

create or replace function public.get_shared_report(p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'result', sr.result,
    'expires_at', rs.expires_at
  )
  from public.report_shares rs
  join public.scan_results sr on sr.scan_id = rs.scan_id
  where rs.token_hash = p_token_hash
    and rs.revoked_at is null
    and rs.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_shared_report(text) from public;
grant execute on function public.get_shared_report(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.scans enable row level security;
alter table public.scan_results enable row level security;
alter table public.dimension_scores enable row level security;
alter table public.keyword_matches enable row level security;
alter table public.findings enable row level security;
alter table public.recommendations enable row level security;
alter table public.report_exports enable row level security;
alter table public.report_shares enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.quota_ledger enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscriptions enable row level security;

create policy profiles_select_self on public.profiles for select
using (id = auth.uid());
create policy profiles_insert_self on public.profiles for insert
with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

create policy teams_select_member on public.teams for select
using (public.can_view_team(id));
create policy teams_insert_owner on public.teams for insert
with check (owner_id = auth.uid());
create policy teams_update_admin on public.teams for update
using (public.can_admin_team(id)) with check (public.can_admin_team(id));
create policy teams_delete_owner on public.teams for delete
using (owner_id = auth.uid());

create policy team_members_select_member on public.team_members for select
using (public.can_view_team(team_id));
create policy team_members_insert_admin on public.team_members for insert
with check (
  public.can_admin_team(team_id)
  and (
    role <> 'owner'
    or user_id = (
      select t.owner_id
      from public.teams t
      where t.id = public.team_members.team_id
    )
  )
);
create policy team_members_update_admin on public.team_members for update
using (public.can_admin_team(team_id))
with check (
  public.can_admin_team(team_id)
  and (
    role <> 'owner'
    or user_id = (
      select t.owner_id
      from public.teams t
      where t.id = public.team_members.team_id
    )
  )
);
create policy team_members_delete_admin on public.team_members for delete
using (
  public.can_admin_team(team_id)
  and user_id <> (
    select t.owner_id
    from public.teams t
    where t.id = public.team_members.team_id
  )
);

create policy invitations_select_admin on public.team_invitations for select
using (public.can_admin_team(team_id));
create policy invitations_insert_admin on public.team_invitations for insert
with check (invited_by = auth.uid() and public.can_admin_team(team_id));
create policy invitations_update_admin on public.team_invitations for update
using (public.can_admin_team(team_id)) with check (public.can_admin_team(team_id));
create policy invitations_delete_admin on public.team_invitations for delete
using (public.can_admin_team(team_id));

create policy resumes_select_authorized on public.resumes for select
using (user_id = auth.uid() or (team_id is not null and public.can_view_team(team_id)));
create policy resumes_insert_authorized on public.resumes for insert
with check (
  user_id = auth.uid()
  and (team_id is null or public.can_contribute_team(team_id))
);
create policy resumes_update_authorized on public.resumes for update
using (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)))
with check (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)));
create policy resumes_delete_authorized on public.resumes for delete
using (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)));

create policy versions_select_parent on public.resume_versions for select
using (public.can_view_resume(resume_id));
create policy versions_insert_parent on public.resume_versions for insert
with check (public.can_edit_resume(resume_id));
create policy versions_update_none on public.resume_versions for update using (false);
create policy versions_delete_parent on public.resume_versions for delete
using (public.can_edit_resume(resume_id));

create policy job_descriptions_select_authorized on public.job_descriptions for select
using (user_id = auth.uid() or (team_id is not null and public.can_view_team(team_id)));
create policy job_descriptions_insert_authorized on public.job_descriptions for insert
with check (
  user_id = auth.uid()
  and (team_id is null or public.can_contribute_team(team_id))
);
create policy job_descriptions_update_authorized on public.job_descriptions for update
using (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)))
with check (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)));
create policy job_descriptions_delete_authorized on public.job_descriptions for delete
using (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)));

create policy scans_select_authorized on public.scans for select
using (user_id = auth.uid() or (team_id is not null and public.can_view_team(team_id)));
create policy scans_delete_authorized on public.scans for delete
using (user_id = auth.uid() or (team_id is not null and public.can_edit_team(team_id)));

create policy scan_results_select_parent on public.scan_results for select
using (public.can_view_scan(scan_id));
create policy scan_results_delete_parent on public.scan_results for delete
using (public.can_edit_scan(scan_id));

-- Scores, analyzer metadata, and canonical documents are trusted server output.
-- Browser roles may read or delete authorized rows, but only the service role
-- may create or mutate analyzer-owned records.
revoke insert, update on table public.scans from anon, authenticated;
revoke insert, update on table public.scan_results from anon, authenticated;
grant insert, update on table public.scans to service_role;
grant insert, update on table public.scan_results to service_role;

create policy dimension_scores_select_parent on public.dimension_scores for select
using (public.can_view_scan(scan_id));

create policy keyword_matches_select_parent on public.keyword_matches for select
using (public.can_view_scan(scan_id));

create policy findings_select_parent on public.findings for select
using (public.can_view_scan(scan_id));
create policy findings_update_parent on public.findings for update
using (public.can_edit_scan(scan_id)) with check (public.can_edit_scan(scan_id));

create policy recommendations_select_parent on public.recommendations for select
using (public.can_view_scan(scan_id));
create policy recommendations_update_parent on public.recommendations for update
using (public.can_edit_scan(scan_id)) with check (public.can_edit_scan(scan_id));

create policy exports_select_parent on public.report_exports for select
using (public.can_view_scan(scan_id));
create policy exports_insert_parent on public.report_exports for insert
with check (user_id = auth.uid() and public.can_edit_scan(scan_id));
create policy exports_delete_parent on public.report_exports for delete
using (public.can_edit_scan(scan_id));

create policy shares_select_owner on public.report_shares for select
using (
  user_id = auth.uid()
  or (team_id is not null and public.can_admin_team(team_id))
);
create policy shares_insert_owner on public.report_shares for insert
with check (user_id = auth.uid() and public.can_edit_scan(scan_id));
create policy shares_update_owner on public.report_shares for update
using (
  user_id = auth.uid()
  or (team_id is not null and public.can_admin_team(team_id))
)
with check (
  user_id = auth.uid()
  or (team_id is not null and public.can_admin_team(team_id))
);
create policy shares_delete_owner on public.report_shares for delete
using (
  user_id = auth.uid()
  or (team_id is not null and public.can_admin_team(team_id))
);

create policy comments_select_team on public.comments for select
using (
  user_id = auth.uid()
  or (scan_id is not null and public.can_view_scan(scan_id))
  or (resume_id is not null and public.can_view_resume(resume_id))
);
create policy comments_insert_team on public.comments for insert
with check (
  user_id = auth.uid()
  and (
    (
      scan_id is not null
      and exists (
        select 1
        from public.scans s
        where s.id = public.comments.scan_id
          and (
            s.user_id = auth.uid()
            or (
              s.team_id is not null
              and public.can_contribute_team(s.team_id)
            )
          )
      )
    )
    or (
      resume_id is not null
      and exists (
        select 1
        from public.resumes r
        where r.id = public.comments.resume_id
          and (
            r.user_id = auth.uid()
            or (
              r.team_id is not null
              and public.can_contribute_team(r.team_id)
            )
          )
      )
    )
  )
);
create policy comments_update_own on public.comments for update
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comments_delete_own on public.comments for delete
using (user_id = auth.uid());

create policy subscriptions_select_self on public.subscriptions for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.teams t
    where t.owner_id = public.subscriptions.user_id
      and public.can_admin_team(t.id)
  )
);
create policy notifications_all_self on public.notification_preferences for all
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy privacy_all_self on public.privacy_settings for all
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy quota_select_self on public.quota_ledger for select
using (user_id = auth.uid());

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger teams_updated_at before update on public.teams
for each row execute function public.set_updated_at();
create trigger team_members_updated_at before update on public.team_members
for each row execute function public.set_updated_at();
create trigger resumes_updated_at before update on public.resumes
for each row execute function public.set_updated_at();
create trigger job_descriptions_updated_at before update on public.job_descriptions
for each row execute function public.set_updated_at();
create trigger scans_updated_at before update on public.scans
for each row execute function public.set_updated_at();
create trigger scan_results_updated_at before update on public.scan_results
for each row execute function public.set_updated_at();
create trigger findings_updated_at before update on public.findings
for each row execute function public.set_updated_at();
create trigger recommendations_updated_at before update on public.recommendations
for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
create trigger notifications_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();
create trigger privacy_updated_at before update on public.privacy_settings
for each row execute function public.set_updated_at();
create trigger newsletter_updated_at before update on public.newsletter_subscriptions
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  8388608,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 16777216, array['application/pdf', 'application/json'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy resume_objects_select on storage.objects for select
using (
  bucket_id = 'resumes'
  and exists (
    select 1 from public.resumes r
    where r.storage_path = name and public.can_view_resume(r.id)
  )
);

create policy report_objects_select on storage.objects for select
using (
  bucket_id = 'reports'
  and exists (
    select 1 from public.report_exports e
    where e.storage_path = name and public.can_view_scan(e.scan_id)
  )
);

-- Object creation, replacement, and cleanup run through server-only storage
-- clients. No browser mutation policy exists for either private bucket.

commit;
