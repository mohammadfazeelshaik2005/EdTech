import React, { useState } from 'react';
import {
  AssessmentConfig,
  AssessmentDifficulty,
  AssessmentType,
  AIProviderConfig,
} from '@/types/assessment';
import { AssessmentSectionId } from '@/types';
import { SECTION_METADATA, getActiveAIConfig, saveAIProviderConfig } from '@/services/aiAssessmentService';
import {
  Sparkles,
  Clock,
  HelpCircle,
  Code2,
  Check,
  Cpu,
  Settings2,
  X,
  Key,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartAssessment: (config: AssessmentConfig) => void;
  isLoading?: boolean;
}

export const AssessmentConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onStartAssessment,
  isLoading = false,
}) => {
  // Config state
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('full_placement');
  const [selectedSections, setSelectedSections] = useState<AssessmentSectionId[]>(
    Object.keys(SECTION_METADATA) as AssessmentSectionId[]
  );
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [preferredLanguage, setPreferredLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp'>('python');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);

  // AI Provider settings toggle
  const [showAiSettings, setShowAiSettings] = useState<boolean>(false);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(getActiveAIConfig());
  const [apiKeyInput, setApiKeyInput] = useState<string>(aiConfig.apiKey || '');

  if (!isOpen) return null;

  const handleToggleSection = (sectionId: AssessmentSectionId) => {
    if (assessmentType === 'full_placement') {
      setAssessmentType('topic_practice');
    }
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleSelectFullPlacement = () => {
    setAssessmentType('full_placement');
    setSelectedSections(Object.keys(SECTION_METADATA) as AssessmentSectionId[]);
    setQuestionCount(20);
    setDurationMinutes(30);
    setDifficulty('mixed');
  };

  const handleSaveAiConfig = () => {
    const updated = { ...aiConfig, apiKey: apiKeyInput.trim() || undefined };
    saveAIProviderConfig(updated);
    setAiConfig(updated);
    setShowAiSettings(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartAssessment({
      type: assessmentType,
      sections: selectedSections,
      difficulty,
      questionCount,
      durationMinutes,
      preferredLanguage,
      negativeMarking,
      negativeMarkRatio: 0.25,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="bg-surface rounded-2xl border border-border-default shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-6 p-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-charcoal">
                Configure Placement Readiness Assessment
              </h3>
            </div>
            <p className="text-xs text-slate-muted">
              AI generates a fresh, customized question set for this attempt. No two assessments are identical.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-muted hover:text-charcoal hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Status Pill */}
        <div className="p-3 bg-alternate rounded-xl border border-border-default flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-primary" />
            <div>
              <span className="font-bold text-charcoal">Active Engine: </span>
              <span className="text-primary font-semibold">
                {aiConfig.provider === 'gemini'
                  ? 'Google Gemini 3.8 Flash'
                  : aiConfig.provider === 'openai'
                  ? 'OpenAI GPT-4o-mini'
                  : aiConfig.provider === 'custom_gateway'
                  ? 'Custom Gateway'
                  : 'PathSync High-Entropy Engine (Dynamic Verified)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAiSettings(!showAiSettings)}
            className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showAiSettings ? 'Hide Settings' : 'Engine Settings'}</span>
          </button>
        </div>

        {/* AI Settings Accordion */}
        {showAiSettings && (
          <div className="p-4 bg-surface rounded-xl border border-primary/20 space-y-3 text-xs animate-in fade-in-0 duration-150">
            <div className="font-bold text-charcoal flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>Configure AI Provider Credentials</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-muted mb-1">
                  Provider
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border-default text-xs bg-surface text-charcoal focus:border-primary outline-hidden"
                >
                  <option value="pathsync_engine">PathSync High-Entropy Engine (No API key needed)</option>
                  <option value="gemini">Google Gemini API</option>
                  <option value="openai">OpenAI API</option>
                  <option value="custom_gateway">Custom AI Gateway Endpoint</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-muted mb-1">
                  API Key / Secret Token
                </label>
                <input
                  type="password"
                  placeholder={aiConfig.provider === 'pathsync_engine' ? 'Not required for offline engine' : 'Enter API key securely'}
                  disabled={aiConfig.provider === 'pathsync_engine'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-default text-xs bg-surface text-charcoal focus:border-primary outline-hidden disabled:bg-slate-50 disabled:opacity-60"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAiConfig}
                className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-hover"
              >
                Save Engine Settings
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Assessment Mode Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-charcoal">
              1. Assessment Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSelectFullPlacement}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  assessmentType === 'full_placement'
                    ? 'bg-primary-subtle border-primary text-charcoal shadow-xs'
                    : 'bg-surface border-border-default hover:border-primary-border text-slate-muted hover:text-charcoal'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-charcoal">Full Placement Test</span>
                  {assessmentType === 'full_placement' && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-muted mt-1 leading-relaxed">
                  Comprehensive 8-module simulation covering Aptitude, Core CS, DSA, and Interview readiness. (Default)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAssessmentType('topic_practice')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  assessmentType === 'topic_practice'
                    ? 'bg-primary-subtle border-primary text-charcoal shadow-xs'
                    : 'bg-surface border-border-default hover:border-primary-border text-slate-muted hover:text-charcoal'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-charcoal">Topic-wise Practice</span>
                  {assessmentType === 'topic_practice' && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-muted mt-1 leading-relaxed">
                  Deep-dive focus on specific weak areas (e.g. Dynamic Programming, OS Deadlocks, or Verbal Ability).
                </p>
              </button>
            </div>
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-charcoal">
                2. Target Modules ({selectedSections.length} of 8 selected)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedSections(
                    selectedSections.length === 8
                      ? ['dsa', 'core_cs']
                      : (Object.keys(SECTION_METADATA) as AssessmentSectionId[])
                  )
                }
                className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
              >
                {selectedSections.length === 8 ? 'Select Core Only' : 'Select All 8'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(SECTION_METADATA) as [AssessmentSectionId, { title: string }][]).map(
                ([secId, meta]) => {
                  const isSelected = selectedSections.includes(secId);
                  return (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => handleToggleSection(secId)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary-subtle border-primary text-primary shadow-xs'
                          : 'bg-alternate border-border-default text-slate-muted hover:text-charcoal hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{meta.title.split('&')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 stroke-[3]" />}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Difficulty & Question Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5 flex items-center gap-1.5">
                <span>Difficulty</span>
                <HelpCircle className="w-3 h-3 text-slate-subtle" />
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as AssessmentDifficulty)}
                className="w-full p-2.5 rounded-xl border border-border-default text-xs bg-surface text-charcoal font-semibold focus:border-primary outline-hidden cursor-pointer"
              >
                <option value="mixed">Mixed (Recommended)</option>
                <option value="easy">Easy (Foundational)</option>
                <option value="medium">Medium (Standard Placements)</option>
                <option value="hard">Hard (Tier-1 Product / R&D)</option>
              </select>
            </div>

            {/* Questions Count */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-slate-subtle" />
                <span>Question Count</span>
              </label>
              <select
                value={questionCount}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  setQuestionCount(count);
                  setDurationMinutes(Math.round(count * 1.5)); // 1.5 min per question default
                }}
                className="w-full p-2.5 rounded-xl border border-border-default text-xs bg-surface text-charcoal font-semibold focus:border-primary outline-hidden cursor-pointer"
              >
                <option value={10}>10 Questions (Quick Sprint)</option>
                <option value={20}>20 Questions (Standard Test)</option>
                <option value={30}>30 Questions (Full Mock Drive)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-subtle" />
                <span>Duration (Minutes)</span>
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border-default text-xs bg-surface text-charcoal font-semibold focus:border-primary outline-hidden cursor-pointer"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

          </div>

          {/* Programming Language & Negative Marking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-primary" />
                <span>Preferred Programming Language</span>
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border-default text-xs bg-surface text-charcoal font-semibold focus:border-primary outline-hidden cursor-pointer"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++ (Modern)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="p-2.5 rounded-xl border border-border-default bg-alternate flex items-center gap-3 text-xs cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="w-4 h-4 text-primary accent-primary rounded-sm"
                />
                <div>
                  <span className="font-bold text-charcoal block">Negative Marking (0.25x)</span>
                  <span className="text-[10px] text-slate-muted block">Simulates high-stakes corporate screening rules</span>
                </div>
              </label>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="border-t border-border-subtle pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-border-default text-xs font-bold text-slate-muted hover:text-charcoal hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedSections.length === 0}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-brand flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Fresh Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch AI Assessment</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
