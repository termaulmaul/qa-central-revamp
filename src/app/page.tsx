"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Command, LayoutGrid, Sparkles, Code2, 
  CheckCircle2, BarChart3, Settings, Database, 
  ChevronRight, ChevronLeft, Bell, User, MoreHorizontal,
  Filter, Plus, Play, GitPullRequest, ShieldAlert,
  MessageSquare, FileCode2, Zap, Send, RotateCcw, Copy,
  LayoutDashboard, FileText, ShieldCheck, Library, RefreshCcw,
  UploadCloud, Globe, LogOut, Check, Link2, Smartphone, Monitor,
  AlertCircle, ArrowLeft, Clock, ChevronDown,
  SlidersHorizontal, Activity, Cpu, Terminal, Bot,
  Key, Server, BookOpen, Save, Shield, Sun, Moon
} from 'lucide-react';
import { QAEngine, type CoverageItem, type TestCase } from '../lib/qa-engine/qa-engine';
import { PDFParser } from '../lib/pdf-parser';

// --- MOCK DATA ---
const MOCK_REQUIREMENTS = [
  { id: 'RQ-1042', title: 'User SSO Authentication via Okta', risk: 'High', coverage: 85, aiConf: 98, status: 'approved' },
  { id: 'RQ-1043', title: 'Role-based access control for admin dashboard', risk: 'High', coverage: 40, aiConf: 72, status: 'review' },
  { id: 'RQ-1044', title: 'Session timeout after 15 minutes of inactivity', risk: 'Low', coverage: 100, aiConf: 95, status: 'approved' },
  { id: 'RQ-1045', title: 'Password reset flow with email OTP', risk: 'Medium', coverage: 15, aiConf: 60, status: 'draft' },
  { id: 'RQ-1046', title: 'Rate limiting on login API endpoints', risk: 'High', coverage: 90, aiConf: 88, status: 'approved' },
  { id: 'RQ-1047', title: 'Audit logging for user data exports', risk: 'Medium', coverage: 0, aiConf: 45, status: 'draft' },
  { id: 'RQ-1048', title: 'GDPR compliance data deletion request', risk: 'High', coverage: 100, aiConf: 99, status: 'approved' },
];

const MOCK_TEST_CASES = [
  { id: 'TC-201', title: 'Verify SSO login with valid Okta credentials', priority: 'P0', type: 'E2E', status: 'ready', auto: true },
  { id: 'TC-202', title: 'Verify SSO login with expired Okta session', priority: 'P1', type: 'Functional', status: 'draft', auto: false },
  { id: 'TC-203', title: 'Admin dashboard access is denied for regular users', priority: 'P0', type: 'E2E', status: 'ready', auto: true },
  { id: 'TC-204', title: 'Session terminates exactly after 15m of inactivity', priority: 'P2', type: 'Functional', status: 'ready', auto: true },
  { id: 'TC-205', title: 'Reset password sends email with 6-digit OTP', priority: 'P1', type: 'API', status: 'review', auto: false },
  { id: 'TC-206', title: 'Login API returns 429 after 5 failed attempts', priority: 'P0', type: 'API', status: 'ready', auto: true },
];

// We inject the design system tokens required by the spec.
// Using a deep dark theme inspired by Linear/Vercel.
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    :root {
      --surface-base: #09090B;        
      --surface-raised: #18181B;      
      --surface-overlay: #27272A;     
      --surface-sunken: #000000;      
      
      --border-subtle: #27272A;
      --border-default: #3F3F46;
      --border-strong: #52525B;
      --border-brand: #6366F1;        
    
      --text-primary: #FAFAFA;
      --text-secondary: #A1A1AA;
      --text-tertiary: #71717A;       
      
      --brand-primary: #6366F1;
      --brand-hover: #4F46E5;
      
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #F43F5E;
    }

    body {
      background-color: var(--surface-base);
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      overflow: hidden; /* App-like feel */
      -webkit-font-smoothing: antialiased;
    }

    /* Custom Spring-like Transition */
    .spring-transition {
      transition-property: all;
      transition-duration: 220ms;
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: var(--surface-overlay);
      border-radius: 4px;
      border: 2px solid var(--surface-base);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--border-default);
    }
  `}} />
);

// Reusable atoms implementing the 8pt grid and strict styling
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    danger: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    brand: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const IconButton = ({ icon: Icon, onClick, className = '', active = false }: { icon: React.ElementType, onClick?: () => void, className?: string, active?: boolean }) => (
  <button 
    onClick={onClick}
    className={`p-1.5 rounded-md spring-transition flex items-center justify-center
      ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50'} 
      ${className}`}
  >
    <Icon size={16} strokeWidth={1.5} />
  </button>
);

const Button = ({ children, variant = 'primary', icon: Icon, className = '', onClick, disabled }: { children?: React.ReactNode, variant?: string, icon?: React.ElementType, className?: string, onClick?: () => void, disabled?: boolean }) => {
  const base = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium spring-transition border";
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-zinc-900 dark:text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
    secondary: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-transparent",
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={1.5} />}
      {children}
    </button>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, activeRoute, setActiveRoute, isDarkMode, setIsDarkMode }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void, activeRoute: string, setActiveRoute: (val: string) => void, isDarkMode: boolean, setIsDarkMode: (val: boolean) => void }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prd-intake', label: 'PRD Intake', icon: FileText },
    { id: 'coverage-audit', label: 'Coverage Audit', icon: ShieldCheck },
    { id: 'test-catalogue', label: 'Test Catalogue', icon: Library },
    { id: 'qase-integration', label: 'Qase Integration', icon: RefreshCcw },
    { id: 'ai-playground', label: 'AI Playground', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div 
      className={`h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col spring-transition ${isCollapsed ? 'w-16' : 'w-[240px]'}`}
      style={{ minWidth: isCollapsed ? '64px' : '240px' }}
    >
      {/* Workspace Header */}
      <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-zinc-900 dark:text-white font-bold text-xs">
              QA
            </div>
            <span className="font-semibold text-sm truncate">Central Dashboard</span>
          </div>
        )}
        <IconButton 
          icon={isCollapsed ? ChevronRight : ChevronLeft} 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className={isCollapsed ? 'mx-auto' : ''}
        />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm group
              ${activeRoute === item.id 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200'}`}
          >
            <item.icon size={16} strokeWidth={1.5} className={activeRoute === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex flex-col gap-1">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200 spring-transition text-sm"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </div>
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200 spring-transition text-sm">
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white">
            <User size={12} />
          </div>
          {!isCollapsed && <span>John Doe</span>}
        </button>
      </div>
    </div>
  );
};

const Header = ({ activeRoute }: { activeRoute: string }) => {
  const routeNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'prd-intake': 'PRD Intake',
    'coverage-audit': 'Coverage Audit',
    'test-catalogue': 'Test Catalogue',
    'qase-integration': 'Qase Integration',
    'ai-playground': 'AI Playground',
    'settings': 'Settings'
  };

  return (
    <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400 ">Core API</span>
          <span className="text-zinc-600 dark:text-zinc-400">/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{routeNames[activeRoute]}</span>
        </div>
        <Badge variant="default" className="bg-zinc-50 dark:bg-zinc-900">Production</Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Mock */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 text-zinc-600 dark:text-zinc-400 text-sm w-64 spring-transition hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700">
          <Search size={14} />
          <span className="flex-1">Search or jump to...</span>
          <kbd className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>
        <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 mx-1"></div>
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 ">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          AI Online
        </div>
        <IconButton icon={Bell} />
        
        <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 mx-1"></div>
        
        {/* Language Toggle */}
        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-xs font-medium">
          <button className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm">ID</button>
          <button className="px-2 py-1 rounded text-zinc-600 dark:text-zinc-400  hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-300  dark:text-zinc-300 spring-transition">EN</button>
        </div>
        
        {/* Logout */}
        <IconButton icon={LogOut} className="text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-500/10" />
      </div>
    </header>
  );
};

const PRDIntakePage = ({ 
  setActiveRoute, 
  setPrdText,
  setAnalysis
}: { 
  setActiveRoute: (route: string) => void,
  setPrdText: (text: string) => void,
  setAnalysis: (data: any) => void
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState('MI Android');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false); 
  const [localText, setLocalText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    let text = '';
    if (file.name.endsWith('.pdf')) {
      text = await PDFParser.extractText(file);
    } else {
      text = await file.text();
    }
    
    setLocalText(text);
    setIsUploaded(true);
  };
  
  const handleAnalyze = async () => {
    if (!localText) return;
    setIsAnalyzing(true);
    try {
      const result = await QAEngine.analyzePRD(localText);
      setPrdText(localText);
      setAnalysis(result);
      setActiveRoute('coverage-audit');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const platforms = [
    { id: 'MI Android', icon: Smartphone },
    { id: 'MI iOS', icon: Smartphone },
    { id: 'MP Android', icon: Smartphone },
    { id: 'MP iOS', icon: Smartphone },
    { id: 'Web Pro', icon: Monitor },
    { id: 'Web Invest', icon: Monitor },
    { id: 'ITS', icon: Database }
  ];

  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'current' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Initialize Test Generation</h2>
          
          <div className="flex items-center w-full relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Area (66%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area / File State */}
            {isUploaded ? (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex items-center justify-between spring-transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono">DT-PRD-2026-017_ Stock Screener-210726-115334.pdf</h3>
                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /> Parsed successfully • 21,873 chars
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setIsUploaded(false)} className="text-xs py-1.5 px-3">
                  Change
                </Button>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 relative">
                <input 
                  type="file" 
                  accept=".txt,.md,.csv,.pdf" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div 
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700/50 hover:border-indigo-500/50 rounded-lg p-10 flex flex-col items-center justify-center text-center spring-transition group bg-white/50 dark:bg-zinc-950/50"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-indigo-50 dark:bg-indigo-500/10 group-hover:scale-110 spring-transition">
                    <UploadCloud size={32} className="text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-1">Upload PRD Document</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mb-4">
                    Drag and drop your file here, or click to browse. 
                    Supported formats: TXT, PDF, MD, CSV.
                  </p>
                  <Button variant="secondary" className="pointer-events-none">Select File</Button>
                </div>
              </div>
            )}

            {/* Configuration Form */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
              
              {/* Target Platform Dropdown */}
              <div className="relative">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  <span>Target Platform</span>
                </label>
                
                {/* Overlay untuk menutup dropdown saat klik di luar area */}
                {isDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                )}
                
                <div className="relative z-50">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between bg-white dark:bg-zinc-950 border rounded-lg px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 spring-transition focus:outline-none focus:ring-1 focus:ring-indigo-500
                      ${isDropdownOpen ? 'border-indigo-500' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const active = platforms.find(p => p.id === selectedPlatform);
                        return active ? (
                          <>
                            <active.icon size={16} className="text-zinc-600 dark:text-zinc-400 " />
                            <span>{active.id}</span>
                          </>
                        ) : 'Select Platform';
                      })()}
                    </div>
                    <ChevronDown size={16} className={`text-zinc-600 dark:text-zinc-400  transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute top-full left-0 w-full mt-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 transform origin-top transition-all duration-200 
                    ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}
                  >
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm spring-transition
                          ${selectedPlatform === platform.id 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-zinc-100'}`}
                      >
                        <platform.icon size={16} className={selectedPlatform === platform.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400'} />
                        <span className="flex-1 text-left">{platform.id}</span>
                        {selectedPlatform === platform.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50"></div>

              {/* API Service */}
              <div>
                <label className="flex flex-col text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  <span>API Service Identifier</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400  font-normal mt-0.5">Optional: Bind to a specific microservice context</span>
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 " />
                  <input 
                    type="text" 
                    placeholder="e.g., core-transaction-api" 
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 spring-transition"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Action Button (Hidden on Desktop since it's in Side Panel) */}
            {!isUploaded && (
              <div className="lg:hidden w-full flex justify-end">
                <Button variant="primary" icon={Sparkles} className="px-6 py-2.5 pointer-events-none opacity-50">
                  Begin AI Analysis
                </Button>
              </div>
            )}

            {/* PRD Content Preview (Only shown when uploaded) */}
            {isUploaded && (
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">PRD Content Extracted</span>
                  </div>
                  <Badge variant="default" className="font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">21,873 chars</Badge>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[600px] text-sm text-zinc-700 dark:text-zinc-300 space-y-8 bg-white dark:bg-zinc-950/30">
                  
                  {/* Title & Metadata */}
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">PRD-2026-017: Stock Screener</h2>
                    <p className="text-zinc-600 dark:text-zinc-400  text-sm">Product: Growin&apos;</p>
                    <hr className="border-zinc-200 dark:border-zinc-800/80 my-5" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-2 uppercase tracking-wider font-semibold">Document Control</div>
                        <div className="space-y-1.5 text-sm">
                          <div>Writer: <span className="text-indigo-600 dark:text-indigo-400 font-medium">@Said Muhammad Yahya</span></div>
                          <div>Designer: <span className="text-indigo-600 dark:text-indigo-400 font-medium">@Rafli Hidayat</span></div>
                        </div>
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-2 uppercase tracking-wider font-semibold">Metadata</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">Status: <Badge variant="success">Approved</Badge></div>
                          <div>Version: 1.0.0</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Background */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">1.</span> Background & Problem Statement
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50/80 dark:bg-zinc-900/30 p-4 rounded border border-zinc-100 dark:border-zinc-800/30">
                      With over 900+ emiten currently listed on the IDX, retail investors face significant cognitive overload when attempting to discover potential investment opportunities. The manual process of filtering stocks based on fundamental and technical metrics is inefficient and prone to error.
                    </p>
                  </div>

                  {/* Section 2: Objectives */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">2.</span> Objectives
                    </h3>
                    <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400 space-y-2">
                      <li><strong className="text-zinc-700 dark:text-zinc-300">Adoption & Engagement:</strong> Increase daily active users utilizing the screener tool by 25%.</li>
                      <li><strong className="text-zinc-700 dark:text-zinc-300">Usability:</strong> Reduce time-to-discovery for technical setups to under 60 seconds.</li>
                      <li><strong className="text-zinc-700 dark:text-zinc-300">Data Integrity:</strong> Ensure 99.9% accuracy of fundamental ratios retrieved from the data vendor.</li>
                      <li><strong className="text-zinc-700 dark:text-zinc-300">Non-advice Integrity:</strong> Strictly maintain neutral positioning; no automated buy/sell recommendations.</li>
                    </ul>
                  </div>

                  {/* Section 3: Functional Requirements */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">3.</span> Functional Requirements (F1-F21)
                    </h3>
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
                          <tr>
                            <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">ID</th>
                            <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Feature</th>
                            <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F1</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Popular Screener</td><td className="px-4 py-2.5">Pre-built screening templates based on popular metrics.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F2</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Add Filter</td><td className="px-4 py-2.5">Ability to append specific fundamental/technical criteria.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F3</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Technical Preset</td><td className="px-4 py-2.5">Golden cross, RSI oversold, MACD crossover presets.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F4</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Custom Preset</td><td className="px-4 py-2.5">Save user-defined screening criteria as a reusable preset.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F5</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Condition Builder</td><td className="px-4 py-2.5">Logical AND/OR grouping for complex filtering rules.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F6</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Universe</td><td className="px-4 py-2.5">Filter by index (LQ45, IDX30) or market cap tiers.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F7</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Result Table</td><td className="px-4 py-2.5">Sortable data grid with inline sparklines.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F8</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Backtest</td><td className="px-4 py-2.5">Simulate historical performance of custom screening rules.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F9</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Export</td><td className="px-4 py-2.5">Download results as CSV or PDF format.</td></tr>
                          <tr><td className="px-4 py-2.5 font-mono text-xs">F10</td><td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Alerts</td><td className="px-4 py-2.5">Push notifications when new stocks enter/exit conditions.</td></tr>
                          <tr><td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 text-xs italic bg-white/50 dark:bg-zinc-950/50" colSpan={3}>... 11 more features truncated for preview ...</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Architecture */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">4.</span> Architecture & Data Flow
                    </h3>
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-indigo-300/80 font-mono text-xs whitespace-pre overflow-x-auto leading-relaxed shadow-inner">
{`[Client App] --(1. Init Rule)--> [API Gateway] --(2. Validate)--> [Screener Service]
                                                                        |
                                                                   (3. Query)
                                                                        V
                                        [Market Data Redis Cache] <--(4. Sync)-- [IDX Feed]`}
                    </div>
                  </div>

                  {/* Section 5: Feature Gating */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">5.</span> Feature Gating (Free vs Premium)
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50/80 dark:bg-zinc-900/30 p-4 rounded border border-zinc-100 dark:border-zinc-800/30">
                      Free users are limited to 3 custom presets and end-of-day data. Premium users unlock unlimited presets, Condition Builder (F5), Backtest Engine (F8), and real-time intraday data processing.
                    </p>
                  </div>

                  {/* Section 6: Appendices */}
                  <div>
                    <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600 dark:text-zinc-400">6.</span> Appendices (Included in Parse)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-start gap-2 bg-zinc-50/80 dark:bg-zinc-900/30 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/50"><CheckCircle2 size={16} className="text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0"/> Definitions & Glossary</div>
                      <div className="flex items-start gap-2 bg-zinc-50/80 dark:bg-zinc-900/30 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/50"><CheckCircle2 size={16} className="text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0"/> Non-Functional Requirements</div>
                      <div className="flex items-start gap-2 bg-zinc-50/80 dark:bg-zinc-900/30 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/50"><CheckCircle2 size={16} className="text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0"/> Release Plan</div>
                      <div className="flex items-start gap-2 bg-zinc-50/80 dark:bg-zinc-900/30 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/50"><CheckCircle2 size={16} className="text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0"/> Acceptance Criteria</div>
                      <div className="flex items-start gap-2 bg-zinc-50/80 dark:bg-zinc-900/30 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/50"><CheckCircle2 size={16} className="text-zinc-600 dark:text-zinc-400 mt-0.5 shrink-0"/> Constraints & Change Logs</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Actions Footer */}
            {isUploaded && (
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => { setIsUploaded(false); setLocalText(''); }} 
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-300 hover:bg-rose-50 dark:bg-rose-500/10 border-transparent px-4"
                >
                  Clear
                </Button>
                <Button 
                  variant="primary" 
                  icon={Sparkles} 
                  className="px-8 py-2.5 text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Generate Scenarios'}
                </Button>
              </div>
            )}

          </div>

          {/* Side Panel (33%) */}
          <div className="hidden lg:block space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-3">
                <Sparkles size={16} /> AI Parsing Engine
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Our models automatically extract requirements, identify edge cases, and map dependencies from unstructured product documentation.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 ">
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 dark:text-emerald-500" /> Gherkin BDD Generation</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 dark:text-emerald-500" /> Risk Assessment Scoring</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-600 dark:text-emerald-500" /> Cross-platform Context</li>
              </ul>
            </div>
            
            <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Recent Intakes</h4>
              <div className="space-y-3">
                {[
                  { name: 'Onboarding_Flow_v2.pdf', time: '2 hours ago', status: 'parsed' },
                  { name: 'Payment_Gateway_Specs.md', time: 'Yesterday', status: 'parsed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-zinc-600 dark:text-zinc-400  shrink-0" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate group-hover:text-zinc-800 dark:text-zinc-200 spring-transition">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 shrink-0 ml-2">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button (Desktop Side Panel) */}
            {!isUploaded && (
              <div className="pt-2">
                <Button variant="primary" icon={Sparkles} className="w-full py-2.5 pointer-events-none opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  Begin AI Analysis
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const ExplorerPage = () => {
  const [selectedReq, setSelectedReq] = useState<{ id: string, title: string, risk: string, coverage: number, aiConf: number, status: string } | null>(MOCK_REQUIREMENTS[0]);
  
  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* LEFT PANE: Data Grid (61.8%) */}
      <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Filter}>Filter</Button>
            <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-2"></div>
            <Badge variant="brand">High Risk</Badge>
            <Badge variant="default">Owner: AI</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" icon={Sparkles}>Generate Tests</Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-xs font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
          <div className="col-span-2">ID</div>
          <div className="col-span-5">Requirement</div>
          <div className="col-span-2">Coverage</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2 text-right">AI Conf</div>
        </div>

        {/* Table Body (Virtualized Mock) */}
        <div className="flex-1 overflow-y-auto">
          {MOCK_REQUIREMENTS.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedReq(req)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 text-sm spring-transition cursor-pointer items-center
                ${selectedReq?.id === req.id ? 'bg-zinc-100 dark:bg-zinc-800/50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-100 dark:bg-zinc-900/50'}`}
            >
              <div className="col-span-2 font-mono text-zinc-600 dark:text-zinc-400">{req.id}</div>
              <div className="col-span-5 font-medium truncate text-zinc-800 dark:text-zinc-200">{req.title}</div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${req.coverage > 80 ? 'bg-emerald-500' : req.coverage > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${req.coverage}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400  w-8">{req.coverage}%</span>
              </div>
              <div className="col-span-1">
                <Badge variant={req.risk === 'High' ? 'danger' : req.risk === 'Medium' ? 'warning' : 'success'}>
                  {req.risk}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${req.aiConf > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">{req.aiConf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANE: Details Drawer (38.2%) */}
      <div className="flex flex-col h-full bg-zinc-50/80 dark:bg-zinc-900/30" style={{ flex: '0 0 38.2%', minWidth: '320px' }}>
        {selectedReq ? (
          <>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1">{selectedReq.id}</div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{selectedReq.title}</h2>
                </div>
                <IconButton icon={MoreHorizontal} />
              </div>
              <div className="flex gap-2 mb-6">
                <Badge variant="default">Version 2.4</Badge>
                <Badge variant="default">API Team</Badge>
              </div>
              
              {/* AI Insight Box */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-2">
                  <Sparkles size={14} /> AI Analysis
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  High confidence ({selectedReq.aiConf}%) in extracting test steps. 
                  Identified 3 edge cases regarding concurrent sessions that are not currently covered in the automation suite.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 py-1 px-2 text-xs">View Edge Cases</Button>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 uppercase tracking-wider">Generated Test Cases</h3>
              
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700 spring-transition group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Verify successful login with valid Okta token</h4>
                      <Badge variant="success" className="opacity-0 group-hover:opacity-100 transition-opacity">Automated</Badge>
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400  font-mono"><span className="text-indigo-600 dark:text-indigo-400 mr-2">GIVEN</span> user is on login page</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400  font-mono"><span className="text-amber-600 dark:text-amber-400 mr-2">WHEN</span> Okta SSO callback returns valid JWT</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400  font-mono"><span className="text-emerald-600 dark:text-emerald-400 mr-2">THEN</span> session is created and user redirected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 dark:text-zinc-400  text-sm">
            Select a requirement to view details
          </div>
        )}
      </div>
    </div>
  );
};

const CoverageAuditPage = ({ 
  setActiveRoute, 
  analysis,
  prdText,
  setTestCases
}: { 
  setActiveRoute: (route: string) => void,
  analysis: any,
  prdText: string,
  setTestCases: (tests: any[]) => void
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const coverage = analysis?.coverage || [];

  const handleGenerateTests = async () => {
    setIsGenerating(true);
    try {
      const tests = await QAEngine.generateTests(prdText, analysis?.prdContent);
      setTestCases(tests);
      setActiveRoute('test-catalogue');
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'current' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Business Capability Audit</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Summary Stats - 0 Capabilities */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-sm">
             <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
             </div>
             <span>AI identified <strong className="text-zinc-800 dark:text-zinc-200 text-base mx-1 font-mono">{coverage.length}</strong> key business capabilities from PRD.</span>
           </div>
           <Badge variant="success" className="bg-zinc-50 dark:bg-zinc-900">Analysis Complete</Badge>
        </div>

        {/* Coverage Content */}
        <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-950/50 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Module / Feature</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Feature ID</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-zinc-600 dark:text-zinc-400">
              {coverage.length > 0 ? (
                coverage.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 spring-transition">
                    <td className="px-4 py-3">
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.area}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{item.progress}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Mapped</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-600">
                    No coverage data found. Please upload a valid PRD.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-zinc-200 dark:border-zinc-800/80 mt-auto shrink-0">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400  font-medium">
                <CheckCircle2 size={16} className="text-emerald-500" /> 
                Coverage audit finished
            </div>
            <Button 
              variant="primary" 
              className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] disabled:opacity-50" 
              icon={Sparkles}
              onClick={handleGenerateTests}
              disabled={isGenerating || coverage.length === 0}
            >
                {isGenerating ? 'Generating Tests...' : 'Generate Test Cases'}
            </Button>
        </div>
        
      </div>
    </div>
  );
};

const TestCataloguePage = ({ setActiveRoute, testCases = [] }: { setActiveRoute: (route: string) => void, testCases?: any[] }) => {
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'current' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Test Catalogue Review</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm mb-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Library size={16} className="text-indigo-500" />
               </div>
               <span className="text-sm text-zinc-600 dark:text-zinc-400">Generated <strong className="text-zinc-800 dark:text-zinc-200">{testCases.length}</strong> test cases for the defined capabilities.</span>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" icon={Filter} className="text-xs">Filter</Button>
                <Button variant="secondary" icon={Plus} className="text-xs">Add Manual Case</Button>
            </div>
        </div>

        {/* Test Catalogue Content */}
        <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-950/50 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Test Case</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Priority</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Type</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Auto</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-zinc-600 dark:text-zinc-400">
              {testCases.map((tc, index) => (
                <tr key={tc.id || index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 spring-transition">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mb-1">{tc.tcId || `TC-${index+1}`}</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium">{tc.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tc.priority === 'Critical' || tc.priority === 'P0' ? 'danger' : tc.priority === 'High' || tc.priority === 'P1' ? 'warning' : 'default'}>
                      {tc.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{tc.type}</td>
                  <td className="px-4 py-3">
                    <Bot size={16} className="text-indigo-500" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">
                      ready
                    </Badge>
                  </td>
                </tr>
              ))}
              {testCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">
                    No test cases generated. Please go back and analyze a PRD first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-zinc-200 dark:border-zinc-800/80 mt-auto shrink-0">
            <Button 
                variant="secondary" 
                icon={ArrowLeft} 
                onClick={() => setActiveRoute('coverage-audit')}
                className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800"
            >
                Back
            </Button>
            <Button 
                variant="primary" 
                icon={Link2} 
                onClick={() => setActiveRoute('qase-integration')}
                className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
                Sync to Qase
            </Button>
        </div>
      </div>
    </div>
  );
};

const QaseIntegrationPage = ({ setActiveRoute, testCases = [] }: { setActiveRoute: (route: string) => void, testCases?: any[] }) => {
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'current' }
  ];

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Qase Integration</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'current' ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Qase Sync Content */}
        <div className="flex-1 min-h-[400px] border border-emerald-500/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-emerald-50/30 dark:bg-emerald-950/10 relative overflow-hidden group shadow-[inset_0_0_40px_rgba(16,185,129,0.05)]">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-6 shadow-2xl relative z-10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={40} />
            </div>
            
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 relative z-10 tracking-tight">Successfully Synced to Qase</h3>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-8 leading-relaxed relative z-10">
                {testCases.length} test cases have been successfully synced to the Qase project repository. You can now view and execute them directly on the Qase platform.
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
                <Button 
                    variant="secondary" 
                    icon={ArrowLeft} 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                    Back to Dashboard
                </Button>
                <Button 
                    variant="primary" 
                    icon={LayoutDashboard} 
                    onClick={() => setActiveRoute('dashboard')}
                    className="px-6 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] bg-emerald-600 hover:bg-emerald-500"
                >
                    Finish
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

const AIPlaygroundPage = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);

  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANE: Chat Interface (61.8%) */}
      <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
        
        {/* Chat Header */}
        <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Chat Session</span>
            </div>
            <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800"></div>
            <Badge variant="brand" className="font-mono bg-indigo-500/5 text-indigo-300 border-indigo-200 dark:border-indigo-500/20">
              DeepSeek-R1-Distill-Qwen-7B-4bit-mlx
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5">
              <Cpu size={12} className="text-emerald-600 dark:text-emerald-400" />
              Apple Silicon (Local)
            </Badge>
            <IconButton icon={MoreHorizontal} />
          </div>
        </div>

        {/* Chat Body (Empty State) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center relative bg-white/50 dark:bg-zinc-950/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950/0 to-zinc-950/0 pointer-events-none opacity-50"></div>
          
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 relative z-10 shadow-lg">
            <MessageSquare size={24} className="text-zinc-600 dark:text-zinc-400" />
          </div>
          <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1 relative z-10">No messages yet</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400  relative z-10">Send a prompt to test the model.</p>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <div className="relative border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:bg-white dark:bg-zinc-950 spring-transition shadow-sm">
            <textarea 
              className="w-full bg-transparent p-3.5 pr-12 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none min-h-[80px]"
              placeholder="Enter your prompt here..."
              defaultValue=""
            ></textarea>
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
              <button className="bg-white hover:bg-zinc-200 text-zinc-950 p-2 rounded-lg spring-transition shadow-md">
                <Send size={14} className="ml-0.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono flex items-center gap-1">
              <Terminal size={10} /> MLX Engine Ready
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Configuration & Performance (38.2%) */}
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950" style={{ flex: '0 0 38.2%', minWidth: '320px' }}>
        
        {/* Right Pane Header */}
        <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 bg-zinc-50/80 dark:bg-zinc-900/30 shrink-0">
          <SlidersHorizontal size={14} className="text-zinc-600 dark:text-zinc-400 mr-2" />
          <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Configuration</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-zinc-50 dark:bg-zinc-900/10">
          
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Model</label>
            <button className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700 spring-transition">
              <span className="truncate pr-2">DeepSeek-R1-Distill-Qwen-7B-4bit-mlx</span>
              <ChevronDown size={14} className="text-zinc-600 dark:text-zinc-400  shrink-0" />
            </button>
          </div>

          {/* Parameters */}
          <div className="space-y-6">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Parameters</label>
            
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Temperature</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{temperature.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="2" step="0.01" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Max Tokens</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{maxTokens}</span>
              </div>
              <input 
                type="range" min="1" max="8192" step="1" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Top P</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{topP.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>

            {/* Top K */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Top K</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400  bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">{topK}</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
          </div>
          
          <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50"></div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-600 dark:text-indigo-400" /> Performance
              </label>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400 ">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div> Idle
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Prefill (t/s)</div>
                <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">0.0</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Token Gen (t/s)</div>
                <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">0.0</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Thinking (s)</div>
                <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">—</div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-600 dark:text-zinc-400  mb-1 font-medium">Duration (s)</div>
                <div className="text-lg font-mono text-zinc-700 dark:text-zinc-300">—</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-8 flex flex-col gap-6 pb-20">
        
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Settings</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 ">Manage integrations, API keys, and generation policies.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Left Column */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {/* 1. LLM Configuration */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
                <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-medium text-zinc-800 dark:text-zinc-200">LLM Configuration</h3>
            </div>
            <Badge variant="danger" className="uppercase font-mono text-[10px]">Not Connected</Badge>
          </div>
          
          {/* Card Body - LLM */}
          <div className="p-6 space-y-5 bg-transparent dark:bg-zinc-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Base URL (OpenAI-compatible)</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                  <input type="text" placeholder="https://api.openai.com/v1" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 spring-transition" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Token <span className="text-zinc-600 dark:text-zinc-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                  <input type="password" placeholder="sk-..." className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 spring-transition" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Model</label>
                <div className="relative">
                  <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                  <input type="text" placeholder="gpt-4o" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 spring-transition" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button variant="secondary" icon={RefreshCcw} className="text-xs py-1.5">Fetch Models</Button>
              <Button variant="primary" icon={Link2} className="text-xs py-1.5 border-transparent">Test Connection</Button>
            </div>
          </div>
        </div>
            
            {/* 3. Qase Capability Matrix */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-between">
            <h3 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Qase Capability Matrix</h3>
            <Button variant="ghost" className="text-xs py-1 px-3 h-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 hover:bg-indigo-50 dark:bg-indigo-500/10">Explore</Button>
          </div>
          
          {/* Card Body - Matrix Table */}
          <div className="overflow-x-auto bg-transparent dark:bg-zinc-900/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Resource</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Endpoint</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Count</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-right">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="px-5 py-3 font-medium">Projects</td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 ">/project</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 text-right">—</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium">Suites</td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 ">/suite/&#123;projectCode&#125;</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 text-right">—</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium">Cases</td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 ">/case/&#123;projectCode&#125;</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 text-right">—</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium flex items-center gap-2">Runs <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-normal">(Optional)</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 ">/run/&#123;projectCode&#125;</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 text-right">—</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium flex items-center gap-2">Defects <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-normal">(Optional)</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 ">/defect/&#123;projectCode&#125;</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">—</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 text-right">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {/* 2. Qase Integration */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-zinc-200">Qase Integration</h3>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400  mt-0.5">API Base URL can be overridden server-side via QASE_BASE_URL. API Token is saved locally in your browser.</p>
              </div>
            </div>
            <Badge variant="warning" className="uppercase font-mono text-[10px]">Not Configured</Badge>
          </div>
          
          {/* Card Body - Qase */}
          <div className="p-6 space-y-5 bg-transparent dark:bg-zinc-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Base URL</label>
                <input type="text" placeholder="https://api.qase.io/v1" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 spring-transition" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Token</label>
                <input type="password" placeholder="Enter Qase API Token" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 spring-transition" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Project</label>
                <div className="relative">
                  <select className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 appearance-none spring-transition">
                    <option value="">Select a project...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="primary" icon={Link2} className="bg-emerald-600 hover:bg-emerald-500 text-xs py-1.5 border-transparent">Test Connection</Button>
              <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 mx-1"></div>
              <Button variant="secondary" icon={Database} className="text-xs py-1.5">Fetch Projects</Button>
              <Button variant="secondary" icon={Database} className="text-xs py-1.5">Fetch Suites</Button>
              <Button variant="secondary" icon={Database} className="text-xs py-1.5">Fetch Test Cases</Button>
            </div>
          </div>
        </div>
            
            {/* 4. QA Guidelines (Knowledge Base) */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-zinc-200">QA Guidelines (Knowledge Base)</h3>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-400  mt-0.5">Standards injected as RAG Context during AI generation.</p>
              </div>
            </div>
            <Badge variant="brand" className="uppercase font-mono text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">RAG Context</Badge>
          </div>
          
          {/* Card Body - Textarea */}
          <div className="p-6 bg-transparent dark:bg-zinc-900/20">
            <textarea 
              className="w-full h-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 resize-y spring-transition font-mono leading-relaxed"
              placeholder="Enter company QA standards, BDD formatting rules, negative testing requirements, etc..."
            ></textarea>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => (
  <div className="h-full w-full p-6 overflow-y-auto bg-white dark:bg-zinc-950">
    <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Test Case Generator Overview</h2>
    
    {/* Top Stats - 4 Columns */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Test Cases', value: '1,248', trend: '+12%', isUp: true },
        { label: 'AI Automation %', value: '78%', trend: '+5%', isUp: true },
        { label: 'Flaky Tests', value: '2.4%', trend: '-1.2%', isUp: true },
        { label: 'Pending PRDs', value: '4', trend: 'Needs Review', isUp: false, neutral: true },
      ].map((stat, i) => (
        <div key={i} className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-900">
          <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">{stat.label}</span>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{stat.value}</span>
            <Badge variant={stat.neutral ? 'warning' : stat.isUp ? 'success' : 'danger'}>
              {stat.trend}
            </Badge>
          </div>
        </div>
      ))}
    </div>

    {/* Layout split mirroring golden ratio approximation (61.8% / 38.2%) */}
    <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
      <div className="flex-1 bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col" style={{ flex: '1 1 61.8%' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">Test Coverage Trend</span>
          <Button variant="ghost" className="text-xs py-1 h-auto">View Report</Button>
        </div>
        <div className="flex-1 flex items-end justify-between border border-zinc-200 dark:border-zinc-800/50 rounded-lg text-zinc-600 dark:text-zinc-400 text-sm bg-white/50 dark:bg-zinc-950/50 p-6 pt-10 relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 p-6 pt-10 pb-12 flex flex-col justify-between pointer-events-none">
            {[100, 75, 50, 25, 0].map(val => (
              <div key={val} className="w-full flex items-center border-b border-zinc-100 dark:border-zinc-800/30 h-0 relative">
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 absolute -left-2 -translate-x-full bg-white dark:bg-zinc-950 pr-2">{val}%</span>
              </div>
            ))}
          </div>
          
          {/* Bars */}
          <div className="w-full h-full flex items-end justify-between pl-8 z-10 relative gap-2">
            {[
              { month: 'Jan', val: 35 }, { month: 'Feb', val: 42 }, 
              { month: 'Mar', val: 51 }, { month: 'Apr', val: 68 }, 
              { month: 'May', val: 76 }, { month: 'Jun', val: 89 }
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end">
                <div className="w-full max-w-[48px] flex flex-col justify-end h-full relative group cursor-pointer">
                  <div 
                    className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t-sm transition-all duration-300 relative"
                    style={{ height: `${d.val}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-medium py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-300 dark:border-zinc-700 pointer-events-none">
                      {d.val}% Coverage
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400  font-medium uppercase tracking-wider">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5" style={{ flex: '0 0 38.2%' }}>
        <span className="text-zinc-700 dark:text-zinc-300 text-sm font-medium mb-4">Recent AI Activity</span>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
           {[
             { action: 'Generated 12 tests', target: 'RQ-1048', time: '10m ago', type: 'ai' },
             { action: 'Updated selectors for', target: 'Login Flow', time: '1h ago', type: 'ai' },
             { action: 'Synced 45 tests to', target: 'Qase Project', time: '2h ago', type: 'system' },
             { action: 'Flagged 2 edge cases in', target: 'RQ-1042', time: '3h ago', type: 'ai' },
             { action: 'Approved pull request for', target: 'Auth Tests', time: '5h ago', type: 'user' },
           ].map((event, i) => (
             <div key={i} className="flex items-start gap-3">
               <div className={`mt-0.5 w-2 h-2 rounded-full ${event.type === 'ai' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : event.type === 'system' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
               <div className="flex-1 text-sm leading-tight">
                 <span className="text-zinc-600 dark:text-zinc-400">{event.action} </span>
                 <span className="text-zinc-800 dark:text-zinc-200 font-medium">{event.target}</span>
                 <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{event.time}</div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // QA Engine States
  const [prdText, setPrdText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);

  const renderContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'prd-intake':
        return <PRDIntakePage 
                 setActiveRoute={setActiveRoute} 
                 setPrdText={setPrdText}
                 setAnalysis={setAnalysis}
               />;
      case 'coverage-audit':
        return <CoverageAuditPage 
                 setActiveRoute={setActiveRoute}
                 analysis={analysis}
                 prdText={prdText}
                 setTestCases={setTestCases}
               />;
      case 'test-catalogue':
        return <TestCataloguePage 
                 setActiveRoute={setActiveRoute}
                 testCases={testCases}
               />;
      case 'qase-integration':
        return <QaseIntegrationPage 
                 setActiveRoute={setActiveRoute}
                 testCases={testCases}
               />;
      case 'ai-playground':
        return <AIPlaygroundPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className={`flex h-screen w-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30 ${isDarkMode ? 'dark' : ''}`}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
          activeRoute={activeRoute}
          setActiveRoute={setActiveRoute}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative shadow-[-10px_0_30px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
          <Header activeRoute={activeRoute} />
          <div className="flex-1 relative overflow-hidden">
            {renderContent()}
          </div>
          
          {/* Telemetry Footer */}
          <footer className="h-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 justify-between text-[10px] text-zinc-600 dark:text-zinc-400  font-mono shrink-0 relative z-20">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-600 dark:text-emerald-500"/> All systems operational</span>
              <span>Workspace: default-ws-1</span>
            </div>
            <div className="flex gap-4">
              <span>Qase Sync: 2 mins ago</span>
              <span>Latency: 42ms</span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
