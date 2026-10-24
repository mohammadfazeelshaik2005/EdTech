import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  PageHeader,
  OpportunityCard,
  EmptyState,
  Badge,
  Button,
  Input,
} from '@/components/ui';
import { Opportunity } from '@/types';
import { mockOpportunities } from '@/data/mockData';
import { getAllOpportunitiesForAdmin } from '@/services/dataCollection';
import { calculateOpportunityMatch } from '@/services/recommendationEngine';
import { checkOpportunityEligibility } from '@/services/eligibilityService';
import { addApplicationFromOpportunity } from '@/services/trackerService';
import {
  Bookmark,
  Search,
  ArrowRight,
  Send,
  ShieldCheck,
} from 'lucide-react';

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { profileData } = useAuth();

  // Search and category filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Local state for saved IDs (prepopulated with the saved ones in mock data)
  const [savedIds, setSavedIds] = useState<string[]>(
    mockOpportunities.filter((o) => o.isSaved).map((o) => o.id)
  );

  const [notification, setNotification] = useState<string | null>(null);

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleTrackOpportunity = (opp: Opportunity) => {
    addApplicationFromOpportunity(opp, 'Planning to Apply', 'Added from Saved Opportunities');
    setNotification(`"${opp.title}" added to Application Tracker.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Pre-calculate matching & eligibility for saved opportunities
  const savedOpportunities = useMemo(() => {
    const allOpps = getAllOpportunitiesForAdmin();
    return allOpps
      .filter((opp) => savedIds.includes(opp.id))
      .map((opp) => {
        const match = calculateOpportunityMatch(opp, profileData);
        const eligibility = checkOpportunityEligibility(opp, profileData);
        return {
          ...opp,
          matchScore: match.matchScore,
          whyReasons: match.whyReasons,
          matchedSkills: match.skillsAnalysis.matchedSkills,
          eligibilityStatus: eligibility.status,
        };
      })
      .filter((opp) => {
        if (selectedCategory !== 'All' && opp.category !== selectedCategory) {
          return false;
        }
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          return (
            opp.title.toLowerCase().includes(query) ||
            opp.organization.toLowerCase().includes(query) ||
            opp.description.toLowerCase().includes(query)
          );
        }
        return true;
      });
  }, [savedIds, profileData, selectedCategory, searchTerm]);

  const categories = [
    'All',
    'Research Opportunities',
    'Scholarships',
    'Internships',
    'Hackathons',
    'Competitions',
    'Certifications',
  ];

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      
      {/* Page Header */}
      <PageHeader
        title="Saved Opportunities & Pathways"
        subtitle="Manage your bookmarked residencies, grants, and programs. Prepare materials and track admission milestones."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Saved' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/applications">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Go to Application Tracker
              </Button>
            </Link>
            <Link to="/discover">
              <Button
                variant="primary"
                size="sm"
                pill
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="shadow-brand font-semibold"
              >
                Discover More
              </Button>
            </Link>
          </div>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <Link to="/applications" className="text-primary font-bold hover:underline">
            View in Tracker →
          </Link>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="bg-surface border border-border-default rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-charcoal">
                {savedIds.length} Saved Opportunities
              </span>
              <Badge variant="mint" pill className="text-[10px] font-bold">
                Cycle 2026
              </Badge>
            </div>
            <p className="text-xs text-slate-muted mt-0.5">
              Saved items are verified and monitored for upcoming application cutoffs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right pr-3 border-r border-border-subtle hidden sm:block">
            <div className="text-xs font-bold text-charcoal">Nearest Deadline</div>
            <div className="text-[11px] text-danger font-semibold">April 30, 2026</div>
          </div>
          <Link to="/applications">
            <Button variant="primary" size="sm" pill className="shadow-xs font-semibold">
              Track All Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {savedIds.length > 0 && (
        <div className="bg-surface border border-border-default rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search saved opportunities by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-subtle" />}
              pill
              className="py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary font-semibold shadow-2xs'
                    : 'bg-alternate text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {savedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedOpportunities.map((opp) => (
            <div key={opp.id} className="relative group">
              <OpportunityCard
                key={opp.id}
                {...opp}
                isSaved={true}
                onSave={() => handleToggleSave(opp.id)}
                onApply={() => navigate(`/opportunity/${opp.id}`)}
              />
              {/* Quick action button under card to move to tracker */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => handleTrackOpportunity(opp)}
                  className="text-xs font-bold text-primary hover:text-primary-hover hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Add to Application Tracker</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Saved Opportunities Found"
          description={
            savedIds.length === 0
              ? 'You have not saved any opportunities yet. Browse Discover to explore verified research residencies, grants, and fellowships.'
              : 'No saved opportunities match your current search or category filter. Try clearing the filter.'
          }
          actionLabel="Explore Opportunities"
          onAction={() => navigate('/discover')}
        />
      )}

    </div>
  );
};
