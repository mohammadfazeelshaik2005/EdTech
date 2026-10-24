import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Select,
  Modal,
} from '@/components/ui';
import { mockOpportunities } from '@/data/mockData';
import { getAllOpportunitiesForAdmin } from '@/services/dataCollection';
import {
  getApplications,
  updateApplicationStatus,
  updateApplicationNotes,
  addApplicationFromOpportunity,
  removeApplication,
  getVerifiedApplicationUrl,
  ApplicationItem,
  ApplicationStatus,
} from '@/services/trackerService';
import {
  Send,
  Clock,
  Building,
  CheckCircle2,
  Calendar,
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Check,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Shortlisted',
  'Selected',
  'Rejected',
];

const STATUS_BADGE_VARIANTS: Record<ApplicationStatus, { text: string; bg: string; border: string }> = {
  Saved: { text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  'Planning to Apply': { text: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200' },
  Applied: { text: 'text-primary', bg: 'bg-primary-subtle', border: 'border-primary/30' },
  Shortlisted: { text: 'text-purple-900', bg: 'bg-purple-50', border: 'border-purple-200' },
  Selected: { text: 'text-emerald-900', bg: 'bg-emerald-100/90', border: 'border-emerald-300' },
  Rejected: { text: 'text-rose-900', bg: 'bg-rose-50', border: 'border-rose-200' },
};

// Pipeline sequence for horizontal timeline UI
const PIPELINE_STEPS: ApplicationStatus[] = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Shortlisted',
  'Selected',
];

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>(getApplications());
  const [activeTab, setActiveTab] = useState<string>('All');
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  // Edit notes state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string>(mockOpportunities[0]?.id || '');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Planning to Apply');
  const [newNotes, setNewNotes] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Status update handler
  const handleStatusChange = (id: string, nextStatus: ApplicationStatus) => {
    const updated = updateApplicationStatus(id, nextStatus);
    setApplications(updated);
    showToast(`Application status updated to "${nextStatus}".`);
  };

  // Notes save handler
  const handleSaveNotes = (id: string) => {
    const updated = updateApplicationNotes(id, noteDraft);
    setApplications(updated);
    setEditingNotesId(null);
    showToast('Notes saved successfully.');
  };

  // Remove handler
  const handleRemove = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your application tracker?`)) {
      const updated = removeApplication(id);
      setApplications(updated);
      showToast(`Removed "${title}" from tracker.`);
    }
  };

  // Add new application handler
  const handleAddApplication = () => {
    const opp = mockOpportunities.find((o) => o.id === selectedOppId);
    if (!opp) return;

    const updated = addApplicationFromOpportunity(opp, newStatus, newNotes);
    setApplications(updated);
    setAddModalOpen(false);
    setNewNotes('');
    showToast(`Added "${opp.title}" to tracker as ${newStatus}.`);
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    if (activeTab === 'All') return applications;
    return applications.filter((app) => app.status === activeTab);
  }, [applications, activeTab]);

  // Counts for pipeline tabs
  const counts = useMemo(() => {
    const res: Record<string, number> = { All: applications.length };
    STATUS_OPTIONS.forEach((status) => {
      res[status] = applications.filter((a) => a.status === status).length;
    });
    return res;
  }, [applications]);

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      
      {/* Page Header */}
      <PageHeader
        title="Application Tracker"
        subtitle="Manage your submission milestones, faculty interviews, decision outcomes, and personal notes across institutions."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Applications' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/saved">
              <Button variant="outline" size="sm" pill leftIcon={<Bookmark className="w-3.5 h-3.5" />}>
                View Saved Opportunities
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              pill
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddModalOpen(true)}
              className="shadow-brand font-semibold"
            >
              Track Opportunity
            </Button>
          </div>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* External Application Tracking Disclosure Callout */}
      <div className="bg-primary-subtle/30 border border-primary-border/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-charcoal shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>External Portal Tracking Notice:</strong> PathSync AI cannot automatically confirm whether an external institution's application was submitted. Complete your materials on the official host website, then update your status to <strong>Applied</strong> to track your milestones.
          </span>
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.map((status) => {
          const count = counts[status] || 0;
          const isActive = activeTab === status;
          const colors = STATUS_BADGE_VARIANTS[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveTab(isActive ? 'All' : status)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? `${colors.bg} ${colors.border} ring-2 ring-primary/20 shadow-xs`
                  : 'bg-surface border-border-default hover:border-primary-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                  {status}
                </span>
                <span className="text-xs font-bold text-charcoal bg-alternate px-2 py-0.5 rounded-full border border-border-subtle">
                  {count}
                </span>
              </div>
              <div className="text-lg font-black text-charcoal mt-1">{count}</div>
              <div className="text-[10px] text-slate-subtle mt-0.5">
                {count === 1 ? '1 application' : `${count} applications`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 border ${
              activeTab === 'All'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
            }`}
          >
            All Tracks ({applications.length})
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveTab(status)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 border ${
                activeTab === status
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
              }`}
            >
              <span>{status}</span>
              <span className="text-[10px] ml-1.5 opacity-80">({counts[status] || 0})</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-subtle">
          Showing {filteredApplications.length} tracked applications
        </span>
      </div>

      {/* Application Cards List with Timeline UI */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            const badge = STATUS_BADGE_VARIANTS[app.status];
            const isNotesEditing = editingNotesId === app.id;
            const isTimelineExpanded = expandedTimelineId === app.id;

            // Compute current step index in linear pipeline
            const currentStepIdx = PIPELINE_STEPS.indexOf(app.status);

            return (
              <Card
                key={app.id}
                className="p-5 sm:p-7 border-border-default hover:border-primary-border/70 transition-all space-y-6 shadow-xs"
              >
                {/* Header Row: Title, Organization, Match Score & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand" pill className="text-[10px]">
                        {app.category}
                      </Badge>
                      <Badge variant="mint" pill className="text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        <span>{app.matchScore}% Match</span>
                      </Badge>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        Status: {app.status}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-charcoal">
                      <Link
                        to={`/opportunity/${app.opportunityId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {app.opportunityTitle}
                      </Link>
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-muted">
                      <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-charcoal">{app.organization}</span>
                    </div>
                  </div>

                  {/* Top-Right Meta Box */}
                  <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs text-slate-subtle">
                    <div className="flex items-center gap-1.5 bg-alternate px-3 py-1.5 rounded-lg border border-border-subtle">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Deadline: <strong className="text-charcoal">{app.deadline}</strong></span>
                    </div>
                    {app.applicationDate ? (
                      <div className="flex items-center gap-1.5 bg-alternate px-3 py-1.5 rounded-lg border border-border-subtle">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Applied: <strong className="text-charcoal">{app.applicationDate}</strong></span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-subtle italic">
                        Not yet submitted
                      </span>
                    )}
                  </div>
                </div>


                {/* ============================================================
                    CLEAN TIMELINE / STATUS PROGRESSION UI
                    ============================================================ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-subtle uppercase tracking-wider">
                    <span>Admissions Stage Progression</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTimelineId(isTimelineExpanded ? null : app.id)
                      }
                      className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isTimelineExpanded ? 'Hide Milestone Log' : `View Log (${app.timeline.length})`}</span>
                      {isTimelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Horizontal Linear Timeline Stepper */}
                  {app.status !== 'Rejected' ? (
                    <div className="py-2">
                      <div className="grid grid-cols-5 gap-2 relative">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const isPassed = currentStepIdx >= idx;
                          const isCurrent = app.status === step;

                          return (
                            <div key={step} className="flex flex-col items-center text-center space-y-1.5">
                              {/* Step Bubble */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                  isCurrent
                                    ? 'bg-primary text-white ring-4 ring-primary-subtle shadow-xs'
                                    : isPassed
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-subtle text-slate-subtle border border-border-default'
                                }`}
                              >
                                {isPassed ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                              </div>

                              {/* Step Label */}
                              <span
                                className={`text-[11px] leading-tight font-medium ${
                                  isCurrent
                                    ? 'text-primary font-bold'
                                    : isPassed
                                    ? 'text-charcoal'
                                    : 'text-slate-subtle'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Rejected State Timeline Banner */
                    <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-950">
                      <XCircle className="w-4.5 h-4.5 text-rose-700 shrink-0" />
                      <div>
                        <strong className="font-bold">Application Status: Rejected</strong>
                        <p className="text-[11px] text-rose-900 mt-0.5">
                          Candidate review concluded. Consult your notes or advisor to review feedback and target future cohorts.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expanded Milestone Log */}
                  {isTimelineExpanded && (
                    <div className="p-4 bg-alternate rounded-xl border border-border-subtle space-y-2.5 animate-in fade-in-0 duration-200">
                      <span className="text-xs font-bold text-charcoal block">Milestone History:</span>
                      <div className="space-y-2">
                        {app.timeline.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-charcoal">{item.status}</span>
                              <span className="text-slate-subtle ml-2">({item.date})</span>
                              {item.note && (
                                <p className="text-[11px] text-slate-muted mt-0.5">{item.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* ============================================================
                    NOTES SECTION (INLINE EDITABLE)
                    ============================================================ */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-subtle uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Application Notes & Interview Observations</span>
                    </span>
                    {!isNotesEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(app.id);
                          setNoteDraft(app.notes);
                        }}
                        className="text-primary hover:underline font-bold cursor-pointer"
                      >
                        Edit Notes
                      </button>
                    )}
                  </div>

                  {isNotesEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add notes about your interview, deliverables, portfolio links, or faculty correspondence..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          pill
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          pill
                          onClick={() => handleSaveNotes(app.id)}
                          className="font-semibold shadow-xs"
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-alternate rounded-xl border border-border-subtle text-xs text-charcoal leading-relaxed">
                      {app.notes ? (
                        <span>{app.notes}</span>
                      ) : (
                        <span className="text-slate-subtle italic">No notes added yet. Click 'Edit Notes' to record interview details.</span>
                      )}
                    </div>
                  )}
                </div>


                {/* ============================================================
                    FOOTER CONTROLS: STATUS UPDATER & ACTIONS
                    ============================================================ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
                  
                  {/* Status Updater Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-subtle shrink-0">
                      Update Status:
                    </span>
                    <Select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatus)
                      }
                      className="text-xs py-1.5 font-semibold"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Detail link & remove */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const all = getAllOpportunitiesForAdmin();
                      const opp = all.find((o) => o.id === app.opportunityId) || mockOpportunities.find((o) => o.id === app.opportunityId);
                      const destUrl = getVerifiedApplicationUrl(opp);
                      return destUrl ? (
                        <a
                          href={destUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline px-2.5 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 bg-primary-subtle/30 transition-colors"
                          title="Open official host application portal in a new tab"
                        >
                          <span>Portal ↗</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null;
                    })()}

                    <Link to={`/opportunity/${app.opportunityId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        className="text-xs font-semibold"
                      >
                        Opportunity Details
                      </Button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(app.id, app.opportunityTitle)}
                      className="p-2 text-slate-subtle hover:text-danger hover:bg-danger-subtle rounded-full transition-colors cursor-pointer"
                      title="Remove from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center space-y-3 border-border-default">
          <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mx-auto">
            <Send className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-charcoal">
            No Applications in "{activeTab}"
          </h4>
          <p className="text-xs text-slate-muted max-w-sm mx-auto">
            There are no tracked opportunities in this stage. Explore opportunities to add to your tracking pipeline.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => setActiveTab('All')}
            >
              View All Applications ({applications.length})
            </Button>
          </div>
        </Card>
      )}


      {/* ====================================================================
          MODAL: TRACK NEW OPPORTUNITY
          ==================================================================== */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Opportunity to Application Tracker"
        footer={
          <>
            <Button variant="ghost" pill onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              pill
              onClick={handleAddApplication}
              className="font-semibold shadow-brand"
            >
              Add to Tracker →
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-muted leading-relaxed">
            Select an opportunity from your discovery feed and choose the current stage of your submission.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal">Opportunity</label>
            <Select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="text-xs py-2"
            >
              {mockOpportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.organization})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal">Initial Status</label>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
              className="text-xs py-2"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal">Personal Notes (Optional)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Planning to ask Dr. Miller for letter of recommendation..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-border-default focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
};
