import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  Input,
  Badge,
} from '@/components/ui';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Compass,
  Award,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Validation error states
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validation handler
  const handleValidate = () => {
    let isValid = true;

    // Full name
    if (!fullName.trim()) {
      setFullNameError('Please enter your full name');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setFullNameError('Name must be at least 2 characters');
      isValid = false;
    } else {
      setFullNameError('');
    }

    // Email
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password
    if (!password) {
      setPasswordError('Please enter a password');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
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
      await register(email.trim(), password, fullName.trim());
      setAuthSuccess('Account registered successfully! Redirecting to profile setup...');
      setTimeout(() => {
        navigate('/profile-setup');
      }, 700);
    } catch (err: any) {
      console.error('Registration error:', err);
      setAuthError(
        err.message || 'Unable to create account. Please try again or use another email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas">
      
      {/* ====================================================================
          LEFT: REGISTRATION FORM COLUMN
          ==================================================================== */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-muted hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <Badge variant="brand" pill className="text-[11px]">
            New Learner Registration
          </Badge>
        </div>

        {/* Form Body Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          
          {/* Header */}
          <div className="space-y-2.5">
            <Link to="/" className="inline-flex items-center gap-2.5 select-none group">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-charcoal tracking-tight">
                PathSync <span className="text-primary">AI</span>
              </span>
            </Link>

            <h1 className="text-3xl font-extrabold text-charcoal tracking-tight">
              Create Your Account
            </h1>
            <p className="text-sm text-slate-muted leading-relaxed">
              Join thousands of students finding verified scholarships, internships, hackathons, and research pathways.
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

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              disabled={isSubmitting}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError('');
                if (authError) setAuthError(null);
              }}
              leftIcon={<User className="w-4 h-4" />}
              error={fullNameError}
              autoComplete="name"
            />

            {/* Email Address */}
            <Input
              label="Email Address"
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
              helperText="University or personal email"
              autoComplete="email"
            />

            {/* Password with Show/Hide */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
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
              autoComplete="new-password"
            />

            {/* Confirm Password with Show/Hide */}
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
                if (authError) setAuthError(null);
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-slate-subtle hover:text-charcoal transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={confirmPasswordError}
              autoComplete="new-password"
            />

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
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Alternate Link */}
          <div className="pt-5 border-t border-border-subtle text-center text-xs text-slate-muted">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="text-primary font-bold hover:text-primary-hover transition-colors"
            >
              Sign in →
            </Link>
          </div>

        </div>

        {/* Security & Terms */}
        <div className="text-center text-[11px] text-slate-subtle mt-6 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>By continuing, you agree to PathSync AI Terms of Service & Privacy Policy</span>
        </div>

      </div>


      {/* ====================================================================
          RIGHT: VISUAL SHOWCASE COLUMN (Desktop lg+)
          ==================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest via-[#074236] to-[#0A4D40] p-12 lg:p-16 flex-col justify-between relative overflow-hidden text-white border-l border-white/10">
        
        {/* Decorative Blur Backgrounds */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-bright/10 blur-3xl pointer-events-none" />

        {/* Top Eyebrow */}
        <div className="relative z-10">
          <Badge variant="dark" pill>
            • STEP 1 OF OPPORTUNITY DISCOVERY
          </Badge>
        </div>

        {/* Middle Value Props Card */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
            Start Your Journey with Verified Opportunities
          </h2>

          <p className="text-sm xl:text-base text-slate-200 leading-relaxed">
            Create your profile once and unlock structured discovery across scholarships, internships, hackathons, research labs, competitions, and certifications.
          </p>

          {/* Feature Highlight Cards */}
          <div className="space-y-3.5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Targeted Opportunity Discovery</h4>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                  Filter by your specific major, graduation year, location, and compensation.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Transparent Eligibility Criteria</h4>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                  Know exact GPA thresholds, prerequisites, and deadlines before investing application time.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-md bg-white/15 text-mint flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Skill Gap & Preparation Tools</h4>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                  Bridge prerequisite coursework and build confidence with curated learning recommendations.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-mint" />
            <span>6 Opportunity Categories Ready</span>
          </div>
          <span>Free Student Access</span>
        </div>

      </div>

    </div>
  );
};
