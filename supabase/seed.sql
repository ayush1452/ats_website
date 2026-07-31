-- Deterministic local-only demo account.
-- Email: alex.morgan@example.test
-- Password: ResumePilotDemo!2026

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
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'alex.morgan@example.test',
  extensions.crypt('ResumePilotDemo!2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Alex Morgan"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
values (
  'aaaaaaaa-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'alex.morgan@example.test',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"alex.morgan@example.test"}'::jsonb,
  'email',
  now(),
  now()
)
on conflict (provider_id, provider) do nothing;

update public.profiles
set display_name = 'Alex Morgan',
    target_role = 'Senior Product Manager — Platform & Growth',
    seniority = 'Senior',
    industry = 'Fintech / B2B SaaS',
    onboarding_completed = true
where id = '11111111-1111-4111-8111-111111111111';

insert into public.teams (id, owner_id, name, slug)
values (
  '77777777-7777-4777-8777-777777777777',
  '11111111-1111-4111-8111-111111111111',
  'Alex Morgan Career Workspace',
  'alex-morgan-career-workspace'
)
on conflict (id) do nothing;

insert into public.team_members (id, team_id, user_id, role, status)
values (
  '88888888-8888-4888-8888-888888888888',
  '77777777-7777-4777-8777-777777777777',
  '11111111-1111-4111-8111-111111111111',
  'owner',
  'active'
)
on conflict (team_id, user_id) do nothing;

insert into public.resumes (
  id,
  user_id,
  name,
  original_filename,
  extracted_text
)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Alex Morgan — Platform & Growth',
  'alex-morgan-resume.pdf',
  $resume$ALEX MORGAN
alex.morgan@example.com · +1 (555) 014-0198 · Austin, TX

SUMMARY
Senior product manager with 6 years of experience building platform and growth products for fintech and B2B SaaS teams.

EXPERIENCE
Senior Product Manager | Northstar Ledger | Jan 2022 – Present
• Led the product roadmap for API onboarding, increasing activated accounts by 24% in two quarters.
• Established quarterly OKRs with cross-functional engineering, sales, and customer-success leaders.
• Designed A/B testing and user research programs that improved trial-to-paid conversion by 11%.
• Responsible for coordinating launch planning with sales and marketing stakeholders.
• Used Mixpanel and SQL analysis to prioritize friction points across the customer journey.

Product Manager | Harborline Systems | Mar 2019 – Dec 2021
• Managed Agile discovery and delivery for a B2B SaaS workflow used by 18,000 operations users.
• Helped the team build partner API capabilities and maintained delivery plans in Jira.
• Facilitated customer interviews and translated findings into Figma prototypes.

SKILLS
Product Roadmap | Agile | OKRs | Stakeholders
Cross-functional Leadership | B2B SaaS | A/B Testing | User Research
API Products | Data-driven Decisions | Jira | Figma | Mixpanel | Python | SQL

EDUCATION
B.S. Business Analytics, Western Lakes University, 2018

CERTIFICATIONS
Certified Scrum Product Owner (CSPO), 2021$resume$
)
on conflict (id) do nothing;

insert into public.resume_versions (
  id,
  resume_id,
  user_id,
  version_number,
  name,
  content,
  source,
  change_summary,
  score,
  created_at
)
select
  '33333333-3333-4333-8333-333333333331',
  r.id,
  r.user_id,
  1,
  'Original upload',
  replace(
    replace(
      r.extracted_text,
      'Led the product roadmap for API onboarding, increasing activated accounts by 24% in two quarters.',
      'Responsible for the API onboarding product roadmap.'
    ),
    'Designed A/B testing and user research programs that improved trial-to-paid conversion by 11%.',
    'Worked on experiments and customer research.'
  ),
  'upload',
  'Initial uploaded resume',
  61,
  '2026-06-28T09:15:00Z'::timestamptz
from public.resumes r
where r.id = '22222222-2222-4222-8222-222222222222'
on conflict (id) do nothing;

insert into public.resume_versions (
  id,
  resume_id,
  user_id,
  version_number,
  name,
  content,
  source,
  change_summary,
  score,
  created_at
)
select
  '33333333-3333-4333-8333-333333333332',
  r.id,
  r.user_id,
  2,
  'Platform & growth revision',
  r.extracted_text,
  'rewrite',
  'Clarified product scope and added two verified outcomes',
  73,
  '2026-07-18T14:12:00Z'::timestamptz
from public.resumes r
where r.id = '22222222-2222-4222-8222-222222222222'
on conflict (id) do nothing;

update public.resumes
set current_version_id = '33333333-3333-4333-8333-333333333332'
where id = '22222222-2222-4222-8222-222222222222';

insert into public.job_descriptions (
  id,
  user_id,
  title,
  company,
  content,
  detected_seniority,
  detected_industry
)
values (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  'Senior Product Manager — Platform & Growth',
  'Clearwater Financial',
  'Lead a fintech platform roadmap for B2B SaaS customers. Partner on GTM strategy, API products, revenue KPIs, OKRs, user research, A/B testing, SQL, Tableau, Mixpanel, Jira, Figma, and competitive analysis.',
  'Senior',
  'Fintech / B2B SaaS'
)
on conflict (id) do nothing;

insert into public.scans (
  id,
  user_id,
  resume_id,
  resume_version_id,
  job_description_id,
  target_role,
  company,
  status,
  overall_score,
  role_match_score,
  ats_parse_score,
  confidence,
  analysis_mode,
  analyzer_version,
  schema_version,
  weight_snapshot,
  completed_at,
  created_at
)
values (
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333332',
  '55555555-5555-4555-8555-555555555555',
  'Senior Product Manager — Platform & Growth',
  'Clearwater Financial',
  'complete',
  73,
  73,
  87,
  0.91,
  'demo',
  '1.0.0-demo',
  1,
  '{"parseability":0.2,"alignment":0.25,"experience":0.2,"impact":0.15,"formatting":0.1,"readability":0.1}'::jsonb,
  '2026-07-18T14:30:00Z'::timestamptz,
  '2026-07-18T14:30:00Z'::timestamptz
)
on conflict (id) do nothing;

insert into public.scan_results (
  scan_id,
  user_id,
  result,
  canonical_document,
  confidence
)
values (
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  $result$
  {
    "schemaVersion": 1,
    "analyzerVersion": "1.0.0-demo",
    "mode": "demo",
    "overallScore": 73,
    "confidence": 0.91,
    "completedAt": "2026-07-18T14:30:00.000Z",
    "componentScores": {"atsParse":87,"recruiterClarity":72,"roleMatch":73},
    "dimensionScores": [
      {"key":"experience","label":"Work Experience","score":82,"explanation":"Relevant product leadership and platform scope are explicit."},
      {"key":"alignment","label":"Skills Match","score":78,"explanation":"Most core terms are present, with four weighted gaps."},
      {"key":"education","label":"Education","score":70,"explanation":"Education is clear and concise for this role."},
      {"key":"impact","label":"Achievements","score":55,"explanation":"Three bullets include outcomes; several still describe responsibility."},
      {"key":"formatting","label":"Formatting","score":40,"explanation":"A skills table creates a meaningful extraction-order risk."},
      {"key":"certifications","label":"Certifications","score":60,"explanation":"One relevant product certification is present."},
      {"key":"readability","label":"Readability","score":81,"explanation":"Equivalent to 8.1/10 in the product clarity view."}
    ],
    "metrics":{"keywordMatch":78,"impact":62,"readability":81,"achievementDensity":43,"requirementCoverage":74,"formatRisk":60},
    "keywords":[
      {"keyword":"Product Roadmap","status":"matched","group":"Strategy & outcomes","requirementType":"must-have","importance":9.5,"resumeFrequency":1,"jobFrequency":2,"scoreImpact":0},
      {"keyword":"Agile","status":"matched","group":"Role signals","requirementType":"must-have","importance":9.2,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"OKRs","status":"matched","group":"Strategy & outcomes","requirementType":"must-have","importance":8.9,"resumeFrequency":1,"jobFrequency":2,"scoreImpact":0},
      {"keyword":"Stakeholders","status":"matched","group":"Role signals","requirementType":"must-have","importance":8.6,"resumeFrequency":2,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Cross-functional","status":"matched","group":"Role signals","requirementType":"must-have","importance":8.3,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"B2B SaaS","status":"matched","group":"Role signals","requirementType":"must-have","importance":8,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"A/B Testing","status":"matched","group":"Role signals","requirementType":"must-have","importance":7.7,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"User Research","status":"matched","group":"Role signals","requirementType":"must-have","importance":7.4,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"API","status":"matched","group":"Role signals","requirementType":"must-have","importance":7.1,"resumeFrequency":2,"jobFrequency":2,"scoreImpact":0},
      {"keyword":"Data-driven","status":"matched","group":"Role signals","requirementType":"must-have","importance":6.8,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Jira","status":"matched","group":"Tools & technology","requirementType":"preferred","importance":6.5,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Figma","status":"matched","group":"Tools & technology","requirementType":"preferred","importance":6.2,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Mixpanel","status":"matched","group":"Tools & technology","requirementType":"preferred","importance":5.9,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Python","status":"partial","group":"Tools & technology","requirementType":"preferred","importance":5.6,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"SQL","status":"partial","group":"Tools & technology","requirementType":"preferred","importance":5.3,"resumeFrequency":1,"jobFrequency":1,"scoreImpact":0},
      {"keyword":"Tableau","status":"missing","group":"Tools & technology","requirementType":"preferred","importance":5,"resumeFrequency":0,"jobFrequency":1,"scoreImpact":5,"recommendedSection":"Skills"},
      {"keyword":"GTM Strategy","status":"missing","group":"Strategy & outcomes","requirementType":"preferred","importance":4.7,"resumeFrequency":0,"jobFrequency":1,"scoreImpact":4.3,"recommendedSection":"Experience"},
      {"keyword":"Revenue KPIs","status":"missing","group":"Strategy & outcomes","requirementType":"context","importance":4.4,"resumeFrequency":0,"jobFrequency":1,"scoreImpact":3.6,"recommendedSection":"Experience"},
      {"keyword":"Competitive Analysis","status":"missing","group":"Role signals","requirementType":"context","importance":4.1,"resumeFrequency":0,"jobFrequency":1,"scoreImpact":2.9,"recommendedSection":"Experience"}
    ],
    "sections":[],
    "requirements":[],
    "findings":[
      {"id":"demo-format-skills-table","category":"format","severity":"high","title":"Skills table may change extraction order","description":"A table is used in the skills section and may disrupt text extraction.","whyItMatters":"Some parsers flatten table cells in an unexpected order.","recommendation":"Replace the skills table with a plain single-column section.","scoreImpact":9,"effort":"medium","status":"open"},
      {"id":"demo-impact-outcomes","category":"impact","severity":"high","title":"Responsibility statement lacks an outcome","description":"Several bullets describe responsibility but do not state measurable outcomes.","whyItMatters":"Scope and outcomes make contributions easier to evaluate.","recommendation":"Add truthful revenue or business-outcome evidence.","scoreImpact":7,"effort":"medium","status":"open","requiresVerification":true}
    ],
    "recommendations":[
      {
        "id":"demo-rewrite-launch-planning",
        "findingId":"demo-impact-outcomes",
        "title":"Clarify ownership of launch planning",
        "originalText":"• Responsible for coordinating launch planning with sales and marketing stakeholders.",
        "suggestedText":"• Coordinated launch planning with sales and marketing stakeholders.",
        "rationale":"The direct verb makes Alex’s role easier to scan without inventing a result.",
        "changes":["Replaces an indirect responsibility phrase with a direct action verb."],
        "requiresVerification":true,
        "status":"pending"
      }
    ],
    "annotations":[],
    "benchmark":{"label":"Curated strong-resume target","score":85,"explanation":"An illustrative product target, not a proprietary resume dataset or hiring guarantee."},
    "scoreTrend":[{"label":"Original","score":61},{"label":"Structure pass","score":67},{"label":"Current","score":73}],
    "weightSnapshot":{"parseability":0.2,"alignment":0.25,"experience":0.2,"impact":0.15,"formatting":0.1,"readability":0.1}
  }
  $result$::jsonb,
  (
    select jsonb_build_object(
      'version', 1,
      'filename', r.original_filename,
      'fileType', 'pdf',
      'pageCount', 1,
      'normalizedText', r.extracted_text,
      'spans', jsonb_build_array(
        jsonb_build_object(
          'id', 'seed-page-1',
          'page', 1,
          'text', r.extracted_text,
          'start', 0,
          'end', char_length(r.extracted_text)
        )
      ),
      'sections', '[]'::jsonb,
      'layoutSignals', jsonb_build_array(
        jsonb_build_object(
          'type', 'table',
          'page', 1,
          'confidence', 0.8,
          'detail', 'The seeded skills section includes a table layout signal.'
        )
      ),
      'extractionConfidence', 0.91
    )
    from public.resumes r
    where r.id = '22222222-2222-4222-8222-222222222222'
  ),
  0.91
)
on conflict (scan_id) do update
set result = excluded.result,
    canonical_document = excluded.canonical_document,
    confidence = excluded.confidence,
    updated_at = now();
