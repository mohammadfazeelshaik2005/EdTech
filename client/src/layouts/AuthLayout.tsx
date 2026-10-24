import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      <Outlet />
    </div>
  );
};
