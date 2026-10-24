import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Badge,
  SectionHeader,
  Card,
  Modal,
} from '@/components/ui';
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  Trophy,
  BadgeCheck,
  UserCheck,
  Compass,
  CheckCircle2,
  Send,
  Zap,
  BookOpen,
  Award,
  Sparkles,
  Shield,
  Layers,
  Search,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);

  // 6 Specified Opportunity Categories
  const opportunityCategories = [
    {
      id: 'scholarships',
      title: 'Scholarships',
      icon: GraduationCap,
      description:
        'Merit-based, need-based, and institutional grants to fund your tuition and educational projects.',
      tag: 'Merit & Need-Based',
      count: '1,400+ Active Grants',
      details:
        'Discover tuition support, diversity grants, and research fellowships funded by academic foundations and institutional sponsors.',
    },
    {
      id: 'internships',
      title: 'Internships',
      icon: Briefcase,
      description:
        'Hands-on industry residencies, summer analyst roles, and engineering co-ops across top organizations.',
      tag: 'Summer & Fall Tracks',
      count: '2,800+ Open Roles',
      details:
        'Gain real-world experience in technology, finance, healthcare, engineering, and creative industries with vetted employer partners.',
    },
    {
      id: 'hackathons',
      title: 'Hackathons',
      icon: Code2,
      description:
        'Collegiate and global build sprints to solve pressing real-world problems and prototype novel solutions.',
      tag: 'Virtual & In-Person',
      count: '350+ Annual Events',
      details:
        'Collaborate in 24-48 hour sprints, build portfolio-defining projects, win prize bounties, and connect directly with sponsors.',
    },
    {
      id: 'research',
      title: 'Research Opportunities',
      icon: FlaskConical,
      description:
        'Faculty-led lab fellowships, NSF-funded REUs, and paper co-authorship programs for student scholars.',
      tag: 'Lab Fellowships & REUs',
      count: '620+ Research Positions',
      details:
        'Contribute to frontier science, machine learning models, clinical biomedicine, and humanities investigations.',
    },
    {
      id: 'competitions',
      title: 'Competitions',
      icon: Trophy,
      description:
        'Academic olympiads, business case challenges, design showcases, and venture pitch competitions.',
      tag: 'Bounties & Awards',
      count: '480+ Contests',
      details:
        'Test your domain skills against global peers, earn peer recognition, and showcase your achievements to university recruiters.',
    },
    {
      id: 'certifications',
      title: 'Certifications',
      icon: BadgeCheck,
      description:
        'Industry-endorsed credentials, university micro-specializations, and professional qualifications.',
      tag: 'Verified Credentials',
      count: '900+ Credential Paths',
      details:
        'Validate your technical and professional competencies with standardized certifications recognized by top employers.',
    },
  ];

  // 5 Steps for How It Works
  const steps = [
    {
      number: '01',
      title: 'Create Profile',
      description: 'Enter your academic background, degree track, coursework, and core areas of interest.',
      icon: UserCheck,
    },
    {
      number: '02',
      title: 'Understand Your Profile',
      description: 'Map your current strengths, eligibility factors, and target career milestones with clarity.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Discover Opportunities',
      description: 'Filter through scholarships, internships, hackathons, and research openings tailored to your criteria.',
      icon: Compass,
    },
    {
      number: '04',
      title: 'Check Eligibility',
      description: 'Review clear prerequisites, deadlines, GPA standards, and submission requirements upfront.',
      icon: CheckCircle2,
    },
    {
      number: '05',
      title: 'Prepare & Apply',
      description: 'Bridge prerequisite gaps, organize your materials, and submit competitive applications with confidence.',
      icon: Send,
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* ====================================================================
          1. HERO SECTION (Reference Composition: Bold Headline, Dual CTA, Visual Card)
          ==================================================================== */}
      <section className="pt-12 sm:pt-16 pb-20 bg-gradient-to-b from-white via-alternate/60 to-alternate border-b border-border-default/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="brand" pill>
                • DISCOVER • PREPARE • SUCCEED
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal leading-[1.12] tracking-tight">
                Find Opportunities That{' '}
                <span className="text-primary italic font-serif font-medium">
                  Fit Your Path.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-muted max-w-xl leading-relaxed">
                PathSync AI helps ambitious students discover personalized scholarships, internships, hackathons, research opportunities, competitions, and certifications — all organized in one verified platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/register">
                  <Button variant="primary" size="lg" pill rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started
                  </Button>
                </Link>
                <a href="#categories">
                  <Button
                    variant="secondary"
                    size="lg"
                    pill
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    Explore Opportunities
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs text-slate-subtle">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Free for Students
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> 6 Opportunity Types
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Verified Deadlines
                </span>
              </div>
            </div>

            {/* Right Column Visual Card (Inspired by reference campus visual) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border-default relative bg-surface">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80"
                  alt="Students exploring opportunities on campus"
                  className="w-full h-[460px] object-cover"
                />

                {/* Floating Tag 1 (Top Left) */}
                <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2.5 text-xs font-semibold text-charcoal">
                  <span className="w-2.5 h-2.5 rounded-full bg-mint" />
                  <span>Verified Opportunity Sources</span>
                </div>

                {/* Floating Tag 2 (Bottom Right) */}
                <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2.5 text-xs font-semibold text-charcoal">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Curated Eligibility & Deadlines</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ====================================================================
          FLOATING HIGHLIGHTS DOCK BAR (Overlapping Hero)
          ==================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative z-20">
        <div className="bg-surface border border-border-default rounded-xl shadow-lg p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-md bg-primary-subtle text-primary flex items-center justify-center text-xl shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal">6 Opportunity Types</div>
              <div className="text-xs text-slate-muted">From grants to fellowships</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-md bg-primary-subtle text-primary flex items-center justify-center text-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal">Eligibility-Aware</div>
              <div className="text-xs text-slate-muted">Clear prerequisites upfront</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-md bg-primary-subtle text-primary flex items-center justify-center text-xl shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal">Structured Workflow</div>
              <div className="text-xs text-slate-muted">From discovery to submission</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-md bg-primary-subtle text-primary flex items-center justify-center text-xl shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal">100% Free for Students</div>
              <div className="text-xs text-slate-muted">Always accessible to learners</div>
            </div>
          </div>

        </div>
      </div>


      {/* ====================================================================
          2. OPPORTUNITY CATEGORIES
          (Scholarships, Internships, Hackathons, Research, Competitions, Certifications)
          ==================================================================== */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="OPPORTUNITY DIRECTORY"
          title="Explore Opportunities Across Key Categories"
          description="Whatever your academic focus or career ambition, PathSync AI organizes high-impact opportunities by domain and format."
          action={
            <Link to="/register">
              <Button variant="primary" pill>
                Start Discovering →
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunityCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="bg-surface border border-border-default rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-primary-border hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-12 h-12 rounded-md bg-primary-subtle text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="brand" pill>
                      {cat.tag}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-charcoal group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>

                  <p className="text-sm text-slate-muted mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-subtle">
                    {cat.count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryModal(cat.id)}
                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ====================================================================
          3. HOW IT WORKS
          (Create Profile → Understand Profile → Discover → Check Eligibility → Prepare & Apply)
          ==================================================================== */}
      <section id="how-it-works" className="bg-alternate py-20 border-y border-border-default/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <SectionHeader
            align="center"
            eyebrow="HOW IT WORKS"
            title="A Clear Path from Discovery to Preparation"
            description="Our structured five-step workflow guides students through identifying, filtering, and preparing for career-defining opportunities."
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-5 mt-12">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-surface border border-border-default rounded-lg p-5 flex flex-col justify-between relative shadow-xs hover:border-primary-border transition-colors group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-primary bg-primary-subtle px-2.5 py-1 rounded-full">
                        {step.number}
                      </span>
                      <Icon className="w-5 h-5 text-slate-subtle group-hover:text-primary transition-colors" />
                    </div>

                    <h4 className="text-sm font-bold text-charcoal mb-2 leading-snug">
                      {step.title}
                    </h4>

                    <p className="text-xs text-slate-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-border text-xs z-10">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button variant="primary" size="md" pill rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Step 1: Create Profile
              </Button>
            </Link>
          </div>

        </div>
      </section>


      {/* ====================================================================
          4. WHY PATHSYNC AI
          (Personalized discovery, Eligibility-aware, Verified workflow, One platform)
          ==================================================================== */}
      <section id="why-pathsync" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-forest via-[#084337] to-[#0A4D40] rounded-3xl p-8 sm:p-12 text-white border border-white/10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Visual Left */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-lg border border-white/15">
            <img
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&auto=format&fit=crop&q=80"
              alt="Academic research and modern collaboration"
              className="w-full h-[440px] object-cover"
            />
          </div>

          {/* Content Right */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="dark" pill>
              • WHY PATHSYNC AI
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Built Specifically for Student Opportunity Discovery
            </h2>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Finding the right extracurricular tracks and fellowships shouldn't require searching across dozens of disjointed websites. We bring structure, clarity, and verified criteria together in one place.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Personalized Discovery</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
                  Tailored browsing aligned with your specific academic field, study level, and career aspirations.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Eligibility-Aware Filters</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
                  Clear prerequisites regarding graduation year, GPA, nationality, and coursework before you invest time.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Verified Opportunity Workflow</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
                  Structured listings curated with confirmed deadlines, official host links, and direct requirements.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">One Unified Platform</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-10.5">
                  Scholarships, internships, hackathons, research labs, and certifications under a single organized system.
                </p>
              </div>

            </div>

            <div className="pt-2">
              <Link to="/register">
                <Button variant="light" pill className="font-semibold text-primary">
                  Explore Verified Opportunities →
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>


      {/* ====================================================================
          5. SUPPORTING FEATURES
          (Skill Gap Analysis, Learning Recommendations, Placement Readiness)
          Clear framing: Opportunity discovery is CORE; these are supporting tools.
          ==================================================================== */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="SUPPORTING INTELLIGENCE"
          title="Tools to Strengthen Your Preparation"
          description="Opportunity discovery is at the heart of PathSync AI. To help you become a competitive applicant once you find your target track, our platform provides these supporting preparation tools."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Skill Gap Analysis */}
          <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-primary-border transition-colors">
            <div>
              <div className="w-12 h-12 rounded-md bg-primary-subtle text-primary flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <Badge variant="brand" pill className="mb-2">Supporting Tool</Badge>
              <h3 className="text-lg font-bold text-charcoal">
                Skill Gap Analysis
              </h3>
              <p className="text-sm text-slate-muted leading-relaxed mt-2">
                Evaluate prerequisite requirements for ambitious internships, fellowships, and research roles. Identify exactly which technical competencies to prioritize next.
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle text-xs font-semibold text-primary">
              Identify key prerequisites →
            </div>
          </Card>

          {/* Card 2: Learning Recommendations */}
          <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-primary-border transition-colors">
            <div>
              <div className="w-12 h-12 rounded-md bg-primary-subtle text-primary flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <Badge variant="brand" pill className="mb-2">Supporting Tool</Badge>
              <h3 className="text-lg font-bold text-charcoal">
                Learning Recommendations
              </h3>
              <p className="text-sm text-slate-muted leading-relaxed mt-2">
                Access curated modular study plans and recommended courses to bridge specific skill gaps before submitting your applications.
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle text-xs font-semibold text-primary">
              Targeted course roadmaps →
            </div>
          </Card>

          {/* Card 3: Placement Readiness */}
          <Card className="p-6 flex flex-col justify-between space-y-4 hover:border-primary-border transition-colors">
            <div>
              <div className="w-12 h-12 rounded-md bg-primary-subtle text-primary flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <Badge variant="brand" pill className="mb-2">Supporting Tool</Badge>
              <h3 className="text-lg font-bold text-charcoal">
                Placement Readiness
              </h3>
              <p className="text-sm text-slate-muted leading-relaxed mt-2">
                Gauge your holistic preparedness across technical depth, portfolio projects, and requirements to apply when your application is at its strongest.
              </p>
            </div>
            <div className="pt-3 border-t border-border-subtle text-xs font-semibold text-primary">
              Benchmark your readiness →
            </div>
          </Card>

        </div>
      </section>


      {/* ====================================================================
          6. FINAL CTA
          ("Your next opportunity could be closer than you think.")
          ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-forest-dark via-forest to-primary rounded-3xl p-10 sm:p-16 text-center text-white border border-white/10 shadow-xl space-y-6">
          <Badge variant="dark" pill>
            • START YOUR JOURNEY
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white max-w-2xl mx-auto leading-tight">
            Your next opportunity could be closer than you think.
          </h2>

          <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of ambitious students using PathSync AI to discover scholarships, internships, research fellowships, competitions, and verified pathways.
          </p>

          <div className="pt-2">
            <Link to="/register">
              <Button
                variant="light"
                size="lg"
                pill
                className="bg-mint text-forest font-bold hover:bg-white text-base px-8 shadow-lg"
              >
                Create Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Category Details Modal for Public Preview */}
      {activeCategoryModal && (
        <Modal
          isOpen={Boolean(activeCategoryModal)}
          onClose={() => setActiveCategoryModal(null)}
          title={
            opportunityCategories.find((c) => c.id === activeCategoryModal)?.title ||
            'Opportunity Category'
          }
          footer={
            <>
              <Button
                variant="ghost"
                pill
                onClick={() => setActiveCategoryModal(null)}
              >
                Close
              </Button>
              <Link to="/register" onClick={() => setActiveCategoryModal(null)}>
                <Button variant="primary" pill>
                  Get Started to Apply →
                </Button>
              </Link>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-muted leading-relaxed">
              {opportunityCategories.find((c) => c.id === activeCategoryModal)?.details}
            </p>
            <div className="p-4 bg-alternate rounded-md border border-border-default space-y-1.5 text-xs text-slate-muted">
              <span className="font-semibold text-charcoal block">Public Preview Note:</span>
              <span>
                To filter by your specific academic discipline, GPA, and graduation year, create your free student profile.
              </span>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
