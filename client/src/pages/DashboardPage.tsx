import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { calculateOpportunityMatch } from '@/services/recommendationEngine';
import { checkOpportunityEligibility } from '@/services/eligibilityService';
import { calculateDeadlineIntelligence } from '@/services/notificationService';
import {
  StatCard,
  Card,
  Button,
  Badge,
  OpportunityCard,
} from '@/components/ui';
import { getActiveVerifiedOpportunities } from '@/services/dataCollection';
import { mockOpportunities } from '@/data/mockData';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  Compass,
  Bookmark,
  Send,
  UserCheck,
  Clock,
  Award,
  ChevronRight,
  Filter,
  Code2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profileData, isLoading } = useAuth();

  // Consistent source of truth for student name strictly from authenticated profile or user session
  const studentName = profileData?.profile?.full_name || user?.fullName || 'Student';
  const targetRole = profileData?.careerGoals?.desired_roles?.[0] || 'Software Engineer';
  const university = profileData?.education?.college || 'Academic Institution';
  const major = profileData?.education?.branch || 'Computer Science & Engineering';

  // Effective student profile data strictly from authenticated student profile or user session
  const effectiveProfileData = useMemo(() => {
    return profileData || {
      profile: {
        id: user?.id || 'std',
        full_name: studentName,
        email: user?.email || '',
        headline: 'PathSync AI Student',
        role: 'student' as const,
      },
      education: {},
      skills: { programming: [], frameworks: [], tools: [], technical: [] },
      interests: { areas_of_interest: [], opportunity_categories: [] },
      careerGoals: {},
      resume: {},
    };
  }, [profileData, user, studentName]);

  // Flattened active skills list for student badge display from authenticated profile
  const activeStudentSkills = useMemo(() => {
    return [
      ...(effectiveProfileData.skills?.programming || []),
      ...(effectiveProfileData.skills?.frameworks || []),
      ...(effectiveProfileData.skills?.tools || []),
      ...(effectiveProfileData.skills?.technical || []),
    ];
  }, [effectiveProfileData]);

  // Active Category Filter for Opportunity Feed
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Saved Opportunities Local State
  const [savedIds, setSavedIds] = useState<string[]>(
    mockOpportunities.filter((o) => o.isSaved).map((o) => o.id)
  );

  const toggleSaveOpportunity = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Pre-calculate personalized matching for dashboard feed ONLY for VERIFIED opportunities
  // Dynamic skill matching ranks opportunities familiar with the student's skills at the top
  const opportunitiesWithMatch = useMemo(() => {
    const verifiedPool = getActiveVerifiedOpportunities();
    return verifiedPool
      .map((opp) => {
        const analysis = calculateOpportunityMatch(opp, effectiveProfileData);
        const eligibility = checkOpportunityEligibility(opp, effectiveProfileData);
        return {
          ...opp,
          matchScore: analysis.matchScore,
          whyReasons: analysis.whyReasons,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          missingSkills: analysis.skillsAnalysis.missingSkills,
          matchPercentage: analysis.skillsAnalysis.matchPercentage,
          eligibilityStatus: eligibility.status,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [effectiveProfileData]);

  // Filtered Opportunities
  const filteredOpportunities = opportunitiesWithMatch.filter((opp) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Research') return opp.category.includes('Research');
    if (activeFilter === 'Scholarships') return opp.category.includes('Scholarship');
    if (activeFilter === 'Internships') return opp.category.includes('Internship') || opp.type === 'internship';
    if (activeFilter === 'Hackathons') return opp.category.includes('Hackathon') || opp.type === 'hackathon';
    if (activeFilter === 'Certifications') return opp.category.includes('Certification') || opp.type === 'certification';
    return true;
  });

  // STEP 16: Deadline intelligence calculation for dashboard widget
  const upcomingDeadlines = useMemo(() => {
    return getActiveVerifiedOpportunities()
      .filter((opp) => opp.deadline)
      .map((opp) => ({
        ...opp,
        intel: calculateDeadlineIntelligence(opp.deadline),
      }))
      .sort((a, b) => a.intel.daysRemaining - b.intel.daysRemaining)
      .slice(0, 3);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-muted">Loading your personalized dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      
      {/* ====================================================================
          1. WELCOME SECTION & 2. PROFILE COMPLETION (HERO BANNER)
          ==================================================================== */}
      <section className="bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-subtle/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Personalized Welcome Message */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="brand" pill className="text-[11px] font-semibold">
                • ACADEMIC CYCLE 2026 ACTIVE
              </Badge>
              <span className="text-xs text-slate-subtle hidden sm:inline-block">
                Last synced with admissions registries today
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
              Welcome back, {studentName}
            </h1>

            <p className="text-sm text-slate-muted leading-relaxed">
              We analyzed 340+ opportunities matching your <strong className="text-charcoal font-semibold">{targetRole}</strong> path and academic focus in <span className="text-charcoal">{major}</span> at <span className="text-charcoal">{university}</span>. 14 new verified opportunities align with your roadmap this week.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/discover">
                <Button variant="primary" size="sm" pill leftIcon={<Compass className="w-4 h-4" />} className="shadow-brand">
                  Explore Recommended Matches
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" size="sm" pill leftIcon={<UserCheck className="w-4 h-4" />}>
                  Review Academic Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Profile Completion Box (Section 2) */}
          <div className="bg-alternate border border-border-default rounded-xl p-5 sm:p-6 lg:w-80 shrink-0 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-subtle text-primary flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-charcoal">Profile Status</span>
              </div>
              <Badge variant="mint" pill className="text-[11px] font-bold">
                80% Complete
              </Badge>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-charcoal">Profile 80% complete</span>
                <span className="text-primary font-bold">4 of 5 Verified</span>
              </div>
              <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: '80%' }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-muted leading-relaxed">
              Add your verified GitHub profile or link your Fall transcript to reach 100% discovery priority.
            </p>

            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors group"
            >
              <span>Complete Profile (20% Remaining)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>


      {/* ====================================================================
          3. OPPORTUNITY OVERVIEW (4 KEY METRIC CARDS)
          ==================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-subtle uppercase tracking-wider">
            Opportunity Overview
          </h2>
          <span className="text-xs text-slate-muted">Real-time matching metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: New Opportunities */}
          <StatCard
            icon={<Sparkles className="w-5 h-5 text-primary" />}
            value="28 New"
            label="New Opportunities"
            subtext="Added in the last 7 days"
            trend={{ value: '+12% this week', isPositive: true }}
          />

          {/* Card 2: Recommended */}
          <StatCard
            icon={<Target className="w-5 h-5 text-primary" />}
            value="14 Matches"
            label="Recommended for You"
            subtext="90%+ match with your profile"
            trend={{ value: 'Highest fit: 98%', isPositive: true }}
          />

          {/* Card 3: Saved */}
          <StatCard
            icon={<Bookmark className="w-5 h-5 text-primary" />}
            value={`${savedIds.length} Saved`}
            label="Saved Paths"
            subtext="2 deadlines closing in 14 days"
          />

          {/* Card 4: Applications */}
          <StatCard
            variant="dark"
            icon={<Send className="w-5 h-5 text-mint" />}
            value="3 Active"
            label="Applications Submitted"
            subtext="1 under faculty committee review"
          />

        </div>
      </section>


      {/* ====================================================================
          5. QUICK ACTIONS SECTION
          ==================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-subtle uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-muted">High-priority student tasks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: Discover */}
          <Link
            to="/discover"
            className="bg-surface hover:bg-alternate border border-border-default hover:border-primary-border rounded-xl p-4.5 transition-all duration-200 shadow-xs hover:shadow-sm flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-subtle text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-charcoal group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Discover Opportunities</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-muted mt-0.5 leading-snug">
                Browse 340+ verified grants, residencies & scholarships.
              </p>
            </div>
          </Link>

          {/* Action 2: Complete Profile */}
          <Link
            to="/profile"
            className="bg-surface hover:bg-alternate border border-border-default hover:border-primary-border rounded-xl p-4.5 transition-all duration-200 shadow-xs hover:shadow-sm flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-mint-subtle text-success flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-charcoal group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Complete Profile</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-muted mt-0.5 leading-snug">
                Update GPA, specialized skills & target timeline.
              </p>
            </div>
          </Link>

          {/* Action 3: Check Skill Gaps */}
          <Link
            to="/skill-gap"
            className="bg-surface hover:bg-alternate border border-border-default hover:border-primary-border rounded-xl p-4.5 transition-all duration-200 shadow-xs hover:shadow-sm flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-subtle text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-charcoal group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Check Skill Gaps</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-muted mt-0.5 leading-snug">
                Compare skills against requirements for Stanford lab.
              </p>
            </div>
          </Link>

          {/* Action 4: View Applications */}
          <Link
            to="/applications"
            className="bg-surface hover:bg-alternate border border-border-default hover:border-primary-border rounded-xl p-4.5 transition-all duration-200 shadow-xs hover:shadow-sm flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-subtle text-slate-subtle group-hover:text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-charcoal group-hover:text-primary transition-colors flex items-center gap-1">
                <span>View Applications</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-muted mt-0.5 leading-snug">
                Track submitted portfolios and interview schedules.
              </p>
            </div>
          </Link>

        </div>
      </section>


      {/* ====================================================================
          MAIN 2-COLUMN CONTENT GRID
          Left: 4. Personalized Opportunity Feed (MAIN FOCUS)
          Right: 6. Supporting Insights & Deadlines
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ==================================================================
            4. PERSONALIZED OPPORTUNITY FEED (MAIN FOCUS - 2 Columns)
            ================================================================== */}
        <section className="lg:col-span-2 space-y-5">
          
          {/* Feed Header & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" pill className="text-[10px]">
                  AI-POWERED FEED
                </Badge>
                <span className="text-xs text-slate-subtle">
                  Curated for {targetRole}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-charcoal mt-1">
                Personalized Opportunity Feed
              </h2>
            </div>

            <Link
              to="/discover"
              className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Explore all {opportunitiesWithMatch.length} tracks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Personalized Student Context Bar & Verified Skills Indicator */}
          <div className="bg-gradient-to-r from-primary-subtle/40 via-surface to-emerald-50/30 border border-primary-border/30 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {studentName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'ST'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-charcoal flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-muted">Personalizing for:</span>
                    <span className="text-primary font-extrabold">{studentName}</span>
                    <Badge variant="brand" pill className="text-[10px]">
                      {targetRole}
                    </Badge>
                  </h3>
                </div>
              </div>

              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover px-3 py-1.5 rounded-full bg-white border border-primary-border/40 hover:border-primary shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <span>My Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Active Student Skills Chips */}
            <div className="pt-2 border-t border-primary-border/20 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-subtle uppercase tracking-wider mr-1">
                Active Student Skills:
              </span>
              {activeStudentSkills.length > 0 ? (
                <>
                  {activeStudentSkills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-charcoal border border-border-default px-2 py-0.5 rounded-md shadow-2xs"
                    >
                      <Code2 className="w-2.5 h-2.5 text-primary" />
                      <span>{skill}</span>
                    </span>
                  ))}
                  {activeStudentSkills.length > 8 && (
                    <span className="text-[10px] text-slate-subtle px-1">
                      +{activeStudentSkills.length - 8} more
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-slate-muted italic">
                  No skills listed yet.{' '}
                  <Link to="/profile" className="text-primary font-semibold hover:underline">
                    Add skills in My Profile
                  </Link>
                </span>
              )}
            </div>
          </div>

          {/* Category Filter Pills & Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-muted flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-subtle" />
                <span>Filter:</span>
              </span>
              {['All', 'Internships', 'Research', 'Hackathons', 'Scholarships', 'Certifications'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer shrink-0 border ${
                    activeFilter === tab
                      ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                      : 'bg-surface text-slate-muted border-border-default hover:border-primary-border hover:text-charcoal'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-subtle shrink-0">
              Showing <strong className="text-charcoal">{filteredOpportunities.length}</strong> Opportunities (Top fit first)
            </span>
          </div>

          {/* Cards Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                {...opp}
                isSaved={savedIds.includes(opp.id)}
                onSave={() => toggleSaveOpportunity(opp.id)}
                onApply={() => navigate(`/opportunity/${opp.id}`)}
              />
            ))}
          </div>

          {/* Bottom Feed Banner */}
          <div className="bg-alternate border border-border-default rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-charcoal">Want more tailored opportunities?</h4>
                <p className="text-xs text-slate-muted">
                  Update your research preferences and location filters to receive real-time email alerts.
                </p>
              </div>
            </div>
            <Link to="/discover" className="shrink-0">
              <Button variant="outline" size="sm" pill>
                Customize Matching Filters
              </Button>
            </Link>
          </div>

        </section>


        {/* ==================================================================
            6. SUPPORTING INSIGHTS (RIGHT SIDEBAR COLUMN)
            Small cards for:
            - Skill Gap
            - Learning Progress
            - Placement Readiness
            ================================================================== */}
        <aside className="space-y-6">
          
          <div className="pb-1 border-b border-border-subtle">
            <h2 className="text-sm font-bold text-slate-subtle uppercase tracking-wider">
              Supporting Insights
            </h2>
            <span className="text-xs text-slate-muted">Readiness and milestone analytics</span>
          </div>

          {/* Insight 1: Skill Gap Card */}
          <Card className="p-5.5 space-y-3.5 border-border-default hover:border-primary-border transition-colors">
            <div className="flex items-center justify-between">
              <Badge variant="brand" pill className="text-[10px]">
                PREREQUISITE RADAR
              </Badge>
              <div className="w-7 h-7 rounded-md bg-primary-subtle text-primary flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-charcoal">
                PyTorch Distributed & Model Parallelism
              </h3>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Identified as the key missing requirement across <strong className="text-charcoal font-semibold">4 high-match lab residencies</strong>. Closing this gap elevates match score from <span className="text-primary font-bold">90% → 98%</span>.
              </p>
            </div>

            <div className="p-3 bg-alternate rounded-lg border border-border-subtle flex items-center justify-between text-xs">
              <span className="text-slate-muted">Curated labs available:</span>
              <span className="font-bold text-charcoal">2 Modules</span>
            </div>

            <Link to="/skill-gap" className="block pt-1">
              <Button variant="outline" size="sm" pill className="w-full justify-between" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Analyze Skill Gaps
              </Button>
            </Link>
          </Card>

          {/* Insight 2: Learning Progress Card */}
          <Card className="p-5.5 space-y-3.5 border-border-default hover:border-primary-border transition-colors">
            <div className="flex items-center justify-between">
              <Badge variant="mint" pill className="text-[10px]">
                ACTIVE CURRICULUM
              </Badge>
              <div className="w-7 h-7 rounded-md bg-mint-subtle text-success flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-charcoal">
                Foundation Model Engineering
              </h3>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Module 4 of 6: Transformer Architectures and Self-Attention Optimization.
              </p>
            </div>

            {/* Progress Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-charcoal">Curriculum Progress</span>
                <span className="text-primary font-bold">68% Done</span>
              </div>
              <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: '68%' }}
                />
              </div>
            </div>

            <Link to="/learning" className="block pt-1">
              <Button variant="primary" size="sm" pill className="w-full justify-between shadow-brand" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Resume Learning Plan
              </Button>
            </Link>
          </Card>

          {/* Insight 3: Placement Readiness Card (Featured Forest Theme) */}
          <Card variant="forest" className="p-5.5 space-y-3.5 text-white">
            <div className="flex items-center justify-between">
              <Badge variant="dark" pill className="text-[10px]">
                COHORT BENCHMARK
              </Badge>
              <div className="w-7 h-7 rounded-md bg-white/15 text-mint flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-white">94% Readiness</div>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                Frontier Lab Placement Standing
              </h3>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                Your profile ranks in the <strong className="text-mint font-semibold">top 5th percentile</strong> among collegiate applicants targeting Stanford AI Lab and Deep Learning research cohorts.
              </p>
            </div>

            <div className="p-3 bg-white/10 rounded-lg border border-white/15 text-xs text-slate-100 space-y-1">
              <div className="flex justify-between">
                <span>Academic Record:</span>
                <span className="font-semibold text-mint">98% Verified</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Skills:</span>
                <span className="font-semibold text-mint">92% Matched</span>
              </div>
            </div>

            <Link to="/readiness" className="block pt-1">
              <Button variant="light" size="sm" pill className="w-full justify-between" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Full Readiness Report
              </Button>
            </Link>
          </Card>

          {/* STEP 16: Upcoming Deadlines Widget with Deadline Intelligence */}
          <Card className="p-5.5 space-y-3.5 border-border-default shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Upcoming Deadlines</span>
              </h4>
              <Badge variant="brand" className="text-[10px] py-0 px-1.5 font-bold">
                {upcomingDeadlines.length} Active
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {upcomingDeadlines.map((opp) => (
                <Link
                  key={opp.id}
                  to={`/opportunity/${opp.id}`}
                  className="block p-3 rounded-xl bg-alternate hover:bg-subtle border border-border-subtle transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-charcoal group-hover:text-primary transition-colors truncate text-xs">
                        {opp.title}
                      </div>
                      <div className="text-[11px] text-slate-subtle truncate mt-0.5">
                        {opp.organization}
                      </div>
                    </div>
                    
                    {/* Urgency indicator badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${opp.intel.colorClasses.bg} ${opp.intel.colorClasses.text} ${opp.intel.colorClasses.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opp.intel.colorClasses.dot}`} />
                      <span>{opp.intel.badgeLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-subtle mt-2 pt-1.5 border-t border-border-subtle/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-subtle" />
                      <span>Deadline: <strong className="text-charcoal font-medium">{opp.deadline}</strong></span>
                    </span>
                    <span className="text-primary font-semibold text-[10px] group-hover:underline flex items-center gap-0.5">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link to="/saved" className="block pt-1">
              <Button variant="light" size="sm" pill className="w-full justify-between text-xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Saved Deadlines
              </Button>
            </Link>
          </Card>

        </aside>

      </div>

    </div>
  );
};
