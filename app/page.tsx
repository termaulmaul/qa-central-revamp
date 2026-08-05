'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/pages/Dashboard';
import { PRDIntakePage } from '@/components/pages/PRDIntakePage';
import { CoverageAuditPage } from '@/components/pages/CoverageAuditPage';
import { TestCataloguePage } from '@/components/pages/TestCataloguePage';
import { SettingsPage } from '@/components/pages/SettingsPage';

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState('dashboard');

  const renderPage = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'prd-intake':
        return <PRDIntakePage />;
      case 'coverage-audit':
        return <CoverageAuditPage />;
      case 'test-catalogue':
        return <TestCataloguePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header activeRoute={activeRoute} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
