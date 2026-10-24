import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/ui';
import { Footer } from '@/components/common/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
