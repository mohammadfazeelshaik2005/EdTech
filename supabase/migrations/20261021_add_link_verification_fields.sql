-- ============================================================================
-- PathSync AI - Database Migration: Link Verification & Application Status Fields
-- File: supabase/migrations/20261021_add_link_verification_fields.sql
-- ============================================================================
-- Adds canonical verification, destination tracking, and health audit fields
-- to public.opportunities without destroying existing data.

-- 1. Add link verification & status fields to public.opportunities
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS official_url TEXT,
  ADD COLUMN IF NOT EXISTS application_url TEXT,
  ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS link_health TEXT DEFAULT 'UNCHECKED',
  ADD COLUMN IF NOT EXISTS http_status_code INT;

-- 2. Update verification_status check constraint to include CLOSED & NEEDS_REVIEW
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_verification_status_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_verification_status_check 
  CHECK (verification_status IN ('VERIFIED', 'PENDING_REVIEW', 'FLAGGED', 'REJECTED', 'EXPIRED', 'CLOSED', 'NEEDS_REVIEW'));

-- 3. Add application_status check constraint
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_application_status_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_application_status_check 
  CHECK (application_status IN ('OPEN', 'CLOSED', 'UPCOMING', 'UNVERIFIED', 'LINK_BROKEN', 'EXPIRED', 'NEEDS_REVIEW', 'STATUS_UNKNOWN', 'LINK_UNAVAILABLE'));

-- 4. Add link_health check constraint
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_link_health_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_link_health_check 
  CHECK (link_health IN ('HEALTHY', 'REDIRECTED', 'BROKEN', 'TIMEOUT', 'LOGIN_REQUIRED', 'BLOCKED', 'UNCHECKED'));

-- 5. Backfill existing records safely preserving verified data
UPDATE public.opportunities 
SET 
  official_url = COALESCE(official_url, official_opportunity_url, source_url),
  application_url = COALESCE(application_url, apply_url),
  application_deadline = COALESCE(application_deadline, deadline),
  last_verified_at = COALESCE(last_verified_at, last_verified_date, NOW())
WHERE official_url IS NULL OR application_url IS NULL OR last_verified_at IS NULL;

-- 6. Add performance index on application_status and link_health
CREATE INDEX IF NOT EXISTS idx_opportunities_app_status 
  ON public.opportunities(application_status, link_health);
