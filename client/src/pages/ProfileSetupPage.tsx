import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CompleteStudentData } from '@/services/supabaseService';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
} from '@/components/ui';
import {
  Sparkles,
  User,
  GraduationCap,
  Code2,
  Heart,
  FileText,
  Target,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  File,
  Trash2,
  Plus,
  X,
  Briefcase,
  Trophy,
  FlaskConical,
  BadgeCheck,
  Linkedin,
  Github,
  MapPin,
  Building,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profileData, saveProfile, uploadResume } = useAuth();

  // Current Active Step (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Persistence & Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [stepError, setStepError] = useState('');

  // ========================================================================
  // FORM STATE
  // ========================================================================

  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    headline: '',
  });

  // Step 2: Education
  const [education, setEducation] = useState({
    college: 'Silicon Valley Academic Institute',
    degree: 'Bachelor of Science (B.S.)',
    branch: 'Computer Science & Artificial Intelligence',
    cgpa: '3.88 / 4.0',
    graduationYear: '2027',
  });

  // Step 3: Skills
  const [skills, setSkills] = useState<{
    programming: string[];
    frameworks: string[];
    tools: string[];
    technical: string[];
  }>({
    programming: ['Python', 'C++', 'TypeScript', 'SQL'],
    frameworks: ['PyTorch', 'React', 'TensorFlow', 'FastAPI'],
    tools: ['Docker', 'Git', 'Linux', 'AWS'],
    technical: ['Machine Learning', 'Data Structures', 'Distributed Systems'],
  });

  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState<'programming' | 'frameworks' | 'tools' | 'technical'>('programming');

  // Step 4: Interests
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([
    'Generative AI & LLMs',
    'Autonomous Systems & Robotics',
    'Cloud Architecture',
  ]);

  const [selectedOpportunityCategories, setSelectedOpportunityCategories] = useState<string[]>([
    'Scholarships',
    'Internships',
    'Research Opportunities',
    'Hackathons',
  ]);

  // Step 5: Resume
  const [resumeFile, setResumeFile] = useState<{ name: string; size: string; url?: string } | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Step 6: Career Goals
  const [careerGoals, setCareerGoals] = useState({
    desiredRoles: ['Machine Learning Research Engineer', 'AI Systems Architect'],
    careerInterests: 'Pursuing frontier research fellowship followed by PhD or industrial lab residency.',
    preferredDomains: ['Frontier AI Labs', 'Cloud Infrastructure', 'Academic Research Centers'],
    workMode: 'Hybrid or Remote',
    availability: 'Summer 2026 Cohort',
  });

  // Hydrate initial state with existing user/profile session data if available
  useEffect(() => {
    if (user || profileData) {
      setBasicInfo((prev) => ({
        ...prev,
        fullName: profileData?.profile?.full_name || user?.fullName || prev.fullName,
        email: profileData?.profile?.email || user?.email || prev.email,
        phone: profileData?.profile?.phone || prev.phone,
        location: profileData?.profile?.location || prev.location,
        headline: profileData?.profile?.headline || prev.headline,
      }));
    }
    if (profileData) {
      if (profileData.education?.college) {
        setEducation({
          college: profileData.education.college || '',
          degree: profileData.education.degree || 'Bachelor of Science (B.S.)',
          branch: profileData.education.branch || '',
          cgpa: profileData.education.cgpa || '',
          graduationYear: profileData.education.graduation_year || '2027',
        });
      }
      if (profileData.skills) {
        setSkills({
          programming: profileData.skills.programming || [],
          frameworks: profileData.skills.frameworks || [],
          tools: profileData.skills.tools || [],
          technical: profileData.skills.technical || [],
        });
      }
      if (profileData.interests?.areas_of_interest?.length) {
        setAreasOfInterest(profileData.interests.areas_of_interest);
      }
      if (profileData.interests?.opportunity_categories?.length) {
        setSelectedOpportunityCategories(profileData.interests.opportunity_categories);
      }
      if (profileData.careerGoals?.desired_roles?.length) {
        setCareerGoals({
          desiredRoles: profileData.careerGoals.desired_roles || [],
          careerInterests: profileData.careerGoals.career_interests || '',
          preferredDomains: profileData.careerGoals.preferred_domains || [],
          workMode: profileData.careerGoals.work_mode || 'Hybrid or Remote',
          availability: profileData.careerGoals.availability || 'Summer 2026 Cohort',
        });
      }
      if (profileData.resume?.file_name) {
        setResumeFile({
          name: profileData.resume.file_name,
          size: profileData.resume.file_size || 'Verified',
          url: profileData.resume.file_url,
        });
        if (profileData.resume.linkedin_url) setLinkedinUrl(profileData.resume.linkedin_url);
        if (profileData.resume.github_url) setGithubUrl(profileData.resume.github_url);
      }
    }
  }, [user, profileData]);

  // Step definitions
  const stepConfig = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Education', icon: GraduationCap },
    { number: 3, title: 'Skills', icon: Code2 },
    { number: 4, title: 'Interests', icon: Heart },
    { number: 5, title: 'Resume', icon: FileText },
    { number: 6, title: 'Career Goals', icon: Target },
  ];

  // ========================================================================
  // STEP VALIDATION & NAVIGATION
  // ========================================================================
  const validateCurrentStep = () => {
    setStepError('');
    if (currentStep === 1) {
      if (!basicInfo.fullName.trim() || !basicInfo.email.trim()) {
        setStepError('Please enter your full name and email address.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!education.college.trim() || !education.branch.trim() || !education.cgpa.trim()) {
        setStepError('Please fill in your college, branch, and CGPA.');
        return false;
      }
    } else if (currentStep === 3) {
      if (skills.programming.length === 0 && skills.technical.length === 0) {
        setStepError('Please select at least one programming language or technical skill.');
        return false;
      }
    } else if (currentStep === 4) {
      if (selectedOpportunityCategories.length === 0) {
        setStepError('Please select at least one opportunity category.');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Step 6: Complete onboarding & persist structured profile to Supabase
      setIsSavingProfile(true);
      setStepError('');
      setSaveSuccess(null);

      try {
        const fullData: CompleteStudentData = {
          profile: {
            full_name: basicInfo.fullName.trim(),
            email: basicInfo.email.trim(),
            phone: basicInfo.phone.trim(),
            location: basicInfo.location.trim(),
            headline: basicInfo.headline.trim(),
          },
          education: {
            college: education.college.trim(),
            degree: education.degree.trim(),
            branch: education.branch.trim(),
            cgpa: education.cgpa.trim(),
            graduation_year: education.graduationYear.trim(),
          },
          skills: {
            programming: skills.programming,
            frameworks: skills.frameworks,
            tools: skills.tools,
            technical: skills.technical,
          },
          interests: {
            areas_of_interest: areasOfInterest,
            opportunity_categories: selectedOpportunityCategories,
          },
          careerGoals: {
            desired_roles: careerGoals.desiredRoles,
            preferred_domains: careerGoals.preferredDomains,
            work_mode: careerGoals.workMode,
            availability: careerGoals.availability,
            career_interests: careerGoals.careerInterests.trim(),
          },
          resume: {
            file_name: resumeFile?.name,
            file_size: resumeFile?.size,
            file_url: resumeFile?.url,
            linkedin_url: linkedinUrl.trim(),
            github_url: githubUrl.trim(),
          },
        };

        await saveProfile(fullData);
        setSaveSuccess('Student profile and academic credentials successfully saved to Supabase! Launching student dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 900);
      } catch (err: any) {
        console.error('Failed to save student profile:', err);
        setStepError(err.message || 'Failed to persist student profile to Supabase. Please retry.');
      } finally {
        setIsSavingProfile(false);
      }
    }
  };

  const handleBack = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Tag Helpers
  const toggleArrayItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim()) {
      const categoryList = skills[customSkillCategory];
      if (!categoryList.includes(customSkillInput.trim())) {
        setSkills({
          ...skills,
          [customSkillCategory]: [...categoryList, customSkillInput.trim()],
        });
      }
      setCustomSkillInput('');
    }
  };

  const removeSkill = (category: 'programming' | 'frameworks' | 'tools' | 'technical', item: string) => {
    setSkills({
      ...skills,
      [category]: skills[category].filter((s) => s !== item),
    });
  };

  // Upload resume directly to Supabase storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingResume(true);
      setStepError('');
      try {
        const uploaded = await uploadResume(file);
        setResumeFile({
          name: uploaded.fileName,
          size: uploaded.fileSize,
          url: uploaded.url,
        });
      } catch (err: any) {
        console.error('Resume upload error:', err);
        setStepError(err.message || 'Failed to upload resume to Supabase storage.');
      } finally {
        setIsUploadingResume(false);
      }
    }
  };


  return (
    <div className="min-h-screen bg-alternate py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      
      {/* ====================================================================
          TOP NAVBAR & BRAND HEADER
          ==================================================================== */}
      <header className="max-w-4xl mx-auto w-full mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2.5 select-none group">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-charcoal tracking-tight">
              PathSync <span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-muted hidden sm:inline-block">
              Onboarding Progress:
            </span>
            <Badge variant="brand" pill>
              Step {currentStep} of 6 • {Math.round((currentStep / 6) * 100)}% Complete
            </Badge>
          </div>
        </div>

        {/* PROGRESS STEPPER BAR */}
        <div className="bg-surface border border-border-default rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 relative">
            {stepConfig.map((step) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              const Icon = step.icon;

              return (
                <button
                  key={step.number}
                  type="button"
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => {
                    if (isCompleted) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`flex flex-col items-center text-center group cursor-pointer transition-colors ${
                    !isCompleted && !isCurrent ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {/* Step Circle */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 mb-1.5 ${
                      isCompleted
                        ? 'bg-mint text-white shadow-sm'
                        : isCurrent
                        ? 'bg-primary text-white shadow-brand ring-4 ring-primary/15'
                        : 'bg-subtle text-slate-subtle border border-border-default'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`text-[11px] sm:text-xs font-semibold truncate max-w-full ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-charcoal'
                        : 'text-slate-subtle'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full h-1.5 bg-subtle rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </header>


      {/* ====================================================================
          MAIN FORM CARD CONTAINER
          ==================================================================== */}
      <main className="max-w-4xl mx-auto w-full flex-1">
        <div className="bg-surface border border-border-default rounded-xl shadow-md p-6 sm:p-10 transition-all duration-200">
          
          {/* Success Banner */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-mint-subtle border border-success/30 rounded-lg text-xs font-medium text-success flex items-center gap-2.5 animate-in fade-in-0">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {stepError && (
            <div className="mb-6 p-4 bg-danger-subtle border border-danger/30 rounded-lg text-xs font-medium text-danger flex items-center gap-2.5 animate-in fade-in-0">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* ================================================================
              STEP 1: BASIC INFORMATION
              ================================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="brand" pill className="mb-2">STEP 1 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Basic Information</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Tell us who you are so opportunities and academic programs can address you accurately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name *"
                  placeholder="Enter your full name"
                  value={basicInfo.fullName}
                  onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                  leftIcon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="student@university.edu"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  helperText="Primary email for deadlines and notices"
                />

                <Input
                  label="Phone / Mobile Number"
                  placeholder="+1 (555) 000-0000"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                />

                <Input
                  label="Current City & Country"
                  placeholder="e.g. San Francisco, USA"
                  value={basicInfo.location}
                  onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <Textarea
                label="Professional Headline / Short Bio"
                placeholder="e.g. Senior CS student focused on deep learning, distributed systems, and edge robotics."
                value={basicInfo.headline}
                onChange={(e) => setBasicInfo({ ...basicInfo, headline: e.target.value })}
                helperText="Appears on institutional inquiry packets"
              />
            </div>
          )}

          {/* ================================================================
              STEP 2: EDUCATION
              (Degree, Branch, College, CGPA/percentage, Graduation year)
              ================================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="brand" pill className="mb-2">STEP 2 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Educational Background</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Academic details determine your eligibility for student scholarships, REU grants, and internships.
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  label="College / University Name *"
                  placeholder="e.g. Stanford University / Silicon Valley Academic Institute"
                  value={education.college}
                  onChange={(e) => setEducation({ ...education, college: e.target.value })}
                  leftIcon={<Building className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Select
                    label="Degree Level *"
                    value={education.degree}
                    onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                  >
                    <option>Bachelor of Science (B.S.)</option>
                    <option>Bachelor of Technology (B.Tech)</option>
                    <option>Bachelor of Engineering (B.E.)</option>
                    <option>Master of Science (M.S.)</option>
                    <option>Master of Technology (M.Tech)</option>
                    <option>Doctor of Philosophy (Ph.D.)</option>
                    <option>Associate Degree</option>
                  </Select>

                  <Input
                    label="Branch / Major Field of Study *"
                    placeholder="e.g. Computer Science & AI"
                    value={education.branch}
                    onChange={(e) => setEducation({ ...education, branch: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="CGPA / Grade Percentage *"
                    placeholder="e.g. 3.8 / 4.0 or 8.9 / 10.0 or 88%"
                    value={education.cgpa}
                    onChange={(e) => setEducation({ ...education, cgpa: e.target.value })}
                    helperText="Used strictly to filter minimum GPA thresholds"
                  />

                  <Select
                    label="Expected Graduation Year *"
                    value={education.graduationYear}
                    onChange={(e) => setEducation({ ...education, graduationYear: e.target.value })}
                  >
                    <option>2025</option>
                    <option>2026</option>
                    <option>2027</option>
                    <option>2028</option>
                    <option>2029</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STEP 3: SKILLS
              (Technical skills, Programming languages, Tools, Frameworks)
              ================================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="brand" pill className="mb-2">STEP 3 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Skills & Technical Capabilities</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Tag the languages, frameworks, and tools you have experience with to calibrate opportunity fit.
                </p>
              </div>

              {/* Active Selected Skills Summary */}
              {(skills.programming.length > 0 || skills.frameworks.length > 0 || skills.tools.length > 0 || skills.technical.length > 0) && (
                <div className="p-4 bg-primary-subtle/50 rounded-lg border border-primary-border space-y-2">
                  <div className="text-xs font-bold text-primary flex items-center justify-between">
                    <span>
                      Active Selected Skills ({skills.programming.length + skills.frameworks.length + skills.tools.length + skills.technical.length})
                    </span>
                    <span className="text-[11px] text-slate-subtle">Click × to remove</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.programming.map((s) => (
                      <span key={`p-${s}`} className="inline-flex items-center gap-1 bg-white text-charcoal border border-border-default px-2.5 py-1 rounded-full text-xs font-medium shadow-xs">
                        <span>{s}</span>
                        <button type="button" onClick={() => removeSkill('programming', s)} className="text-slate-subtle hover:text-danger cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {skills.frameworks.map((s) => (
                      <span key={`f-${s}`} className="inline-flex items-center gap-1 bg-white text-charcoal border border-border-default px-2.5 py-1 rounded-full text-xs font-medium shadow-xs">
                        <span>{s}</span>
                        <button type="button" onClick={() => removeSkill('frameworks', s)} className="text-slate-subtle hover:text-danger cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {skills.tools.map((s) => (
                      <span key={`t-${s}`} className="inline-flex items-center gap-1 bg-white text-charcoal border border-border-default px-2.5 py-1 rounded-full text-xs font-medium shadow-xs">
                        <span>{s}</span>
                        <button type="button" onClick={() => removeSkill('tools', s)} className="text-slate-subtle hover:text-danger cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {skills.technical.map((s) => (
                      <span key={`tc-${s}`} className="inline-flex items-center gap-1 bg-white text-charcoal border border-border-default px-2.5 py-1 rounded-full text-xs font-medium shadow-xs">
                        <span>{s}</span>
                        <button type="button" onClick={() => removeSkill('technical', s)} className="text-slate-subtle hover:text-danger cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Programming Languages */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Programming Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'C++', 'TypeScript', 'JavaScript', 'Java', 'Go', 'Rust', 'SQL', 'C#', 'R', 'Kotlin', 'Swift'].map((lang) => {
                    const isSelected = skills.programming.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayItem(skills.programming, (p) => setSkills({ ...skills, programming: p as any }), lang)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Frameworks & Libraries */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Frameworks & Libraries
                </label>
                <div className="flex flex-wrap gap-2">
                  {['PyTorch', 'TensorFlow', 'React', 'Next.js', 'Node.js', 'FastAPI', 'Django', 'Spring Boot', 'Scikit-Learn', 'vLLM', 'HuggingFace'].map((fw) => {
                    const isSelected = skills.frameworks.includes(fw);
                    return (
                      <button
                        key={fw}
                        type="button"
                        onClick={() => toggleArrayItem(skills.frameworks, (f) => setSkills({ ...skills, frameworks: f as any }), fw)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{fw}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tools & Platforms */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Developer Tools & Cloud
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Docker', 'Kubernetes', 'Git', 'Linux', 'AWS', 'GCP', 'PostgreSQL', 'Redis', 'Postman', 'Figma'].map((tool) => {
                    const isSelected = skills.tools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleArrayItem(skills.tools, (t) => setSkills({ ...skills, tools: t as any }), tool)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Core Technical Competencies */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Core Technical Domains
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Machine Learning', 'Deep Learning', 'Distributed Systems', 'Data Structures & Algorithms', 'Computer Vision', 'NLP', 'Computer Architecture', 'Cloud Computing'].map((tech) => {
                    const isSelected = skills.technical.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleArrayItem(skills.technical, (t) => setSkills({ ...skills, technical: t as any }), tech)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tech}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Skill Row */}
              <div className="p-4 bg-alternate rounded-lg border border-border-default flex flex-col sm:flex-row items-center gap-3 mt-4">
                <Select
                  value={customSkillCategory}
                  onChange={(e) => setCustomSkillCategory(e.target.value as any)}
                  className="sm:w-48 text-xs py-2"
                >
                  <option value="programming">Languages</option>
                  <option value="frameworks">Frameworks</option>
                  <option value="tools">Tools</option>
                  <option value="technical">Core Technical</option>
                </Select>
                <Input
                  placeholder="Add custom skill (e.g. WebGPU, Mojo)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  className="text-xs py-2"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  pill
                  onClick={addCustomSkill}
                  className="shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
          )}

          {/* ================================================================
              STEP 4: INTERESTS
              (Areas of interest, Opportunity categories)
              ================================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="brand" pill className="mb-2">STEP 4 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Interests & Opportunity Preferences</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Choose the opportunity types and research sub-fields you want PathSync AI to prioritize.
                </p>
              </div>

              {/* 6 Opportunity Categories (Multi-Select Cards) */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Opportunity Categories to Target *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { label: 'Scholarships', icon: GraduationCap, desc: 'Merit & need-based funding' },
                    { label: 'Internships', icon: Briefcase, desc: 'Summer & term residencies' },
                    { label: 'Hackathons', icon: Code2, desc: 'Collegiate & global sprints' },
                    { label: 'Research Opportunities', icon: FlaskConical, desc: 'Lab fellowships & REUs' },
                    { label: 'Competitions', icon: Trophy, desc: 'Olympiads & challenges' },
                    { label: 'Certifications', icon: BadgeCheck, desc: 'Industry micro-credentials' },
                  ].map((cat) => {
                    const isSelected = selectedOpportunityCategories.includes(cat.label);
                    const Icon = cat.icon;

                    return (
                      <div
                        key={cat.label}
                        onClick={() => toggleArrayItem(selectedOpportunityCategories, setSelectedOpportunityCategories, cat.label)}
                        className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-primary-subtle/70 border-primary text-charcoal shadow-xs ring-2 ring-primary/10'
                            : 'bg-surface border-border-default hover:border-primary-border text-slate-muted'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-subtle text-slate-subtle'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-charcoal flex items-center justify-between">
                            <span>{cat.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-muted mt-0.5">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Areas of Interest */}
              <div className="space-y-3 pt-3">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Specialized Areas of Interest
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Generative AI & LLMs',
                    'Autonomous Systems & Robotics',
                    'Cloud Architecture',
                    'Bioinformatics & Health',
                    'Cybersecurity & Cryptography',
                    'Quantum Computing',
                    'FinTech & Quantitative Finance',
                    'Climate Tech & Clean Energy',
                    'Interactive Media & HCI',
                  ].map((interest) => {
                    const isSelected = areasOfInterest.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleArrayItem(areasOfInterest, setAreasOfInterest, interest)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STEP 5: RESUME & PROFILES
              (Upload resume, LinkedIn, GitHub / Portfolio)
              ================================================================ */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="brand" pill className="mb-2">STEP 5 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Resume & Portfolio Links</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Upload your resume so partner faculty and lab recruiters can review your verified credentials.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-charcoal block">Upload Resume (PDF, DOCX)</label>
                
                {isUploadingResume ? (
                  <div className="border border-dashed border-primary/40 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-primary-subtle/20 animate-pulse">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <span className="text-sm font-bold text-charcoal">Uploading to Supabase Storage...</span>
                    <span className="text-xs text-slate-muted mt-1">Encrypting file and associating with student record</span>
                  </div>
                ) : resumeFile ? (
                  <div className="p-4 bg-primary-subtle/50 border border-primary-border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-charcoal">{resumeFile.name}</div>
                        <div className="text-xs text-slate-subtle">{resumeFile.size} • Uploaded successfully</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1.5 text-slate-subtle hover:text-danger rounded-md transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border-strong hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-canvas hover:bg-alternate">
                    <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-charcoal">Click to browse or drag and drop your resume</span>
                    <span className="text-xs text-slate-subtle mt-1">Supports PDF, DOC, DOCX up to 10 MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  leftIcon={<Linkedin className="w-4 h-4 text-slate-subtle" />}
                />

                <Input
                  label="GitHub / Portfolio URL"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  leftIcon={<Github className="w-4 h-4 text-slate-subtle" />}
                />
              </div>

              <div className="p-4 bg-alternate rounded-lg border border-border-default text-xs text-slate-muted flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Your resume is encrypted and only transmitted when you explicitly apply to an opportunity.</span>
              </div>
            </div>
          )}

          {/* ================================================================
              STEP 6: CAREER GOALS
              (Desired roles, Career interests, Preferred domains)
              ================================================================ */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in-0 duration-200">
              <div>
                <Badge variant="mint" pill className="mb-2">FINAL STEP 6 OF 6</Badge>
                <h2 className="text-2xl font-extrabold text-charcoal">Career Goals & Preferences</h2>
                <p className="text-sm text-slate-muted mt-1">
                  Define your milestone target so discovery filters prioritize tracks with highest alignment.
                </p>
              </div>

              {/* Desired Roles */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Desired Target Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Machine Learning Research Engineer',
                    'AI Systems Architect',
                    'Full-Stack Cloud Engineer',
                    'Data Scientist',
                    'Autonomous Systems Engineer',
                    'Bioinformatics Researcher',
                    'Product Manager (Tech)',
                  ].map((role) => {
                    const isSelected = careerGoals.desiredRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleArrayItem(careerGoals.desiredRoles, (r) => setCareerGoals({ ...careerGoals, desiredRoles: r as any }), role)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Domains */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                  Preferred Institutional & Industry Domains
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Frontier AI Labs',
                    'Cloud Infrastructure',
                    'Academic Research Centers',
                    'High-Growth Tech Startups',
                    'Healthcare & Biotech Institutes',
                    'Global Tech Enterprises',
                  ].map((domain) => {
                    const isSelected = careerGoals.preferredDomains.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleArrayItem(careerGoals.preferredDomains, (d) => setCareerGoals({ ...careerGoals, preferredDomains: d as any }), domain)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-slate-muted border-border-default hover:border-primary-border'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Mode & Cohort Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <Select
                  label="Preferred Work Mode"
                  value={careerGoals.workMode}
                  onChange={(e) => setCareerGoals({ ...careerGoals, workMode: e.target.value })}
                >
                  <option>Hybrid or Remote</option>
                  <option>100% Remote</option>
                  <option>In-Person / On-Site</option>
                  <option>Flexible / Any</option>
                </Select>

                <Select
                  label="Target Cohort Availability"
                  value={careerGoals.availability}
                  onChange={(e) => setCareerGoals({ ...careerGoals, availability: e.target.value })}
                >
                  <option>Summer 2026 Cohort</option>
                  <option>Immediate / Spring 2026</option>
                  <option>Fall 2026 Cohort</option>
                  <option>Winter 2027</option>
                </Select>
              </div>

              <Textarea
                label="Career Aspirations Summary"
                placeholder="Share your dream achievements or problem domains you want to solve..."
                value={careerGoals.careerInterests}
                onChange={(e) => setCareerGoals({ ...careerGoals, careerInterests: e.target.value })}
              />
            </div>
          )}

          {/* ================================================================
              NAVIGATION FOOTER (Back / Save & Continue / Complete)
              ================================================================ */}
          <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="md"
              pill
              disabled={currentStep === 1}
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  pill
                  onClick={handleNext}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-brand"
                >
                  Save & Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  pill
                  isLoading={isSavingProfile}
                  disabled={isSavingProfile}
                  onClick={handleNext}
                  rightIcon={!isSavingProfile ? <ArrowRight className="w-4 h-4" /> : undefined}
                  className="bg-primary hover:bg-primary-hover font-bold shadow-brand"
                >
                  {isSavingProfile ? 'Saving Profile to Supabase...' : 'Complete Profile & Open Dashboard →'}
                </Button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Note */}
      <footer className="text-center text-xs text-slate-subtle mt-8">
        <span>PathSync AI • Structured student opportunity discovery platform</span>
      </footer>

    </div>
  );
};
