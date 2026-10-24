import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { useAuth } from '@/context/AuthContext';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  navItems?: NavItem[];
  className?: string;
}

const defaultPublicNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Opportunities', href: '/#categories' },
  { label: 'Features', href: '/#features' },
];

export const Navbar: React.FC<NavbarProps> = ({
  navItems = defaultPublicNavItems,
  className,
}) => {
  const { user, profileData } = useAuth();
  const displayName = profileData?.profile?.full_name || user?.fullName || 'Student';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const elementId = href.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-border-default transition-all duration-200',
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-[72px] px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 select-none group">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-charcoal tracking-tight">
            PathSync <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Right: Desktop Navigation Links & Action Buttons */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href && !location.hash;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href.startsWith('/#') && location.pathname === '/') {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }
                  }}
                  className={cn(
                    'relative text-sm font-medium py-1 transition-colors select-none',
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-slate-muted hover:text-primary'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 pl-3 border-l border-border-default">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link to="/dashboard">
                  <Button
                    variant="primary"
                    size="sm"
                    pill
                    className="font-semibold shadow-brand"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link to="/profile">
                  <Avatar
                    size="sm"
                    status="online"
                    initials={initials}
                    src={user.avatarUrl || ''}
                  />
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" pill className="text-charcoal hover:text-primary font-semibold">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" pill className="font-semibold shadow-brand">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-charcoal hover:bg-subtle rounded-md cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border-default px-5 py-4 space-y-3 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-muted hover:bg-alternate hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" pill className="w-full">
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" pill className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" pill className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
