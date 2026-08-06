-- Optional English portfolio fields. Safe for existing rows and RLS policies:
-- only nullable columns are added; no existing columns, constraints, or policies change.
-- `name_en` already exists on both tables and is intentionally not duplicated.
alter table public.artists
  add column if not exists bio_en text,
  add column if not exists introduction_en text;

alter table public.companies
  add column if not exists bio_en text,
  add column if not exists introduction_en text;

comment on column public.artists.bio_en is 'Optional full English biography';
comment on column public.artists.introduction_en is 'Optional short English introduction';
comment on column public.companies.bio_en is 'Optional full English biography';
comment on column public.companies.introduction_en is 'Optional short English introduction';

-- Works and career/activity entries are stored inside existing JSONB columns.
-- Their backward-compatible optional keys are:
-- works[]: title_en, description_en, role_en
-- affiliations/current_activity/history/awards[] where object-shaped:
--   title_en, organization_en, description_en
-- No JSONB rewrite is required; existing Korean objects remain untouched.
