import React, { useState } from 'react';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import {
  BookOpen,
  Clock,
  ExternalLink,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LearningPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Courses' | 'Certifications' | 'Resources'>('All');

  const featuredTracks = [
    {
      id: 'trk-1',
      type: 'Courses',
      code: 'STAT-401',
      title: 'Statistical Learning & Probability for AI Researchers',
      provider: 'Stanford Center for Professional Development',
      duration: '4 Weeks • 6 hrs/week',
      level: 'Intermediate',
      status: 'Targeted for AI Research Internship',
      rating: 4.9,
      description:
        'Rigorous treatment of multivariate hypothesis testing, Bayesian parameter estimation, empirical risk minimization, and bootstrap sampling.',
      link: 'https://online.stanford.edu',
    },
    {
      id: 'trk-2',
      type: 'Courses',
      code: 'RES-502',
      title: 'Scientific Research Methodology & Computing Paper Writing',
      provider: 'Carnegie Mellon University AI Initiative',
      duration: '3 Weeks • 4 hrs/week',
      level: 'Intermediate',
      status: 'Targeted for Research Fellowships',
      rating: 4.9,
      description:
        'Formal hypothesis formulation, ablation study matrices, LaTeX drafting, and reproducible benchmark evaluations.',
      link: 'https://cmu.edu',
    },
    {
      id: 'trk-3',
      type: 'Certifications',
      code: 'CERT-FAIR',
      title: 'Frontier AI Research Fellow Certification (FAIR-C)',
      provider: 'AI Research & Education Consortium',
      duration: '4 Weeks Capstone',
      level: 'Advanced',
      status: 'Industry Standard Credential',
      rating: 4.8,
      description:
        'Peer-reviewed replication paper and benchmark validation required for frontier laboratory admissions.',
      link: 'https://ai-consortium.org',
    },
    {
      id: 'trk-4',
      type: 'Certifications',
      code: 'CERT-K8S',
      title: 'Certified Cloud Native Go Architect',
      provider: 'Cloud Native Computing Foundation (CNCF)',
      duration: '3 Weeks Capstone',
      level: 'Intermediate',
      status: 'Targeted for Cloud Residency',
      rating: 4.8,
      description:
        'High-throughput distributed systems design, memory profiling, and race condition remediation in Golang.',
      link: 'https://cncf.io',
    },
    {
      id: 'trk-5',
      type: 'Resources',
      code: 'RES-ISLR',
      title: 'An Introduction to Statistical Learning (ISLR Python Edition)',
      provider: 'Springer Free Open Textbook',
      duration: 'Self-Paced Reference',
      level: 'All Levels',
      status: 'Open Source Book & Notebooks',
      rating: 5.0,
      description:
        'Gold-standard reference textbook with complete companion Python Jupyter notebooks for all statistical models.',
      link: 'https://statlearning.com',
    },
    {
      id: 'trk-6',
      type: 'Resources',
      code: 'RES-LAB',
      title: 'Interactive Hypothesis Testing & Distribution Visualizer',
      provider: 'Brown University Seeing Theory',
      duration: 'Interactive Tool',
      level: 'All Levels',
      status: 'Web Simulation',
      rating: 4.9,
      description:
        'Visual interactive simulations exploring Bayesian inference, random variables, and central limit theorems directly in the browser.',
      link: 'https://seeing-theory.brown.edu',
    },
  ];

  const filteredTracks = activeCategory === 'All'
    ? featuredTracks
    : featuredTracks.filter((t) => t.type === activeCategory);

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300 pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="Curated Learning & Resources Hub"
        subtitle="Supporting learning tracks aligned with target opportunity requirements and faculty admissions rubrics."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Skill Gap', href: '/skill-gap' },
          { label: 'Learning' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/skill-gap">
              <Button variant="primary" size="sm" pill leftIcon={<Zap className="w-3.5 h-3.5" />} className="shadow-brand">
                Open Skill Gap Roadmap
              </Button>
            </Link>
          </div>
        }
      />

      {/* Supporting Feature Context Callout */}
      <div className="p-4 bg-primary-subtle/50 border border-primary/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Supporting Development Feature
            </span>
            <p className="text-xs text-slate-muted">
              PathSync AI focuses on opportunity discovery. These curated tracks help you bridge prerequisite gaps for target programs.
            </p>
          </div>
        </div>

        <Link to="/discover">
          <Button variant="ghost" size="sm" pill className="text-xs font-semibold shrink-0">
            Browse Opportunities →
          </Button>
        </Link>
      </div>

      {/* Target Opportunity Roadmap Preview Hero */}
      <Card variant="forest" className="p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <Badge variant="mint" pill className="text-[10px] font-bold">
              ACTIVE ROADMAP IN PROGRESS
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Target: AI Research Internship
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Prerequisites required: <strong>Statistics</strong> and <strong>Research basics</strong>. Close these 2 gaps to unlock 98% admission match probability at Frontier AI Research Institute.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link to="/skill-gap?opportunityId=opp-ai-internship">
              <Button
                variant="light"
                pill
                size="md"
                className="bg-white text-primary hover:bg-slate-100 font-bold shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Customized Roadmap
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        {(['All', 'Courses', 'Certifications', 'Resources'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer border ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTracks.map((track) => (
          <Card
            key={track.id}
            className="p-5 border-border-default hover:border-primary-border transition-all flex flex-col justify-between gap-4 shadow-xs group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                  {track.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {track.status}
                </span>
              </div>

              <h4 className="text-base font-bold text-charcoal group-hover:text-primary transition-colors leading-snug">
                {track.title}
              </h4>

              <p className="text-xs text-slate-muted leading-relaxed">
                {track.description}
              </p>

              <div className="flex items-center gap-4 text-[11px] text-slate-subtle pt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-primary" /> {track.provider}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" /> {track.duration}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-charcoal">
                ★ {track.rating} Rating
              </span>
              <a
                href={track.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  pill
                  rightIcon={<ExternalLink className="w-3 h-3" />}
                  className="text-xs font-semibold"
                >
                  Access Track
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>

      {/* Institutional Credit Note */}
      <Card variant="alternate" className="p-6 text-center space-y-2 border-border-subtle">
        <CheckCircle2 className="w-7 h-7 text-primary mx-auto" />
        <h4 className="text-base font-bold text-charcoal">
          Institutional Academic Credit & Waiver Transfer
        </h4>
        <p className="text-xs text-slate-muted max-w-md mx-auto">
          Accredited course and certification deliverables can be transferred for departmental credits or used to request prerequisite waivers from program directors.
        </p>
      </Card>

    </div>
  );
};
