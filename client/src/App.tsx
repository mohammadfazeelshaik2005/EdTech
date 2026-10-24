import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  ProfileSetupPage,
  DashboardPage,
  DiscoverPage,
  OpportunityDetailsPage,
  SavedPage,
  ApplicationsPage,
  SkillGapPage,
  LearningPage,
  ReadinessPage,
  ProfilePage,
  SettingsPage,
  AdminPage,
} from '@/pages';
import { PlacementDoubtChatbot } from '@/components/chat/PlacementDoubtChatbot';


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar & Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* Authentication / Onboarding Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
          </Route>

          {/* Protected / Dashboard Experience Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/opportunity/:id" element={<OpportunityDetailsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/skill-gap" element={<SkillGapPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/readiness" element={<ReadinessPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Floating AI Placement & Doubt Assistant */}
        <PlacementDoubtChatbot />
      </BrowserRouter>
    </AuthProvider>
  );
};


export default App;

