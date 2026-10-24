import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  Input,
  Badge,
  Modal,
} from '@/components/ui';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Star,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Validation handler
  const handleValidate = () => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address (e.g. student@university.edu)');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!handleValidate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      setAuthSuccess('Sign in verified! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(
        err.message || 'Unable to sign in. Please verify your email and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSubmitted(true);
      setTimeout(() => {
        setForgotModalOpen(false);
        setForgotSubmitted(false);
        setForgotEmail('');
      }, 2000);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas">
      
      {/* ====================================================================
          LEFT: FORM COLUMN (Mobile / Tablet / Desktop)
          ==================================================================== */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        
        {/* Top Bar: Back to Home */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-muted hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <Badge variant="brand" pill className="text-[11px]">
            Public Portal
          </Badge>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          
          {/* Brand & Header */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 select-none group">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-charcoal tracking-tight">
                PathSync <span className="text-primary">AI</span>
              </span>
            </Link>

            <h1 className="text-3xl font-extrabold text-charcoal tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-muted leading-relaxed">
              Sign in to access your opportunity dashboard, eligibility tracking, and verified application roadmaps.
            </p>
          </div>

          {/* Feedback Banners */}
          {authError && (
            <div className="p-3.5 bg-danger-subtle border border-danger/30 rounded-lg text-xs font-medium text-danger flex items-start gap-2.5 animate-in fade-in-0">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span className="leading-relaxed flex-1">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-mint-subtle border border-success/30 rounded-lg text-xs font-medium text-success flex items-start gap-2.5 animate-in fade-in-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success" />
              <span className="leading-relaxed flex-1">{authSuccess}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            
            {/* Email Input */}
            <Input
              label="Institutional or Personal Email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              disabled={isSubmitting}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
                if (authError) setAuthError(null);
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={emailError}
              autoComplete="email"
            />

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                  if (authError) setAuthError(null);
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-subtle hover:text-charcoal transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={passwordError}
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-muted hover:text-charcoal transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isSubmitting}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary focus:ring-2 cursor-pointer accent-primary disabled:opacity-50"
                />
                <span className="font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full font-bold shadow-brand mt-2"
              rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Alternate Link */}
          <div className="pt-6 border-t border-border-subtle text-center text-xs text-slate-muted">
            <span>Don't have an account yet? </span>
            <Link
              to="/register"
              className="text-primary font-bold hover:text-primary-hover transition-colors"
            >
              Create your account →
            </Link>
          </div>

        </div>

        {/* Bottom Security Note */}
        <div className="text-center text-[11px] text-slate-subtle mt-8 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Encrypted Session • Standardized Institutional Privacy</span>
        </div>

      </div>


      {/* ====================================================================
          RIGHT: VISUAL SHOWCASE COLUMN (Desktop lg+)
          Inspired by reference screenshot's "A Place to Learn" deep forest theme
          ==================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest via-[#074236] to-[#0A4D40] p-12 lg:p-16 flex-col justify-between relative overflow-hidden text-white border-l border-white/10">
        
        {/* Subtle Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-bright/10 blur-3xl pointer-events-none" />

        {/* Top Badge */}
        <div className="relative z-10">
          <Badge variant="dark" pill>
            • STUDENT OPPORTUNITY PLATFORM
          </Badge>
        </div>

        {/* Middle Visual Showcase & Testimonial */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
            Connecting Ambitious Students with Proven Career Paths
          </h2>

          <p className="text-sm xl:text-base text-slate-200 leading-relaxed">
            PathSync AI consolidates scholarships, engineering internships, collegiate hackathons, and laboratory research fellowships into one transparent dashboard.
          </p>

          {/* Floating Testimonial Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5.5 space-y-3.5 shadow-lg">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-100 italic leading-relaxed">
              "PathSync AI gave me clear visibility into scholarship deadlines and research residencies I never knew existed. The eligibility prerequisites saved me dozens of hours."
            </p>
            <div className="flex items-center gap-3 pt-1 border-t border-white/15">
              <div className="w-8 h-8 rounded-full bg-white/20 text-mint flex items-center justify-center font-bold text-xs">
                AR
              </div>
              <div>
                <div className="text-xs font-bold text-white">Ayesha Rahman</div>
                <div className="text-[10px] text-slate-300">Computer Science Fellow</div>
              </div>
            </div>
          </div>

          {/* Quick Pillar Bullets */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-200 pt-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
              <span>6 Opportunity Types</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
              <span>Eligibility Checks</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
              <span>Skill Gap Tools</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
              <span>100% Free for Students</span>
            </span>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
          <span>PathSync AI Platform</span>
          <span>Permanent Visual System</span>
        </div>

      </div>


      {/* ====================================================================
          FORGOT PASSWORD MODAL
          ==================================================================== */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Your Password"
        footer={
          <>
            <Button
              variant="ghost"
              pill
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              pill
              onClick={handleForgotSubmit}
              disabled={!forgotEmail || forgotSubmitted}
            >
              {forgotSubmitted ? 'Email Sent ✓' : 'Send Reset Link →'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-muted leading-relaxed">
            Enter your registered institutional or personal email address. We will send you instructions to securely reset your credentials.
          </p>

          <Input
            label="Account Email"
            type="email"
            placeholder="student@university.edu"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {forgotSubmitted && (
            <div className="p-3 bg-mint-subtle text-success border border-success/30 rounded-md text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Reset instructions have been sent to your email.</span>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
