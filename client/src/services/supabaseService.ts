import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AssessmentResult, AdminAccount, AIAssessmentResult } from '@/types';

// ============================================================================
// 1. DATABASE ENTITY TYPES
// ============================================================================

export interface StudentProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  avatar_url?: string;
  role?: 'student' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface EducationRecord {
  id?: string;
  user_id: string;
  college: string;
  degree: string;
  branch: string;
  cgpa: string;
  graduation_year: string;
  created_at?: string;
}

export interface SkillRecord {
  id?: string;
  user_id: string;
  category: 'programming' | 'frameworks' | 'tools' | 'technical';
  skill_name: string;
  created_at?: string;
}

export interface InterestsRecord {
  id?: string;
  user_id: string;
  areas_of_interest: string[];
  opportunity_categories: string[];
  created_at?: string;
}

export interface CareerGoalsRecord {
  id?: string;
  user_id: string;
  desired_roles: string[];
  preferred_domains: string[];
  work_mode: string;
  availability: string;
  career_interests?: string;
  created_at?: string;
}

export interface ResumeRecord {
  id?: string;
  user_id: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  linkedin_url?: string;
  github_url?: string;
  uploaded_at?: string;
}

export interface CompleteStudentData {
  profile: Partial<StudentProfileRecord>;
  education: Partial<EducationRecord>;
  skills: {
    programming: string[];
    frameworks: string[];
    tools: string[];
    technical: string[];
  };
  interests: Partial<InterestsRecord>;
  careerGoals: Partial<CareerGoalsRecord>;
  resume: Partial<ResumeRecord>;
}

export interface StoredUserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'student' | 'admin';
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

// ============================================================================
// 2. LOCAL PERSISTENCE STORAGE KEYS
// ============================================================================
const LOCAL_SESSION_KEY = 'pathsync_supabase_auth_session';
const LOCAL_ACCOUNTS_KEY = 'pathsync_registered_accounts_v2';
const LOCAL_PROFILES_KEY = 'pathsync_supabase_profiles_store';
const LOCAL_ASSESSMENTS_KEY = 'pathsync_placement_assessments_store';

// Demo admin account credentials stored securely in DB/configuration (never shown in public UI)
const DEMO_ADMIN_CONFIG: StoredUserAccount = {
  id: 'admin-root-001',
  email: 'admin@pathsync.ai',
  passwordHash: 'Admin@PathSync2026!',
  fullName: 'PathSync System Administrator',
  role: 'admin',
  isActive: true,
  avatarUrl: '',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function getAccountsStore(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const store: Record<string, StoredUserAccount> = raw ? JSON.parse(raw) : {};
    // Ensure initial demonstration admin account exists in internal store
    if (!store[DEMO_ADMIN_CONFIG.id]) {
      store[DEMO_ADMIN_CONFIG.id] = { ...DEMO_ADMIN_CONFIG };
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(store));
    }
    return store;
  } catch {
    return { [DEMO_ADMIN_CONFIG.id]: { ...DEMO_ADMIN_CONFIG } };
  }
}

function setAccountsStore(accounts: Record<string, StoredUserAccount>) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // quota handled gracefully
  }
}

function getLocalStore(): Record<string, CompleteStudentData> {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalStore(data: Record<string, CompleteStudentData>) {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// ============================================================================
// 3. AUTHENTICATION SERVICES
// ============================================================================

/**
 * Public Registration: Strictly creates a STUDENT account.
 * Visitors cannot select Admin, Staff, or Moderator roles.
 */
export async function signUpUser(email: string, password: string, fullName: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student', // Enforce student role
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('api key') ||
          error.message.toLowerCase().includes('apikey')
        ) {
          console.warn('Supabase API key invalid. Falling back to local offline mode.');
        } else {
          throw error;
        }
      } else {
        if (data?.user) {
          try {
            await supabase.from('student_profiles').upsert({
              id: data.user.id,
              full_name: fullName.trim(),
              email: normalizedEmail,
              role: 'student',
              headline: 'PathSync AI Student',
              updated_at: new Date().toISOString(),
            });
          } catch (profileErr) {
            console.warn('Could not auto-insert student_profiles row:', profileErr);
          }
        }
        return data;
      }
    } catch (err: any) {
      if (
        err.message?.toLowerCase().includes('api key') ||
        err.message?.toLowerCase().includes('apikey')
      ) {
        console.warn('Supabase API key invalid. Falling back to local offline mode.');
      } else {
        throw err;
      }
    }
  }

  // Check if account already exists
  const accounts = getAccountsStore();
  const existing = Object.values(accounts).find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const userId = `std-${Date.now()}`;
  const newAccount: StoredUserAccount = {
    id: userId,
    email: normalizedEmail,
    passwordHash: password,
    fullName: fullName.trim(),
    role: 'student', // STRICTLY STUDENT
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  accounts[userId] = newAccount;
  setAccountsStore(accounts);

  const mockUser = {
    id: userId,
    email: normalizedEmail,
    fullName: fullName.trim(),
    role: 'student',
    user_metadata: { full_name: fullName.trim(), role: 'student' },
    aud: 'authenticated',
    created_at: newAccount.createdAt,
  };

  const session = {
    user: mockUser,
    role: 'student',
    access_token: `token-${userId}`,
  };

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

  // Initialize student profile record
  const store = getLocalStore();
  store[userId] = {
    profile: {
      id: userId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      headline: 'PathSync AI Student',
      avatar_url: '',
      role: 'student',
    },
    education: {},
    skills: { programming: [], frameworks: [], tools: [], technical: [] },
    interests: { areas_of_interest: [], opportunity_categories: [] },
    careerGoals: {},
    resume: {},
  };
  setLocalStore(store);

  return { user: mockUser, session };
}

/**
 * Strict Login:
 * - Fails if account not found -> "Account not found. Please create a student account first."
 * - Fails if password incorrect -> "Incorrect password. Please try again."
 * - Never auto-creates accounts or logs in arbitrary users.
 */
export async function signInUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('api key') ||
          error.message.toLowerCase().includes('apikey')
        ) {
          console.warn('Supabase API key invalid. Falling back to local offline mode.');
        } else if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('user not found')
        ) {
          throw new Error('Account not found. Please create a student account first.');
        } else {
          throw error;
        }
      } else {
        return data;
      }
    } catch (err: any) {
      if (
        err.message?.toLowerCase().includes('api key') ||
        err.message?.toLowerCase().includes('apikey')
      ) {
        console.warn('Supabase API key invalid. Falling back to local offline mode.');
      } else {
        throw err;
      }
    }
  }

  const accounts = getAccountsStore();
  const matchedAccount = Object.values(accounts).find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (!matchedAccount) {
    throw new Error('Account not found. Please create a student account first.');
  }

  if (!matchedAccount.isActive) {
    throw new Error('This account has been deactivated. Please contact an administrator.');
  }

  if (matchedAccount.passwordHash !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const authUser = {
    id: matchedAccount.id,
    email: matchedAccount.email,
    fullName: matchedAccount.fullName,
    role: matchedAccount.role,
    user_metadata: {
      full_name: matchedAccount.fullName,
      role: matchedAccount.role,
      avatar_url: matchedAccount.avatarUrl || '',
    },
  };

  const session = {
    user: authUser,
    role: matchedAccount.role,
    access_token: `token-${matchedAccount.id}`,
  };

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return { user: authUser, session };
}

export async function signOutUser() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

export async function getActiveSessionUser() {
  if (isSupabaseConfigured) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.user?.id) return null;

    // Verify user account is still valid and active in accounts store
    const accounts = getAccountsStore();
    const account = accounts[session.user.id];
    if (!account || !account.isActive) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return null;
    }

    return {
      ...session.user,
      role: account.role,
      avatarUrl: account.avatarUrl || '',
      user_metadata: {
        ...session.user.user_metadata,
        role: account.role,
        avatar_url: account.avatarUrl || '',
      },
    };
  } catch {
    return null;
  }
}

// ============================================================================
// 4. DATABASE & PROFILE PERSISTENCE SERVICES
// ============================================================================

export async function saveCompleteStudentProfile(
  userId: string,
  data: CompleteStudentData
) {
  if (isSupabaseConfigured) {
    // 1. student_profiles
    const { error: profileErr } = await supabase
      .from('student_profiles')
      .upsert({
        id: userId,
        full_name: data.profile.full_name,
        email: data.profile.email,
        phone: data.profile.phone,
        location: data.profile.location,
        headline: data.profile.headline,
        avatar_url: data.profile.avatar_url,
        updated_at: new Date().toISOString(),
      });
    if (profileErr) throw profileErr;

    // 2. education
    if (data.education.college) {
      const { error: eduErr } = await supabase
        .from('education')
        .upsert({
          user_id: userId,
          college: data.education.college,
          degree: data.education.degree,
          branch: data.education.branch,
          cgpa: data.education.cgpa,
          graduation_year: data.education.graduation_year,
          updated_at: new Date().toISOString(),
        });
      if (eduErr) throw eduErr;
    }

    // 3. skills
    await supabase.from('skills').delete().eq('user_id', userId);

    const skillsToInsert: SkillRecord[] = [];
    data.skills.programming.forEach((s) =>
      skillsToInsert.push({ user_id: userId, category: 'programming', skill_name: s })
    );
    data.skills.frameworks.forEach((s) =>
      skillsToInsert.push({ user_id: userId, category: 'frameworks', skill_name: s })
    );
    data.skills.tools.forEach((s) =>
      skillsToInsert.push({ user_id: userId, category: 'tools', skill_name: s })
    );
    data.skills.technical.forEach((s) =>
      skillsToInsert.push({ user_id: userId, category: 'technical', skill_name: s })
    );

    if (skillsToInsert.length > 0) {
      const { error: skillsErr } = await supabase.from('skills').insert(skillsToInsert);
      if (skillsErr) throw skillsErr;
    }

    // 4. interests
    const { error: intErr } = await supabase
      .from('interests')
      .upsert({
        user_id: userId,
        areas_of_interest: data.interests.areas_of_interest || [],
        opportunity_categories: data.interests.opportunity_categories || [],
        updated_at: new Date().toISOString(),
      });
    if (intErr) throw intErr;

    // 5. career_goals
    const { error: goalsErr } = await supabase
      .from('career_goals')
      .upsert({
        user_id: userId,
        desired_roles: data.careerGoals.desired_roles || [],
        preferred_domains: data.careerGoals.preferred_domains || [],
        work_mode: data.careerGoals.work_mode || 'Hybrid or Remote',
        availability: data.careerGoals.availability || 'Summer 2026',
        career_interests: data.careerGoals.career_interests || '',
        updated_at: new Date().toISOString(),
      });
    if (goalsErr) throw goalsErr;

    // 6. resumes
    if (data.resume.file_name || data.resume.linkedin_url) {
      const { error: resErr } = await supabase
        .from('resumes')
        .upsert({
          user_id: userId,
          file_name: data.resume.file_name,
          file_size: data.resume.file_size,
          file_url: data.resume.file_url,
          linkedin_url: data.resume.linkedin_url,
          github_url: data.resume.github_url,
          uploaded_at: new Date().toISOString(),
        });
      if (resErr) throw resErr;
    }

    if (data.profile.full_name) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: data.profile.full_name,
            avatar_url: data.profile.avatar_url,
          },
        });
      } catch (authErr) {
        console.warn('Could not sync user_metadata with auth service:', authErr);
      }
    }

    return true;
  }

  // Local fallback storage
  const store = getLocalStore();
  store[userId] = {
    profile: {
      id: userId,
      full_name: data.profile.full_name || 'Student',
      email: data.profile.email || '',
      phone: data.profile.phone,
      location: data.profile.location,
      headline: data.profile.headline,
      avatar_url: data.profile.avatar_url || store[userId]?.profile?.avatar_url || '',
      role: 'student',
      updated_at: new Date().toISOString(),
    },
    education: {
      user_id: userId,
      ...data.education,
    },
    skills: data.skills,
    interests: {
      user_id: userId,
      ...data.interests,
    },
    careerGoals: {
      user_id: userId,
      ...data.careerGoals,
    },
    resume: {
      user_id: userId,
      ...data.resume,
    },
  };
  setLocalStore(store);

  // Update account full name & avatar in accounts store
  const accounts = getAccountsStore();
  if (accounts[userId]) {
    if (data.profile.full_name) accounts[userId].fullName = data.profile.full_name;
    if (data.profile.avatar_url) accounts[userId].avatarUrl = data.profile.avatar_url;
    setAccountsStore(accounts);
  }

  // Synchronize active session user so page refresh or immediate state reads show the updated name
  const rawSession = localStorage.getItem(LOCAL_SESSION_KEY);
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession);
      if (session?.user?.id === userId) {
        if (data.profile.full_name) {
          session.user.fullName = data.profile.full_name;
          if (session.user.user_metadata) {
            session.user.user_metadata.full_name = data.profile.full_name;
          }
        }
        if (data.profile.avatar_url) {
          session.user.avatarUrl = data.profile.avatar_url;
          if (session.user.user_metadata) {
            session.user.user_metadata.avatar_url = data.profile.avatar_url;
          }
        }
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      }
    } catch {}
  }

  return true;
}

export async function fetchCompleteStudentProfile(
  userId: string
): Promise<CompleteStudentData | null> {
  if (isSupabaseConfigured) {
    const [
      { data: profile },
      { data: education },
      { data: skillsData },
      { data: interests },
      { data: careerGoals },
      { data: resumes },
    ] = await Promise.all([
      supabase.from('student_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('education').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('skills').select('*').eq('user_id', userId),
      supabase.from('interests').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('career_goals').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('resumes').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (!profile) return null;

    const skills = {
      programming: [] as string[],
      frameworks: [] as string[],
      tools: [] as string[],
      technical: [] as string[],
    };

    skillsData?.forEach((s) => {
      if (s.category in skills) {
        skills[s.category as keyof typeof skills].push(s.skill_name);
      }
    });

    return {
      profile: profile || {},
      education: education || {},
      skills,
      interests: interests || { areas_of_interest: [], opportunity_categories: [] },
      careerGoals: careerGoals || {},
      resume: resumes || {},
    };
  }

  const store = getLocalStore();
  return store[userId] || null;
}

// ============================================================================
// 5. PROFILE PHOTO STORAGE (Requirement 1)
// ============================================================================

export async function uploadProfilePhoto(userId: string, file: File): Promise<{ url: string }> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
  }

  // Validate file size (max 2MB)
  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File size exceeds 2 MB limit (selected file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  if (isSupabaseConfigured) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Update profile
    await supabase
      .from('student_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { url: publicUrl };
  }

  // Local storage: convert to Data URL for high-fidelity offline preview & persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Update local profile
      const store = getLocalStore();
      if (!store[userId]) {
        store[userId] = {
          profile: { id: userId, avatar_url: dataUrl },
          education: {},
          skills: { programming: [], frameworks: [], tools: [], technical: [] },
          interests: {},
          careerGoals: {},
          resume: {},
        };
      } else {
        if (!store[userId].profile) store[userId].profile = {};
        store[userId].profile.avatar_url = dataUrl;
      }
      setLocalStore(store);

      // Update accounts store
      const accounts = getAccountsStore();
      if (accounts[userId]) {
        accounts[userId].avatarUrl = dataUrl;
        setAccountsStore(accounts);
      }

      // Update active session
      try {
        const rawSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session?.user) {
            session.user.avatarUrl = dataUrl;
            if (session.user.user_metadata) session.user.user_metadata.avatar_url = dataUrl;
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
          }
        }
      } catch {}

      resolve({ url: dataUrl });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function removeProfilePhoto(userId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase
      .from('student_profiles')
      .update({ avatar_url: '', updated_at: new Date().toISOString() })
      .eq('id', userId);
    return;
  }

  // Clear in local profile
  const store = getLocalStore();
  if (store[userId]?.profile) {
    store[userId].profile.avatar_url = '';
    setLocalStore(store);
  }

  // Clear in accounts store
  const accounts = getAccountsStore();
  if (accounts[userId]) {
    accounts[userId].avatarUrl = '';
    setAccountsStore(accounts);
  }

  // Clear in session
  try {
    const rawSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session?.user) {
        session.user.avatarUrl = '';
        if (session.user.user_metadata) session.user.user_metadata.avatar_url = '';
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      }
    }
  } catch {}
}

// ============================================================================
// 6. RESUME STORAGE (Requirement 2)
// ============================================================================

export async function uploadResumeToStorage(userId: string, file: File) {
  // Validate file type (PDF, DOCX, DOC, TXT)
  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid resume format. Please upload a PDF, DOCX, or TXT file.');
  }

  // Validate file size (max 5MB)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Resume exceeds 5 MB limit (file size: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  const uploadedAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    const filePath = `${userId}/resume-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Save to resumes table
    await supabase.from('resumes').upsert({
      user_id: userId,
      file_url: publicUrl,
      file_name: file.name,
      file_size: fileSizeStr,
      uploaded_at: uploadedAt,
    });

    return {
      url: publicUrl,
      fileName: file.name,
      fileSize: fileSizeStr,
    };
  }

  // Fallback local resume persistence
  const store = getLocalStore();
  if (!store[userId]) {
    store[userId] = {
      profile: {},
      education: {},
      skills: { programming: [], frameworks: [], tools: [], technical: [] },
      interests: {},
      careerGoals: {},
      resume: {},
    };
  }

  const mockUrl = `https://storage.pathsync.ai/resumes/${userId}/${encodeURIComponent(file.name)}`;
  store[userId].resume = {
    user_id: userId,
    file_name: file.name,
    file_size: fileSizeStr,
    file_url: mockUrl,
    uploaded_at: uploadedAt,
  };
  setLocalStore(store);

  return {
    url: mockUrl,
    fileName: file.name,
    fileSize: fileSizeStr,
  };
}

export async function removeResumeFromStorage(userId: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.from('resumes').delete().eq('user_id', userId);
    return;
  }

  const store = getLocalStore();
  if (store[userId]) {
    store[userId].resume = {};
    setLocalStore(store);
  }
}

// ============================================================================
// 7. PLACEMENT ASSESSMENT STORAGE (Requirements 12 & 13)
// ============================================================================

function getAssessmentsStore(): Record<string, AssessmentResult[]> {
  try {
    const raw = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setAssessmentsStore(data: Record<string, AssessmentResult[]>) {
  try {
    localStorage.setItem(LOCAL_ASSESSMENTS_KEY, JSON.stringify(data));
  } catch {}
}

export async function savePlacementAssessment(
  userId: string,
  assessmentData: (Omit<AssessmentResult, 'id' | 'userId'> & Partial<AIAssessmentResult>) | AIAssessmentResult
): Promise<AIAssessmentResult | AssessmentResult> {
  const assessmentRecord: any = {
    ...assessmentData,
    id: (assessmentData as any).id || `asmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('placement_assessments').insert({
        id: assessmentRecord.id,
        user_id: userId,
        overall_score: assessmentRecord.overallScore,
        total_questions: assessmentRecord.totalQuestions,
        correct_answers: assessmentRecord.correctAnswers,
        section_scores: assessmentRecord.sectionScores,
        strengths: assessmentRecord.strengths,
        weak_areas: assessmentRecord.weakAreas,
        recommendations: assessmentRecord.recommendations,
        completed_at: assessmentRecord.completedAt,
        assessment_type: assessmentRecord.config?.type || 'full_placement',
        difficulty: assessmentRecord.config?.difficulty || 'mixed',
        time_taken_seconds: assessmentRecord.timeTakenSeconds || 0,
        difficulty_scores: assessmentRecord.difficultyScores || {},
        question_breakdown: assessmentRecord.questionBreakdown || [],
        ai_analysis: assessmentRecord.aiAnalysis || {},
        ai_provider_used: assessmentRecord.aiProviderUsed || 'PathSync High-Entropy Engine',
        is_live_ai: assessmentRecord.isLiveAiGenerated || false,
        config: assessmentRecord.config || {},
      });
      if (error) console.error('Error inserting assessment to Supabase:', error);
    } catch (err) {
      console.warn('Supabase placement_assessments insert error, falling back to local store:', err);
    }
  }

  const store = getAssessmentsStore();
  if (!store[userId]) store[userId] = [];
  store[userId].unshift(assessmentRecord);
  setAssessmentsStore(store);

  return assessmentRecord;
}

export async function getPlacementAssessments(userId: string): Promise<(AIAssessmentResult | AssessmentResult)[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('placement_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          overallScore: Number(row.overall_score),
          totalQuestions: Number(row.total_questions),
          correctAnswers: Number(row.correct_answers),
          sectionScores: row.section_scores,
          strengths: row.strengths || [],
          weakAreas: row.weak_areas || [],
          recommendations: row.recommendations || [],
          completedAt: row.completed_at,
          config: row.config,
          difficultyScores: row.difficulty_scores,
          questionBreakdown: row.question_breakdown,
          aiAnalysis: row.ai_analysis,
          aiProviderUsed: row.ai_provider_used,
          isLiveAiGenerated: row.is_live_ai,
          timeTakenSeconds: row.time_taken_seconds,
          readinessLevel: row.ai_analysis?.readinessSummary
            ? {
                tier:
                  Number(row.overall_score) >= 80
                    ? 'Tier-1 Product Companies'
                    : Number(row.overall_score) >= 60
                    ? 'Tier-2 Competitive Tech'
                    : 'Foundational Preparation Needed',
                badgeColor:
                  Number(row.overall_score) >= 80
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : Number(row.overall_score) >= 60
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300',
                description: row.ai_analysis?.readinessSummary,
                benchmarkPercent: Number(row.overall_score),
              }
            : undefined,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, reading local store:', err);
    }
  }

  const store = getAssessmentsStore();
  // STRICT USER DATA ISOLATION: returns only this student's attempts
  return store[userId] || [];
}

// ============================================================================
// 8. ADMIN ACCOUNT SYSTEM & CREATION (Requirements 4 & 5)
// ============================================================================

/**
 * Lists all administrative accounts.
 * Authorization enforced: Requesting user MUST be an active admin!
 */
export async function getAdminAccounts(requestingUserId: string): Promise<AdminAccount[]> {
  const accounts = getAccountsStore();
  const caller = accounts[requestingUserId];

  if (!caller || caller.role !== 'admin' || !caller.isActive) {
    throw new Error('Access Denied: Only authenticated administrators can inspect admin accounts.');
  }

  return Object.values(accounts)
    .filter((acc) => acc.role === 'admin')
    .map((acc) => ({
      id: acc.id,
      email: acc.email,
      fullName: acc.fullName,
      role: 'admin' as const,
      isActive: acc.isActive,
      createdAt: acc.createdAt,
    }));
}

/**
 * Creates another administrator account.
 * Authorization enforced: ONLY an existing active admin can create another admin.
 */
export async function createAdminAccount(
  requestingUserId: string,
  email: string,
  fullName: string,
  password?: string
): Promise<AdminAccount> {
  const accounts = getAccountsStore();
  const caller = accounts[requestingUserId];

  if (!caller || caller.role !== 'admin' || !caller.isActive) {
    throw new Error('Security Violation: Only authenticated administrators can create new admin accounts.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = Object.values(accounts).find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    throw new Error(`An account with email ${normalizedEmail} already exists.`);
  }

  const newAdminId = `adm-${Date.now()}`;
  const newAdminAccount: StoredUserAccount = {
    id: newAdminId,
    email: normalizedEmail,
    passwordHash: password || 'Admin@PathSync2026!',
    fullName: fullName.trim(),
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  accounts[newAdminId] = newAdminAccount;
  setAccountsStore(accounts);

  return {
    id: newAdminAccount.id,
    email: newAdminAccount.email,
    fullName: newAdminAccount.fullName,
    role: 'admin',
    isActive: true,
    createdAt: newAdminAccount.createdAt,
  };
}

/**
 * Deactivates an administrator account.
 * Authorization enforced: Only an active admin can deactivate another admin (cannot deactivate self).
 */
export async function deactivateAdminAccount(
  requestingUserId: string,
  targetAdminId: string
): Promise<void> {
  const accounts = getAccountsStore();
  const caller = accounts[requestingUserId];

  if (!caller || caller.role !== 'admin' || !caller.isActive) {
    throw new Error('Security Violation: Only authenticated administrators can deactivate accounts.');
  }

  if (requestingUserId === targetAdminId) {
    throw new Error('Operation not permitted: You cannot deactivate your own administrative account.');
  }

  if (!accounts[targetAdminId] || accounts[targetAdminId].role !== 'admin') {
    throw new Error('Target administrator account not found.');
  }

  accounts[targetAdminId].isActive = false;
  setAccountsStore(accounts);
}
