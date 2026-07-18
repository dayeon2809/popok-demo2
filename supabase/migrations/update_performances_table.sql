-- ============================================================================
-- update_performances_table.sql
--
-- Adds company_id, external_url, and display_order columns to the public.performances table.
-- Links performances to companies (ON DELETE SET NULL).
-- Creates indexes for performance optimization.
-- ============================================================================

-- 1. Add company_id referencing public.companies(id) with ON DELETE SET NULL
ALTER TABLE public.performances 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 2. Create index on company_id for faster company-specific queries
CREATE INDEX IF NOT EXISTS performances_company_id_idx 
  ON public.performances (company_id);

-- 3. Add external_url TEXT column for external links (replacing or augmenting source_url/ticket_url)
ALTER TABLE public.performances 
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 4. Add display_order INTEGER column with default 0 for custom admin sorting
ALTER TABLE public.performances 
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
