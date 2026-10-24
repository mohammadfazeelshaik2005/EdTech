import React, { useState } from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar, Avatar, Button, NotificationCenter } from '@/components/ui';
import { Search, Sparkles, Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, profileData, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Loading state while session is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-muted">Verifying secure session...</span>
        </div>
      </div>
    );
  }

  // Session guard: Protected routes require valid authenticated session
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const displayName = profileData?.profile?.full_name || user?.fullName || 'PathSync Student';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PS';

  const avatarSrc = user?.avatarUrl || profileData?.profile?.avatar_url || '';

  return (
    <div className="min-h-screen flex bg-alternate">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full bg-surface shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="h-[72px] bg-surface border-b border-border-default px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-charcoal hover:bg-subtle rounded-md cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-primary-subtle text-primary rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Advisor Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/discover">
              <Button variant="outline" size="sm" pill leftIcon={<Search className="w-3.5 h-3.5" />}>
                Explore Paths
              </Button>
            </Link>

            <NotificationCenter />

            <Link to="/profile">
              <Avatar
                size="sm"
                status="online"
                initials={initials}
                src={avatarSrc}
              />
            </Link>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
