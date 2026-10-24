import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-dark text-slate-300 pt-16 pb-10 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Col 1: PathSync AI Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                PathSync <span className="text-primary-muted">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Personalized opportunity discovery platform helping ambitious students find verified scholarships, internships, hackathons, research positions, competitions, and certifications.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="dark" pill>Opportunity Discovery</Badge>
              <Badge variant="dark" pill>Eligibility Aware</Badge>
              <Badge variant="dark" pill>Verified Listings</Badge>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#categories" className="hover:text-white transition-colors">Scholarships</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Internships</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Hackathons</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Research Opportunities</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Competitions</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Certifications</a></li>
            </ul>
          </div>

          {/* Col 3: Features */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Features
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Opportunity Discovery</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Eligibility-Aware Matching</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Skill Gap Analysis</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Learning Recommendations</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Placement Readiness</a></li>
            </ul>
          </div>

          {/* Col 4: Resources & Contact */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Resources & Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#why-pathsync" className="hover:text-white transition-colors">Why PathSync AI</a></li>
              <li className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-mint" /> contact@pathsync.ai
              </li>
              <li className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-mint" /> Global Student Network
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar with Privacy, Terms, and Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>© 2026 PathSync AI Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
