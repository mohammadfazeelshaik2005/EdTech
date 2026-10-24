import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { calculateOpportunityMatch } from '@/services/recommendationEngine';
import { checkOpportunityEligibility } from '@/services/eligibilityService';
import {
  OpportunityCard,
  Input,
  Select,
  Button,
  Badge,
  EmptyState,
} from '@/components/ui';
import { getActiveVerifiedOpportunities } from '@/services/dataCollection';
import { mockOpportunities } from '@/data/mockData';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  Trophy,
  BadgeCheck,
  Check,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profileData, isLoading } = useAuth();

  // Consistent source of truth for student name strictly from authenticated profile or user session
  const studentName = profileData?.profile?.full_name || user?.fullName || 'Student';
  const targetRole = profileData?.careerGoals?.desired_roles?.[0] || 'Software Engineer';

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

  // Flattened active skills list for student badge display
  const activeStudentSkills = useMemo(() => {
    return [
      ...(effectiveProfileData.skills?.programming || []),
      ...(effectiveProfileData.skills?.frameworks || []),
      ...(effectiveProfileData.skills?.tools || []),
      ...(effectiveProfileData.skills?.technical || []),
    ];
  }, [effectiveProfileData]);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Primary Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Multi-dimensional filter states
  const [selectedEligibility, setSelectedEligibility] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedDeadline, setSelectedDeadline] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedEduLevel, setSelectedEduLevel] = useState<string>('All');

  // Sort state
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'compensation'>('match');

  // Mobile filters drawer / collapse toggle
  const [showFilters, setShowFilters] = useState(false);

  // Saved Opportunities Local State
  const [savedIds, setSavedIds] = useState<string[]>(
    mockOpportunities.filter((o) => o.isSaved).map((o) => o.id)
  );

  const toggleSaveOpportunity = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter categories definition
  const categoryTabs = [
    { label: 'All Opportunities', value: 'All', icon: Sparkles },
    { label: 'Internships', value: 'Internships', icon: Briefcase },
    { label: 'Research Opportunities', value: 'Research Opportunities', icon: FlaskConical },
    { label: 'Hackathons', value: 'Hackathons', icon: Code2 },
    { label: 'Scholarships', value: 'Scholarships', icon: GraduationCap },
    { label: 'Competitions', value: 'Competitions', icon: Trophy },
    { label: 'Certifications', value: 'Certifications', icon: BadgeCheck },
  ];

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedEligibility !== 'All') count++;
    if (selectedLocation !== 'All') count++;
    if (selectedMode !== 'All') count++;
    if (selectedDeadline !== 'All') count++;
    if (selectedSkill !== 'All') count++;
    if (selectedEduLevel !== 'All') count++;
    return count;
  }, [
    selectedCategory,
    selectedEligibility,
    selectedLocation,
    selectedMode,
    selectedDeadline,
    selectedSkill,
    selectedEduLevel,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedEligibility('All');
    setSelectedLocation('All');
    setSelectedMode('All');
    setSelectedDeadline('All');
    setSelectedSkill('All');
    setSelectedEduLevel('All');
    setSortBy('match');
  };

  // Pre-calculate personalized matching & eligibility ONLY for VERIFIED opportunities
  // Adapts dynamically based on active student skills
  const opportunitiesWithMatch = useMemo(() => {
    const verifiedPool = getActiveVerifiedOpportunities();
    return verifiedPool.map((opp) => {
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
    });
  }, [effectiveProfileData]);

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunitiesWithMatch
      .filter((opp) => {
        // Search term filter: title, organization, description, skills
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesTitle = opp.title.toLowerCase().includes(query);
          const matchesOrg = opp.organization.toLowerCase().includes(query);
          const matchesDesc = opp.description.toLowerCase().includes(query);
          const matchesSkills = opp.requiredSkills?.some((s) =>
            s.toLowerCase().includes(query)
          );
          if (!matchesTitle && !matchesOrg && !matchesDesc && !matchesSkills) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && opp.category !== selectedCategory) {
          return false;
        }

        // Mode filter
        if (selectedMode !== 'All' && opp.mode !== selectedMode) {
          return false;
        }

        // Education Level filter
        if (
          selectedEduLevel !== 'All' &&
          opp.educationLevel !== 'All Levels' &&
          opp.educationLevel !== selectedEduLevel
        ) {
          return false;
        }

        // Location filter
        if (selectedLocation !== 'All') {
          if (!opp.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
            return false;
          }
        }

        // Skills filter
        if (selectedSkill !== 'All') {
          if (
            !opp.requiredSkills?.some((s) =>
              s.toLowerCase().includes(selectedSkill.toLowerCase())
            )
          ) {
            return false;
          }
        }

        // Eligibility filter
        if (selectedEligibility !== 'All') {
          if (selectedEligibility === 'Eligible Only' && opp.eligibilityStatus !== 'Eligible') {
            return false;
          }
          if (selectedEligibility === 'Min 3.5 GPA' && !opp.eligibility?.includes('3.5')) {
            return false;
          }
          if (
            selectedEligibility === 'Undergraduate' &&
            !opp.eligibility?.toLowerCase().includes('undergraduate') &&
            opp.educationLevel !== 'Undergraduate'
          ) {
            return false;
          }
        }

        // Deadline filter
        if (selectedDeadline !== 'All') {
          if (selectedDeadline === 'April 2026' && !opp.deadline?.includes('April')) {
            return false;
          }
          if (selectedDeadline === 'May 2026' && !opp.deadline?.includes('May')) {
            return false;
          }
          if (selectedDeadline === 'June 2026' && !opp.deadline?.includes('June')) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        if (sortBy === 'deadline') {
          return (a.deadline || '').localeCompare(b.deadline || '');
        }
        return 0;
      });
  }, [
    opportunitiesWithMatch,
    searchTerm,
    selectedCategory,
    selectedEligibility,
    selectedLocation,
    selectedMode,
    selectedDeadline,
    selectedSkill,
    selectedEduLevel,
    sortBy,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-muted">Loading verified opportunities for your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      
      {/* ====================================================================
          TOP HERO HEADER (Large heading & Personalized Discovery narrative)
          ==================================================================== */}
      <section className="bg-surface border border-border-default rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        {/* Subtle decorative radial light */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-subtle/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2">
            <Badge variant="brand" pill className="text-[11px] font-semibold">
              • PERSONALIZED OPPORTUNITY ENGINE
            </Badge>
            <span className="text-xs text-slate-subtle hidden sm:inline-block">
              Curated for your verified academic track
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
            Discover Opportunities That Match Your Path
          </h1>

          <p className="text-sm sm:text-base text-slate-muted leading-relaxed">
            PathSync AI constantly monitors and verifies merit scholarships, frontier engineering residencies, collegiate hackathons, academic research laboratories, algorithmic competitions, and micro-certifications to discover ideal fits for your profile.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-muted">
            <span className="flex items-center gap-1.5 font-medium text-charcoal">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>100% Institutionally Verified</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-charcoal">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>Prerequisites & GPA Clear</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-charcoal">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>Zero Sponsored Spam</span>
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          STUDENT SKILL MATCHING CONTEXT BAR
          ==================================================================== */}
      <section className="bg-gradient-to-r from-primary-subtle/40 via-surface to-emerald-50/30 border border-primary-border/40 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-charcoal">Matching Against Student Skills:</span>
                <span className="text-xs font-bold text-primary">{studentName}</span>
                <Badge variant="brand" pill className="text-[10px]">{targetRole}</Badge>
              </div>
              <p className="text-[11px] text-slate-muted mt-0.5">
                Opportunities are ranked and filtered dynamically using your verified academic profile and skills.
              </p>
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

        {/* Active Skills Chips */}
        <div className="pt-2 border-t border-primary-border/20 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-subtle uppercase tracking-wider mr-1">
            Student Technical Skills:
          </span>
          {activeStudentSkills.length > 0 ? (
            <>
              {activeStudentSkills.slice(0, 10).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-charcoal border border-border-default px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <Code2 className="w-2.5 h-2.5 text-primary" />
                  <span>{skill}</span>
                </span>
              ))}
              {activeStudentSkills.length > 10 && (
                <span className="text-[10px] text-slate-subtle px-1">
                  +{activeStudentSkills.length - 10} more
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
      </section>

      {/* ====================================================================
          SEARCH & ADVANCED MULTI-DIMENSIONAL FILTERS
          ==================================================================== */}
      <section className="bg-surface border border-border-default rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* Main Search Input & Mobile Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search opportunities by title, organization, technology, or topic (e.g. Stanford, Quantum, PyTorch, Summer 2026)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4.5 h-4.5 text-slate-subtle" />}
              pill
              className="py-2.5 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-subtle hover:text-charcoal cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 min-w-[170px]">
              <ArrowUpDown className="w-4 h-4 text-slate-subtle shrink-0 hidden sm:inline-block" />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs py-2.5"
              >
                <option value="match">Sort by: Highest Match</option>
                <option value="deadline">Sort by: Deadline</option>
              </Select>
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              type="button"
              variant={showFilters ? 'primary' : 'outline'}
              size="md"
              pill
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              className="lg:hidden shrink-0"
            >
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Button>
          </div>
        </div>

        {/* 6 Core Category Pills */}
        <div className="space-y-2 pt-1 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-subtle uppercase tracking-wider">
              Opportunity Categories
            </span>
            <span className="text-xs text-slate-subtle">
              Showing {filteredOpportunities.length} opportunities
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryTabs.map((tab) => {
              const isSelected = selectedCategory === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedCategory(tab.value)}
                  className={`inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full font-semibold transition-all duration-150 cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-brand'
                      : 'bg-alternate text-slate-muted border-border-default hover:border-primary-border hover:text-charcoal'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Panel (Desktop & Collapsible Mobile) */}
        <div className={`pt-4 border-t border-border-subtle ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            {/* Filter 1: Eligibility */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Eligibility
              </label>
              <Select
                value={selectedEligibility}
                onChange={(e) => setSelectedEligibility(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Eligibility</option>
                <option value="Eligible Only">✓ Pre-qualified Eligible</option>
                <option value="Min 3.5 GPA">Min 3.5+ CGPA</option>
                <option value="Undergraduate">Undergraduate Standing</option>
              </Select>
            </div>

            {/* Filter 2: Location */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Location
              </label>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Locations</option>
                <option value="Palo Alto">Palo Alto / Stanford</option>
                <option value="Cambridge">Cambridge / Boston</option>
                <option value="San Francisco">San Francisco, CA</option>
                <option value="New York">New York, NY</option>
                <option value="Canada">US & Canada</option>
              </Select>
            </div>

            {/* Filter 3: Mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Work Mode
              </label>
              <Select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Modes</option>
                <option value="Remote">100% Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="In-Person">In-Person / On-Site</option>
              </Select>
            </div>

            {/* Filter 4: Deadline */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Deadline
              </label>
              <Select
                value={selectedDeadline}
                onChange={(e) => setSelectedDeadline(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Deadlines</option>
                <option value="April 2026">April 2026 (Closing Soon)</option>
                <option value="May 2026">May 2026</option>
                <option value="June 2026">June 2026 Cohort</option>
              </Select>
            </div>

            {/* Filter 5: Required Skills */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Core Skill
              </label>
              <Select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Core Skills</option>
                <option value="Python">Python</option>
                <option value="PyTorch">PyTorch</option>
                <option value="C++">C++</option>
                <option value="Kubernetes">Kubernetes & Cloud</option>
                <option value="TypeScript">TypeScript & Web</option>
                <option value="Bioinformatics">Bioinformatics</option>
              </Select>
            </div>

            {/* Filter 6: Education Level */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Education Level
              </label>
              <Select
                value={selectedEduLevel}
                onChange={(e) => setSelectedEduLevel(e.target.value)}
                className="text-xs py-2"
              >
                <option value="All">All Degree Levels</option>
                <option value="Undergraduate">Undergraduate (B.S./B.Tech)</option>
                <option value="Masters">Masters (M.S.)</option>
                <option value="All Levels">Open to All Students</option>
              </Select>
            </div>

          </div>

          {/* Active Filter Chips and Reset Action */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-3 border-t border-border-subtle">
              <span className="text-xs font-semibold text-slate-subtle">Active Filters:</span>

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-primary-subtle text-primary text-xs font-semibold px-2.5 py-1 rounded-full border border-primary/20">
                  <span>Category: {selectedCategory}</span>
                  <button type="button" onClick={() => setSelectedCategory('All')} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMode !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-alternate text-charcoal text-xs font-medium px-2.5 py-1 rounded-full border border-border-default">
                  <span>Mode: {selectedMode}</span>
                  <button type="button" onClick={() => setSelectedMode('All')} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedLocation !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-alternate text-charcoal text-xs font-medium px-2.5 py-1 rounded-full border border-border-default">
                  <span>Location: {selectedLocation}</span>
                  <button type="button" onClick={() => setSelectedLocation('All')} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSkill !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-alternate text-charcoal text-xs font-medium px-2.5 py-1 rounded-full border border-border-default">
                  <span>Skill: {selectedSkill}</span>
                  <button type="button" onClick={() => setSelectedSkill('All')} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedEduLevel !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-alternate text-charcoal text-xs font-medium px-2.5 py-1 rounded-full border border-border-default">
                  <span>Level: {selectedEduLevel}</span>
                  <button type="button" onClick={() => setSelectedEduLevel('All')} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer ml-auto"
              >
                Clear All Filters ({activeFilterCount})
              </button>
            </div>
          )}
        </div>

      </section>


      {/* ====================================================================
          OPPORTUNITY FEED GRID (Structured Cards with Full Metadata)
          ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-charcoal">
              Available Opportunities
            </h2>
            <Badge variant="neutral" pill className="text-xs">
              {filteredOpportunities.length} matches
            </Badge>
          </div>

          <span className="text-xs text-slate-subtle hidden sm:inline-block">
            Ranked by candidate profile compatibility
          </span>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : (
          <EmptyState
            title="No Opportunities Match Your Current Filters"
            description="We couldn't find any opportunities matching your active combination of search query, category, skills, and eligibility criteria. Try clearing some filters to broaden your discovery."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        )}
      </section>

    </div>
  );
};
