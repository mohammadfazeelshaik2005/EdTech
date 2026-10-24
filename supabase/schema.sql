-- ============================================================================
-- PathSync AI - Production PostgreSQL Database Schema & RLS Policies
-- ============================================================================

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. STUDENT PROFILES TABLE
-- Mirrors authenticated user details with academic status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  headline TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. EDUCATION TABLE
-- Degree, branch, college, CGPA/percentage, graduation year
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  college TEXT NOT NULL,
  degree TEXT NOT NULL,
  branch TEXT NOT NULL,
  cgpa TEXT NOT NULL,
  graduation_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. SKILLS TABLE
-- Categorized skills: programming languages, frameworks, tools, technical
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('programming', 'frameworks', 'tools', 'technical')),
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user skills lookup
CREATE INDEX IF NOT EXISTS idx_skills_user_category ON public.skills(user_id, category);

-- ============================================================================
-- 5. INTERESTS TABLE
-- Target opportunity categories and research areas of interest
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  areas_of_interest TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  opportunity_categories TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 6. CAREER GOALS TABLE
-- Target roles, work mode, domains, timeline
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  desired_roles TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  preferred_domains TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  work_mode TEXT NOT NULL,
  availability TEXT NOT NULL,
  career_interests TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. RESUMES & PORTFOLIO LINKS TABLE
-- Secure resume metadata and portfolio URLs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory: Students can ONLY view and update their own data
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Policies: student_profiles
CREATE POLICY "Users can view own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.student_profiles FOR DELETE
  USING (auth.uid() = id);

-- Policies: education
CREATE POLICY "Users can view own education"
  ON public.education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education"
  ON public.education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education"
  ON public.education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own education"
  ON public.education FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: skills
CREATE POLICY "Users can view own skills"
  ON public.skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON public.skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON public.skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON public.skills FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: interests
CREATE POLICY "Users can view own interests"
  ON public.interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON public.interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests"
  ON public.interests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON public.interests FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: career_goals
CREATE POLICY "Users can view own career goals"
  ON public.career_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career goals"
  ON public.career_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career goals"
  ON public.career_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career goals"
  ON public.career_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: resumes
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. AUTOMATIC USER PROFILE TRIGGER
-- Auto-creates a student_profiles row when a new user signs up via Supabase Auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.student_profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'PathSync Student'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. STORAGE BUCKET CONFIGURATION FOR RESUMES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only upload and read files in their own folder
CREATE POLICY "Allow authenticated uploads to user folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read their own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 11. STORAGE BUCKET CONFIGURATION FOR AVATARS (PROFILE PHOTOS)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only upload, read, update, delete their own avatars
CREATE POLICY "Allow authenticated uploads to own avatar folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read their own avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 12. USER ROLES & RBAC SYSTEM
-- Strictly isolates student and admin roles at the database layer
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_role UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can insert new admin roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin());

-- Default role assignment trigger (Public registration creates student role only)
CREATE OR REPLACE FUNCTION public.handle_default_student_role()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (new.id, 'student', true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_default_student_role();

-- ============================================================================
-- 13. PLACEMENT ASSESSMENTS TABLE
-- Stores assessment results securely per student
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.placement_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score NUMERIC(5, 2) NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  section_scores JSONB NOT NULL DEFAULT '[]'::JSONB,
  strengths TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  weak_areas TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  recommendations TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  assessment_type TEXT DEFAULT 'full_placement',
  difficulty TEXT DEFAULT 'mixed',
  time_taken_seconds INT DEFAULT 0,
  difficulty_scores JSONB DEFAULT '{}'::JSONB,
  question_breakdown JSONB DEFAULT '[]'::JSONB,
  ai_analysis JSONB DEFAULT '{}'::JSONB,
  ai_provider_used TEXT DEFAULT 'PathSync High-Entropy Engine',
  is_live_ai BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_placement_assessments_user ON public.placement_assessments(user_id, completed_at DESC);

ALTER TABLE public.placement_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own placement assessments"
  ON public.placement_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own placement assessments"
  ON public.placement_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can delete own placement assessments"
  ON public.placement_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- AI Assessment Attempts Table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_questions INT NOT NULL,
  duration_minutes INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total_marks NUMERIC(6, 2) NOT NULL DEFAULT 0,
  scored_marks NUMERIC(6, 2) NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  incorrect_answers INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,
  section_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
  difficulty_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
  strengths TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  weak_areas TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  recommendations TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ai_analysis JSONB DEFAULT '{}'::JSONB,
  ai_provider_used TEXT NOT NULL DEFAULT 'PathSync High-Entropy Engine',
  is_live_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id, completed_at DESC);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own assessment attempts"
  ON public.assessment_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own assessment attempts"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can delete own assessment attempts"
  ON public.assessment_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 14. OPPORTUNITIES TABLE & INDIA ELIGIBILITY
-- Stores normalized opportunities with strict India relevance criteria
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL,
  opportunity_type TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  location TEXT NOT NULL,
  mode TEXT DEFAULT 'Hybrid',
  duration TEXT,
  compensation TEXT,
  match_score NUMERIC(5, 2) DEFAULT 85,
  eligibility_country TEXT[] NOT NULL DEFAULT ARRAY['India']::TEXT[],
  eligibility_text TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  education_level TEXT DEFAULT 'Undergraduate',
  is_india_opportunity BOOLEAN NOT NULL DEFAULT true,
  verification_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (verification_status IN ('VERIFIED', 'PENDING_REVIEW', 'FLAGGED', 'REJECTED', 'EXPIRED', 'CLOSED', 'NEEDS_REVIEW')),
  verification_score NUMERIC(5, 2) DEFAULT 80,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  deadline TIMESTAMPTZ,
  application_deadline TIMESTAMPTZ,
  description TEXT,
  apply_url TEXT,
  application_url TEXT,
  official_url TEXT,
  source_id TEXT,
  source_name TEXT,
  source_url TEXT,
  official_domain TEXT,
  official_opportunity_url TEXT,
  application_status TEXT DEFAULT 'UNVERIFIED' CHECK (application_status IN ('OPEN', 'CLOSED', 'UPCOMING', 'UNVERIFIED', 'LINK_BROKEN', 'EXPIRED', 'NEEDS_REVIEW', 'STATUS_UNKNOWN', 'LINK_UNAVAILABLE')),
  link_health TEXT DEFAULT 'UNCHECKED' CHECK (link_health IN ('HEALTHY', 'REDIRECTED', 'BROKEN', 'TIMEOUT', 'LOGIN_REQUIRED', 'BLOCKED', 'UNCHECKED')),
  http_status_code INT,
  verification_source TEXT,
  verification_notes TEXT,
  last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  last_verified_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_recom_pool 
  ON public.opportunities(verification_status, is_india_opportunity, is_expired)
  WHERE verification_status = 'VERIFIED' AND is_india_opportunity = true AND is_expired = false;

CREATE INDEX IF NOT EXISTS idx_opportunities_app_status 
  ON public.opportunities(application_status, link_health);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Students and public can view ONLY verified, India-eligible, non-expired opportunities
CREATE POLICY "Public and students can view recommended pool"
  ON public.opportunities FOR SELECT
  USING (
    (verification_status = 'VERIFIED' AND is_india_opportunity = true AND is_expired = false)
    OR public.is_admin()
  );

-- Only admins can manage (insert/update/delete) opportunities
CREATE POLICY "Admins can insert opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update opportunities"
  ON public.opportunities FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete opportunities"
  ON public.opportunities FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 15. RAW SCRAPED OPPORTUNITIES STAGING TABLE (Rule 8: Raw Storage Isolation)
-- Raw payloads before normalization, India check, deduplication, and verification.
-- STRICTLY ISOLATED: Students and public have 0 access (RLS allows only admins).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.raw_scraped_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  org_name TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  extraction_stage TEXT NOT NULL DEFAULT 'RAW' CHECK (extraction_stage IN ('RAW', 'CLEANED', 'NORMALIZED', 'QUARANTINED', 'VERIFIED_ADMITTED')),
  quarantine_reason TEXT,
  extracted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_opps_source ON public.raw_scraped_opportunities(source_id, extracted_at DESC);

ALTER TABLE public.raw_scraped_opportunities ENABLE ROW LEVEL SECURITY;

-- Only admins and system processes can read or manage raw staged opportunities
CREATE POLICY "Only admins can access raw scraped opportunities"
  ON public.raw_scraped_opportunities FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 16. SCRAPER EXECUTION AUDIT LOGS TABLE
-- Tracks scraper runs, discovered counts, verified counts, errors, and rate limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scraper_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  discovered_count INT DEFAULT 0,
  verified_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  expired_count INT DEFAULT 0,
  duplicate_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'PARTIAL', 'BLOCKED', 'ERROR')),
  error_details TEXT,
  stage_logs JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_exec ON public.scraper_execution_logs(execution_id);

ALTER TABLE public.scraper_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view scraper logs"
  ON public.scraper_execution_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

