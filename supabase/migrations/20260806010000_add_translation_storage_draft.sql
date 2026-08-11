-- REVIEW-ONLY DRAFT. Do not apply before the POPOK translation dry run is approved.
-- Korean source columns and JSONB arrays remain unchanged. Parallel JSONB arrays
-- preserve index alignment without converting legacy string arrays into objects.
alter table public.companies
  add column if not exists mission_en text,
  add column if not exists vision_en text,
  add column if not exists core_values_en jsonb,
  add column if not exists current_activity_en jsonb;

alter table public.artists
  add column if not exists current_activity_en jsonb,
  add column if not exists education_en jsonb;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_core_values_en_array_check') then
    alter table public.companies add constraint companies_core_values_en_array_check check (core_values_en is null or jsonb_typeof(core_values_en) = 'array') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'companies_current_activity_en_array_check') then
    alter table public.companies add constraint companies_current_activity_en_array_check check (current_activity_en is null or jsonb_typeof(current_activity_en) = 'array') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'artists_current_activity_en_array_check') then
    alter table public.artists add constraint artists_current_activity_en_array_check check (current_activity_en is null or jsonb_typeof(current_activity_en) = 'array') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'artists_education_en_array_check') then
    alter table public.artists add constraint artists_education_en_array_check check (education_en is null or jsonb_typeof(education_en) = 'array') not valid;
  end if;
end $$;

-- awards[].result_en, competitions[].result_en, and works[].credits[].role_en
-- are optional keys inside existing JSONB objects and need no table columns.
