import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Compass,
  LayoutDashboard,
  Bookmark,
  Send,
  Zap,
  BookOpen,
  Award,
  User,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  className,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profileData, logout, isAdmin } = useAuth();

  const displayName = profileData?.profile?.full_name || user?.fullName || (isAdmin ? 'Administrator' : 'PathSync Student');
  const headline = isAdmin ? 'Platform Administrator' : (profileData?.profile?.headline || 'Student Account');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || (isAdmin ? 'AD' : 'PS');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const primaryNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', href: '/discover', icon: Compass, badge: 'New' },
    { label: 'Saved Paths', href: '/saved', icon: Bookmark },
    { label: 'Applications', href: '/applications', icon: Send },
  ];

  const intelligenceNav = [
    { label: 'Skill Gap', href: '/skill-gap', icon: Zap },
    { label: 'Learning Plans', href: '/learning', icon: BookOpen },
    { label: 'Career Readiness', href: '/readiness', icon: Award, match: '94%' },
  ];

  // Only authorized admins see the Admin Dashboard in their navigation
  const systemNav = [
    { label: 'My Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    ...(isAdmin
      ? [{ label: 'Admin Verification', href: '/admin', icon: ShieldCheck, badge: 'Admin' }]
      : []),
  ];

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-surface border-r border-border-default flex flex-col transition-all duration-300 z-30',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="h-[72px] px-5 flex items-center justify-between border-b border-border-subtle shrink-0">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-charcoal tracking-tight">
              PathSync
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-md bg-gradient-to-br from-primary to-teal-bright flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-subtle hover:text-charcoal hover:bg-subtle rounded-md transition-colors cursor-pointer hidden md:flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Group */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold tracking-wider text-slate-subtle uppercase block mb-2">
              Discovery
            </span>
          )}
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-slate-muted hover:bg-alternate hover:text-primary',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-primary' : 'text-slate-subtle group-hover:text-primary')} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Intelligence Group */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold tracking-wider text-slate-subtle uppercase block mb-2">
              Intelligence
            </span>
          )}
          <div className="space-y-1">
            {intelligenceNav.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-slate-muted hover:bg-alternate hover:text-primary',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-primary' : 'text-slate-subtle group-hover:text-primary')} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && item.match && (
                    <Badge variant="mint" className="text-[10px] py-0 px-1.5">
                      {item.match}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Group */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold tracking-wider text-slate-subtle uppercase block mb-2">
              Account
            </span>
          )}
          <div className="space-y-1">
            {systemNav.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-slate-muted hover:bg-alternate hover:text-primary',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-primary' : 'text-slate-subtle group-hover:text-primary')} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer User Chip & Logout */}
      <div className="p-3 border-t border-border-subtle shrink-0 flex items-center justify-between">
        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-3 p-1.5 rounded-md hover:bg-alternate transition-colors flex-1 min-w-0 mr-1',
            collapsed && 'justify-center p-1 mr-0'
          )}
          title={displayName}
        >
          <Avatar
            size="sm"
            status="online"
            initials={initials}
            src={user?.avatarUrl || profileData?.profile?.avatar_url || ''}
          />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-semibold text-charcoal truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-subtle truncate">
                {headline}
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-primary-subtle text-primary border-primary/30'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isAdmin ? 'Admin' : 'Student'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-subtle hover:text-danger hover:bg-danger-subtle rounded-md transition-colors cursor-pointer shrink-0"
              title="Sign out of PathSync AI"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
