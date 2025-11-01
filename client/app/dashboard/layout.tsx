'use client';

import React from 'react';
// import ProtectedLayout from './protected-layout';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { ChatParamsProvider } from '@/contexts/ChatParamsContext';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ProtectedLayout>
      <WorkspaceProvider>
        <ChatParamsProvider>
          <div className="min-h-screen bg-white">
            {children}
          </div>
        </ChatParamsProvider>
      </WorkspaceProvider>
    // </ProtectedLayout>
  );
}
