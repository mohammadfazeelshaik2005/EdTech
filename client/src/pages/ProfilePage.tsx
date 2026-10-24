import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, Card, Avatar, Badge, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Building,
  Mail,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  FileText,
  Upload,
  ExternalLink,
  RefreshCw,
  Plus,
  X,
  Code2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const {
    user,
    profileData,
    isLoading,
    saveProfile,
    uploadProfilePhoto,
    removeProfilePhoto,
    uploadResume,
    removeResume,
  } = useAuth();

  // Local editable form state
  const [fullName, setFullName] = useState(profileData?.profile?.full_name || user?.fullName || '');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('Indian Institute of Science (IISc), Bengaluru');
  const [major, setMajor] = useState('Computer Science & Engineering');
  const [targetRole, setTargetRole] = useState('Machine Learning Research Engineer');
  const [gradYear, setGradYear] = useState('2027');
  const [headline, setHeadline] = useState('AI Engineering Track');

  // Profile save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable Skills state
  const [skills, setSkills] = useState<{
    programming: string[];
    frameworks: string[];
    tools: string[];
    technical: string[];
  }>({
    programming: ['Python', 'SQL', 'C++'],
    frameworks: ['PyTorch', 'TensorFlow', 'FastAPI'],
    tools: ['Git', 'Linux', 'Docker'],
    technical: ['Machine Learning', 'Data Structures', 'Deep Learning'],
  });
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'programming' | 'frameworks' | 'tools' | 'technical'>('programming');

  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Resume upload states
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const resolvedName = profileData?.profile?.full_name || user?.fullName;
    if (resolvedName) setFullName(resolvedName);
    if (user?.email || profileData?.profile?.email) setEmail(profileData?.profile?.email || user?.email || '');
    if (profileData) {
      if (profileData.profile?.headline) setHeadline(profileData.profile.headline);
      if (profileData.education?.college) setUniversity(profileData.education.college);
      if (profileData.education?.branch) setMajor(profileData.education.branch);
      if (profileData.education?.graduation_year) setGradYear(profileData.education.graduation_year);
      if (profileData.careerGoals?.desired_roles?.[0]) {
        setTargetRole(profileData.careerGoals.desired_roles[0]);
      }
      if (profileData.skills) {
        setSkills({
          programming: profileData.skills.programming || [],
          frameworks: profileData.skills.frameworks || [],
          tools: profileData.skills.tools || [],
          technical: profileData.skills.technical || [],
        });
      }
    }
  }, [user, profileData]);

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skills[newSkillCategory].some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    setSkills((prev) => ({
      ...prev,
      [newSkillCategory]: [...prev[newSkillCategory], trimmed],
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (category: 'programming' | 'frameworks' | 'tools' | 'technical', skillName: string) => {
    setSkills((prev) => ({
      ...prev,
      [category]: prev[category].filter((s) => s !== skillName),
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await saveProfile({
        profile: {
          full_name: fullName,
          email,
          headline,
        },
        education: {
          college: university,
          branch: major,
          graduation_year: gradYear,
        },
        skills,
        careerGoals: {
          desired_roles: [targetRole],
        },
        interests: profileData?.interests || {},
        resume: profileData?.resume || {},
      });
      setSaveSuccess('Profile and technical skills updated successfully! Your opportunity recommendations have updated.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PS';

  const avatarSrc = user?.avatarUrl || profileData?.profile?.avatar_url || '';

  // --------------------------------------------------------------------------
  // PROFILE PHOTO HANDLERS (Requirement 1)
  // --------------------------------------------------------------------------
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setPhotoSuccess(null);

    // File type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid file type. Please upload a JPEG, PNG, or WebP photo.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    // File size validation (Max 2MB)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setPhotoError(
        `Photo exceeds 2 MB limit (selected size: ${(file.size / (1024 * 1024)).toFixed(1)} MB). Please choose a smaller image.`
      );
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadProfilePhoto(file);
      setPhotoSuccess('Profile photo uploaded and updated across your dashboard!');
      setTimeout(() => setPhotoSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error uploading profile photo:', err);
      setPhotoError(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError(null);
    setPhotoSuccess(null);
    setIsUploadingPhoto(true);
    try {
      await removeProfilePhoto();
      setPhotoSuccess('Profile photo removed. Initial avatar restored.');
      setTimeout(() => setPhotoSuccess(null), 3000);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // --------------------------------------------------------------------------
  // RESUME UPDATE HANDLERS (Requirement 2)
  // --------------------------------------------------------------------------
  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeError(null);
    setResumeSuccess(null);

    // Extension validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setResumeError('Invalid file format. Please upload a PDF, DOCX, or TXT document.');
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    // Size validation (Max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setResumeError(
        `Resume exceeds 5 MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)} MB). Please compress your file.`
      );
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    setIsUploadingResume(true);
    try {
      await uploadResume(file);
      setResumeSuccess('Resume updated successfully! Recommendation profile synchronised.');
      setTimeout(() => setResumeSuccess(null), 4500);
    } catch (err: any) {
      console.error('Error updating resume:', err);
      setResumeError(err.message || 'Failed to update resume.');
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const handleRemoveResume = async () => {
    setResumeError(null);
    setResumeSuccess(null);
    setIsUploadingResume(true);
    try {
      await removeResume();
      setResumeSuccess('Resume removed from profile.');
      setTimeout(() => setResumeSuccess(null), 3000);
    } catch (err: any) {
      setResumeError(err.message || 'Failed to remove resume.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  // --------------------------------------------------------------------------
  // SAVE PROFILE FORM
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      await saveProfile({
        profile: {
          full_name: fullName,
          email,
          headline,
          avatar_url: avatarSrc,
        },
        education: {
          college: university,
          branch: major,
          degree: profileData?.education?.degree || 'Bachelor of Technology (B.Tech)',
          cgpa: profileData?.education?.cgpa || '8.8',
          graduation_year: gradYear,
        },
        skills: profileData?.skills || {
          programming: ['Python', 'TypeScript', 'C++', 'SQL'],
          frameworks: ['PyTorch', 'React'],
          tools: ['Docker', 'Git', 'Linux'],
          technical: ['Machine Learning', 'Data Structures'],
        },
        interests: profileData?.interests || {
          areas_of_interest: ['Generative AI & LLMs', 'Distributed Systems'],
          opportunity_categories: ['Scholarships', 'Internships', 'Research Opportunities'],
        },
        careerGoals: {
          desired_roles: [targetRole],
          preferred_domains: profileData?.careerGoals?.preferred_domains || ['AI Labs', 'Cloud Systems'],
          work_mode: profileData?.careerGoals?.work_mode || 'Hybrid or Remote',
          availability: profileData?.careerGoals?.availability || 'Summer 2026 Cohort',
        },
        resume: profileData?.resume || {},
      });

      setSaveSuccess('Profile changes saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveError(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentResume = profileData?.resume;
  const hasResume = Boolean(currentResume?.file_name || currentResume?.file_url);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-muted">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        subtitle="Manage your authenticated academic background, verified credentials, profile photo, and resume."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Account', href: '/dashboard' },
          { label: 'Profile' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            pill
            isLoading={isSaving}
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        }
      />

      {/* Global Feedback Banners */}
      {saveSuccess && (
        <div className="p-3.5 bg-mint-subtle border border-success/30 rounded-lg text-xs font-medium text-success flex items-center gap-2.5 animate-in fade-in-0">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-danger-subtle border border-danger/30 rounded-lg text-xs font-medium text-danger flex items-center gap-2.5 animate-in fade-in-0">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ====================================================================
          1. PROFILE OVERVIEW & PROFILE PHOTO (Requirement 1)
          ==================================================================== */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          
          {/* Avatar with Upload/Change Action Button */}
          <div className="relative group shrink-0">
            <Avatar
              size="xl"
              status="online"
              initials={initials}
              src={avatarSrc}
              className="w-24 h-24 text-2xl border-2 border-white shadow-md"
            />

            {/* Hidden Photo Input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {/* Quick Hover Overlay to change photo */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              title="Click to update photo"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Change</span>
            </button>
          </div>

          {/* Details & Actions */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-charcoal">{fullName}</h2>
              <Badge variant="mint" pill>
                <CheckCircle2 className="w-3.5 h-3.5" /> India-Eligible Student
              </Badge>
            </div>

            <p className="text-sm font-medium text-slate-muted flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-subtle shrink-0" />
              <span>{major} • {university}</span>
            </p>

            <p className="text-xs text-slate-subtle flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-subtle shrink-0" />
              <span>{email} • Class of {gradYear}</span>
            </p>

            {/* Photo Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                onClick={() => photoInputRef.current?.click()}
                isLoading={isUploadingPhoto}
                disabled={isUploadingPhoto}
                className="text-xs"
              >
                {avatarSrc ? 'Change Photo' : 'Upload Photo'}
              </Button>

              {avatarSrc && (
                <Button
                  variant="ghost"
                  size="sm"
                  pill
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="text-xs text-danger hover:bg-danger-subtle"
                >
                  Remove Photo
                </Button>
              )}

              <span className="text-[11px] text-slate-subtle">
                JPEG, PNG, WebP up to 2 MB
              </span>
            </div>

            {/* Photo Feedback Banners */}
            {photoSuccess && (
              <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}
            {photoError && (
              <div className="mt-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ====================================================================
          2. RESUME UPDATE SECTION (Requirement 2)
          ==================================================================== */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Resume & Professional Documents</span>
            </h3>
            <p className="text-xs text-slate-muted mt-0.5">
              Securely stored in Supabase Storage. Used exclusively by PathSync AI to calculate personalized match scores and skill gaps.
            </p>
          </div>

          <Badge variant="brand" pill className="self-start sm:self-auto">
            Recommendation Core
          </Badge>
        </div>

        {/* Hidden Resume Input */}
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleResumeSelect}
          className="hidden"
        />

        {/* Current Resume Display or Empty State */}
        {hasResume ? (
          <div className="p-4 bg-alternate rounded-xl border border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-charcoal truncate">
                  {currentResume?.file_name || 'Student_Resume.pdf'}
                </div>
                <div className="text-xs text-slate-muted flex items-center gap-2 mt-0.5">
                  <span>Size: {currentResume?.file_size || '1.4 MB'}</span>
                  <span>•</span>
                  <span>
                    Uploaded:{' '}
                    {currentResume?.uploaded_at
                      ? new Date(currentResume.uploaded_at).toLocaleDateString()
                      : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {currentResume?.file_url && (
                <a
                  href={currentResume.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    pill
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Resume
                  </Button>
                </a>
              )}

              <Button
                variant="primary"
                size="sm"
                pill
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => resumeInputRef.current?.click()}
                isLoading={isUploadingResume}
                disabled={isUploadingResume}
              >
                Replace Resume
              </Button>

              <Button
                variant="ghost"
                size="sm"
                pill
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                onClick={handleRemoveResume}
                disabled={isUploadingResume}
                className="text-danger hover:bg-danger-subtle"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-alternate rounded-xl border-2 border-dashed border-border-default text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-charcoal">No resume uploaded yet</h4>
              <p className="text-xs text-slate-muted max-w-md mx-auto">
                Upload your resume in PDF, DOCX, or TXT format (up to 5 MB) to activate automatic skill-gap mapping and personalized recommendations.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              pill
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => resumeInputRef.current?.click()}
              isLoading={isUploadingResume}
              disabled={isUploadingResume}
            >
              Upload Resume
            </Button>
          </div>
        )}

        {/* Resume Feedback Banners */}
        {resumeSuccess && (
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resumeSuccess}</span>
          </div>
        )}
        {resumeError && (
          <div className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{resumeError}</span>
          </div>
        )}
      </Card>

      {/* ====================================================================
          3. ACADEMIC & CAREER INFORMATION FORMS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-charcoal">Academic Information</h3>
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Institutional / Account Email"
            value={email}
            disabled
            helperText="Authenticated account email"
          />
          <Input
            label="College / University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
          <Input
            label="Primary Major / Branch"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-charcoal">Career Aspirations & Target Roles</h3>
          <Input
            label="Target Career Role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <Input
            label="Expected Graduation Year"
            value={gradYear}
            onChange={(e) => setGradYear(e.target.value)}
          />
          <Input
            label="Professional Headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <div className="pt-2">
            <span className="text-xs font-semibold text-charcoal block mb-1.5">
              Verified Badges
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand" pill>PyTorch Certified</Badge>
              <Badge variant="brand" pill>Distributed Systems CS-482</Badge>
              <Badge variant="mint" pill>Top 5% Math Foundations</Badge>
              <Badge variant="mint" pill>India SIH Eligible</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ====================================================================
          4. TECHNICAL SKILLS & SPECIALIZATIONS (Directly Drives AI Matching)
          ==================================================================== */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span>Technical Skills & Competencies</span>
            </h3>
            <p className="text-xs text-slate-muted mt-0.5">
              Directly analyzed by PathSync AI recommendation engine. Opportunities with matching required skills receive 90%+ match scores.
            </p>
          </div>
          <Badge variant="brand" pill className="self-start sm:self-auto">
            Recommendation Core
          </Badge>
        </div>

        {/* Add Skill Input */}
        <div className="p-4 bg-alternate rounded-xl border border-border-default space-y-3">
          <span className="text-xs font-bold text-charcoal block">Add New Skill:</span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-lg border border-border-default bg-surface font-medium text-charcoal focus:outline-none focus:border-primary"
            >
              <option value="programming">Programming Languages</option>
              <option value="frameworks">Frameworks & Libraries</option>
              <option value="tools">Tools & Platforms</option>
              <option value="technical">Technical Competencies</option>
            </select>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. React, Python, Go, Docker, PyTorch, Kubernetes..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border-default bg-surface text-charcoal placeholder:text-slate-subtle focus:outline-none focus:border-primary"
              />
              <Button
                variant="primary"
                size="sm"
                pill
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddSkill}
              >
                Add Skill
              </Button>
            </div>
          </div>
        </div>

        {/* Skill Category Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'programming' as const, label: 'Programming Languages', color: 'bg-blue-50 text-blue-900 border-blue-200' },
            { key: 'frameworks' as const, label: 'Frameworks & Libraries', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
            { key: 'tools' as const, label: 'Tools & DevOps', color: 'bg-purple-50 text-purple-900 border-purple-200' },
            { key: 'technical' as const, label: 'Technical Domains', color: 'bg-amber-50 text-amber-900 border-amber-200' },
          ]).map(({ key, label, color }) => (
            <div key={key} className="p-4 bg-surface rounded-xl border border-border-default space-y-2">
              <span className="text-xs font-bold text-charcoal flex items-center justify-between">
                <span>{label}</span>
                <span className="text-[11px] font-normal text-slate-subtle">({skills[key].length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {skills[key].map((skill) => (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${color}`}
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(key, skill)}
                      className="hover:opacity-75 cursor-pointer"
                      title={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {skills[key].length === 0 && (
                  <span className="text-xs text-slate-subtle italic">No skills added in this category</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Save All Profile Data & Feedback */}
        <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-muted">
            Saving updates will immediately re-rank opportunities on your Dashboard and Discover feeds.
          </div>
          <Button
            variant="primary"
            size="md"
            pill
            onClick={handleSaveProfile}
            isLoading={isSaving}
            disabled={isSaving}
            className="shadow-brand font-semibold self-end sm:self-auto"
          >
            Save Profile & Skills
          </Button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
