-- ============================================================================
-- PathSync AI - Universal Standalone PostgreSQL Database Setup
-- Compatible with: PostgreSQL 14 / 15 / 16 / 17 (Local, Docker, Neon, Supabase)
-- ============================================================================

-- 1. Enable pgcrypto for UUIDs & password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. USERS & AUTHENTICATION TABLE (Universal Standalone Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. STUDENT PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
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
-- 4. EDUCATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  college TEXT NOT NULL,
  degree TEXT NOT NULL,
  branch TEXT NOT NULL,
  cgpa TEXT NOT NULL,
  graduation_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. SKILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('programming', 'frameworks', 'tools', 'technical')),
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skills_user_category ON public.skills(user_id, category);

-- ============================================================================
-- 6. INTERESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  areas_of_interest TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  opportunity_categories TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. CAREER GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  desired_roles TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  preferred_domains TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  work_mode TEXT NOT NULL,
  availability TEXT NOT NULL,
  career_interests TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 8. RESUMES & PORTFOLIO LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 9. USER ROLES & RBAC SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_standalone_user_role UNIQUE (user_id)
);

-- ============================================================================
-- 10. PLACEMENT ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.placement_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- AI Assessment Attempts Table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ============================================================================
-- 11. OPPORTUNITIES TABLE & INDIA ELIGIBILITY
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

-- ============================================================================
-- 12. DEMO SEED DATA (USERS, ROLES, STUDENT PROFILES, OPPORTUNITIES)
-- ============================================================================

-- Insert Admin Account
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@pathsync.ai',
  crypt('Admin@PathSync2026!', gen_salt('bf')),
  'PathSync Administrator',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert Student Account (Sarah Jenkins / Demo Student)
INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'student@pathsync.ai',
  crypt('Student@PathSync2026!', gen_salt('bf')),
  'Sarah Jenkins',
  'student',
  true,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'student', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert Profile
INSERT INTO public.student_profiles (id, full_name, email, headline, location, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Sarah Jenkins',
  'student@pathsync.ai',
  'B.Tech AI & Data Science Candidate • Target: ML Research Fellow',
  'Bengaluru, Karnataka, India',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Education
INSERT INTO public.education (user_id, college, degree, branch, cgpa, graduation_year)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'National Institute of Technology Karnataka (NITK Surathkal)',
  'B.Tech',
  'Computer Science & Engineering',
  '8.95',
  '2026'
)
ON CONFLICT DO NOTHING;

-- Insert Skills
INSERT INTO public.skills (user_id, category, skill_name) VALUES
  ('00000000-0000-0000-0000-000000000002', 'programming', 'Python'),
  ('00000000-0000-0000-0000-000000000002', 'programming', 'TypeScript'),
  ('00000000-0000-0000-0000-000000000002', 'programming', 'C++'),
  ('00000000-0000-0000-0000-000000000002', 'frameworks', 'PyTorch'),
  ('00000000-0000-0000-0000-000000000002', 'frameworks', 'React'),
  ('00000000-0000-0000-0000-000000000002', 'tools', 'Docker'),
  ('00000000-0000-0000-0000-000000000002', 'tools', 'Git'),
  ('00000000-0000-0000-0000-000000000002', 'technical', 'Machine Learning'),
  ('00000000-0000-0000-0000-000000000002', 'technical', 'Data Structures & Algorithms')
ON CONFLICT DO NOTHING;

-- Insert Interests
INSERT INTO public.interests (user_id, areas_of_interest, opportunity_categories)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  ARRAY['Artificial Intelligence', 'Distributed Systems', 'Computer Vision']::TEXT[],
  ARRAY['Research Opportunities', 'Internships', 'Scholarships']::TEXT[]
)
ON CONFLICT DO NOTHING;

-- Insert Career Goals
INSERT INTO public.career_goals (user_id, desired_roles, preferred_domains, work_mode, availability, career_interests)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  ARRAY['Machine Learning Research Engineer', 'Systems Software Engineer']::TEXT[],
  ARRAY['Artificial Intelligence', 'Autonomous Systems']::TEXT[],
  'Hybrid',
  'Immediate (Summer 2026)',
  'Focusing on research fellowships and high-impact engineering residencies in India.'
)
ON CONFLICT DO NOTHING;

-- Insert Verified Opportunities
INSERT INTO public.opportunities (
  id, title, organization, category, opportunity_type, country, location, mode,
  duration, compensation, match_score, eligibility_country, eligibility_text,
  required_skills, education_level, is_india_opportunity, verification_status,
  verification_score, is_expired, deadline, description, apply_url,
  source_id, source_name, official_domain, official_opportunity_url, last_verified_date
) VALUES
(
  'opp-1',
  'IISc Bangalore AI & Computational Sciences Fellowship',
  'Indian Institute of Science (IISc) • Dept. of Computational & Data Sciences',
  'Research Opportunities',
  'fellowship',
  'India',
  'Bengaluru, Karnataka, India',
  'Hybrid',
  '12 Weeks (Summer 2026)',
  '₹45,000/mo + Campus Accommodation',
  98.00,
  ARRAY['India']::TEXT[],
  'Open to enrolled B.Tech/M.Tech/M.Sc students in India with min 8.0 CGPA • Python/PyTorch proficiency',
  ARRAY['Python', 'PyTorch', 'Machine Learning', 'Linear Algebra']::TEXT[],
  'Undergraduate',
  true,
  'CLOSED',
  98.00,
  true,
  '2026-04-30 23:59:59+05:30',
  'Research residency at IISc Bangalore in Computational and Data Sciences. The 2026 regular admissions cycle has concluded (provisional offer letters dispatched). Applications are closed.',
  NULL,
  'src-iisc',
  'IISc CDS Office of Academic Research',
  'iisc.ac.in',
  'https://cds.iisc.ac.in/admissions/',
  NOW()
),
(
  'opp-2',
  'TATA Trust National STEM Merit Scholarship',
  'Tata Education & Development Trust',
  'Scholarships',
  'scholarship',
  'India',
  'Mumbai & Pan-India',
  'Remote',
  'Academic Year 2026–2027',
  '₹2,50,000 Annual Grant',
  96.00,
  ARRAY['India']::TEXT[],
  'Indian citizens enrolled in recognized AICTE/UGC accredited institutes • Min 7.5 CGPA',
  ARRAY['Research Writing', 'Computer Science', 'Mathematics']::TEXT[],
  'Undergraduate',
  true,
  'VERIFIED',
  96.00,
  false,
  '2026-05-10 23:59:59+05:30',
  'National collegiate merit grant and research stipend awarded to meritorious Indian engineering students conducting high-impact investigations in artificial intelligence and distributed computing.',
  'https://tatatrusts.org/scholarships',
  'src-tatatrusts',
  'Tata Trust Academic Scholarship Registry',
  'tatatrusts.org',
  'https://tatatrusts.org',
  NOW()
),
(
  'opp-3',
  'Microsoft Research India Cloud & Systems Internship',
  'Microsoft Research (MSR) India',
  'Internships',
  'internship',
  'India',
  'Bengaluru, Karnataka, India',
  'Hybrid',
  '6 Months (Jan–Jun / May–Jul 2026)',
  '₹1,25,000/mo + Benefits',
  94.00,
  ARRAY['India']::TEXT[],
  'Full-time students enrolled in a degree program in India graduating in 2026 or 2027',
  ARRAY['Go', 'Docker', 'Kubernetes', 'Distributed Systems']::TEXT[],
  'Undergraduate',
  true,
  'VERIFIED',
  94.00,
  false,
  '2026-05-15 23:59:59+05:30',
  'Collaborate with senior researchers in Lavelle Road, Bengaluru to architect fault-tolerant distributed systems, low-latency microservices, and AI edge inference engines.',
  'https://microsoft.com/en-us/research/lab/microsoft-research-india',
  'src-msr',
  'Microsoft Research India Careers Portal',
  'microsoft.com',
  'https://microsoft.com',
  NOW()
),
(
  'opp-4',
  'Google Summer of Code (India Contributor Track)',
  'Google Open Source Programs Office',
  'Internships',
  'fellowship',
  'India',
  'Remote (India)',
  'Remote',
  '12 Weeks (Summer 2026)',
  '$1,500 - $3,000 Stipend (INR converted)',
  92.00,
  ARRAY['India', 'Global']::TEXT[],
  'Open to eligible student contributors & developers 18+ in India',
  ARRAY['Git', 'Open Source', 'Python', 'C++', 'JavaScript']::TEXT[],
  'All Levels',
  true,
  'VERIFIED',
  92.00,
  false,
  '2026-04-25 23:59:59+05:30',
  'Global program connecting collegiate developers in India with open source software mentors across leading Linux foundation, Apache, and LLVM repositories.',
  'https://summerofcode.withgoogle.com',
  'src-gsoc',
  'Google Open Source Registry',
  'summerofcode.withgoogle.com',
  'https://summerofcode.withgoogle.com',
  NOW()
),
(
  'opp-5',
  'DRDO Centre for AI & Robotics (CAIR) Summer Research Fellowship',
  'Defence Research and Development Organisation (DRDO)',
  'Research Opportunities',
  'fellowship',
  'India',
  'Bengaluru, Karnataka, India',
  'In-Person',
  '8 Weeks (May–July 2026)',
  '₹28,000/mo + Access to Lab Computing',
  95.00,
  ARRAY['India']::TEXT[],
  'Indian citizens enrolled in 3rd/4th year B.Tech/M.Tech in CS/ECE/Robotics with min 7.8 CGPA',
  ARRAY['ROS', 'Python', 'C++', 'Computer Vision', 'Embedded Systems']::TEXT[],
  'Undergraduate',
  true,
  'VERIFIED',
  95.00,
  false,
  '2026-04-20 23:59:59+05:30',
  'Classified summer research fellowship working on autonomous robotics perception, sensor fusion for unmanned aerial vehicles, and resilient edge compute.',
  'https://drdo.gov.in/cair',
  'src-drdo',
  'DRDO Research Bulletin',
  'drdo.gov.in',
  'https://drdo.gov.in',
  NOW()
),
(
  'opp-6',
  'ISRO Satellite Applications Centre (SAC) Space Tech Residency',
  'Indian Space Research Organisation (ISRO)',
  'Research Opportunities',
  'fellowship',
  'India',
  'Ahmedabad, Gujarat, India',
  'In-Person',
  '16 Weeks (June–Sept 2026)',
  '₹35,000/mo + Hostel',
  96.00,
  ARRAY['India']::TEXT[],
  'Indian undergraduate/postgraduate engineering students • Valid institute NOC required',
  ARRAY['Satellite Telemetry', 'Signal Processing', 'Python', 'FPGA']::TEXT[],
  'Undergraduate',
  true,
  'VERIFIED',
  96.00,
  false,
  '2026-05-05 23:59:59+05:30',
  'National space research program offering hands-on involvement with earth observation telemetry, hyper-spectral satellite imaging analysis, and deep-space orbital dynamics.',
  'https://isro.gov.in/sac',
  'src-isro',
  'ISRO RESPOND & Academic Interface Bulletin',
  'isro.gov.in',
  'https://isro.gov.in',
  NOW()
),
(
  'opp-7',
  'ACM India National Inter-Collegiate Algorithmic Challenge',
  'ACM India Council & IIT Madras',
  'Competitions',
  'competition',
  'India',
  'Chennai, Tamil Nadu, India & Online',
  'Hybrid',
  '3 Competitive Stages',
  '₹3,00,000 Prize Pool',
  88.00,
  ARRAY['India']::TEXT[],
  'Enrolled students in Indian colleges and universities',
  ARRAY['C++', 'Data Structures', 'Algorithms', 'Graph Theory']::TEXT[],
  'All Levels',
  true,
  'VERIFIED',
  91.00,
  false,
  '2026-05-30 23:59:59+05:30',
  'Premier algorithmic programming contest bringing together top engineering colleges in India to compete in advanced dynamic programming, graph theory, and system optimization.',
  'https://india.acm.org',
  'src-acm',
  'ACM India Student Chapter Registry',
  'india.acm.org',
  'https://india.acm.org',
  NOW()
),
(
  'opp-8',
  'Infosys InStep Global Tech Internship (Bengaluru Campus)',
  'Infosys Limited',
  'Internships',
  'internship',
  'India',
  'Electronics City, Bengaluru, India',
  'In-Person',
  '10 Weeks (Summer 2026)',
  '₹80,000/mo + Campus Boarding',
  93.00,
  ARRAY['India']::TEXT[],
  'Undergraduate and Master students in India graduating in 2026/2027',
  ARRAY['Java', 'Python', 'Cloud Architecture', 'Kubernetes']::TEXT[],
  'Undergraduate',
  true,
  'VERIFIED',
  97.00,
  false,
  '2026-04-28 23:59:59+05:30',
  'Flagship tech internship at the Infosys Electronics City Campus working on enterprise generative AI pipelines, cloud observability, and Kubernetes automation.',
  'https://infosys.com/instep',
  'src-infosys',
  'Infosys InStep University Career Portal',
  'infosys.com',
  'https://infosys.com',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  organization = EXCLUDED.organization,
  category = EXCLUDED.category,
  opportunity_type = EXCLUDED.opportunity_type,
  updated_at = NOW();
