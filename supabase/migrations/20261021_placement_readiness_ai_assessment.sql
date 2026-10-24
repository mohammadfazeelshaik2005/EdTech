-- ============================================================================
-- Migration: AI-Powered Placement Readiness Assessment Tables & Fields
-- Preserves existing placement_assessments records and enhances with AI fields
-- ============================================================================

-- 1. Enhance existing placement_assessments table with AI analytics columns
ALTER TABLE public.placement_assessments
  ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'full_placement',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS time_taken_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty_scores JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS question_breakdown JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS ai_provider_used TEXT DEFAULT 'PathSync High-Entropy Engine',
  ADD COLUMN IF NOT EXISTS is_live_ai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::JSONB;

-- 2. Create separate detailed assessment_attempts table for high-granularity tracking
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

-- Enable RLS
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Students can view own assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Students can view own assessment attempts"
  ON public.assessment_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Students can insert own assessment attempts"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can delete own assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Students can delete own assessment attempts"
  ON public.assessment_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create question snapshots table for post-assessment review
CREATE TABLE IF NOT EXISTS public.assessment_question_snapshots (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  code_snippet TEXT,
  question_type TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  marks NUMERIC(4, 2) NOT NULL DEFAULT 1,
  negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0,
  student_answer JSONB,
  is_correct BOOLEAN,
  marks_awarded NUMERIC(4, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_snapshots_attempt ON public.assessment_question_snapshots(attempt_id);

ALTER TABLE public.assessment_question_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view snapshots of own attempts" ON public.assessment_question_snapshots;
CREATE POLICY "Students can view snapshots of own attempts"
  ON public.assessment_question_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = assessment_question_snapshots.attempt_id
      AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert snapshots for own attempts" ON public.assessment_question_snapshots;
CREATE POLICY "Students can insert snapshots for own attempts"
  ON public.assessment_question_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts a
      WHERE a.id = assessment_question_snapshots.attempt_id
      AND a.user_id = auth.uid()
    )
  );
