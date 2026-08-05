'use client';

import { useState } from 'react';
import {
  Search, LayoutGrid, Sparkles, Code2,
  CheckCircle2, BarChart3, Settings, Database,
  ChevronRight, ChevronLeft, Bell, User, MoreHorizontal,
  Filter, Plus, Play, GitPullRequest, ShieldAlert,
  MessageSquare, FileCode2, Zap, Send, RotateCcw, Copy,
  LayoutDashboard, FileText, ShieldCheck, Library, RefreshCcw,
  UploadCloud, Globe, LogOut, Check, Link2, Smartphone, Monitor,
  AlertCircle, ArrowLeft, Clock, ChevronDown,
  SlidersHorizontal, Activity, Cpu, Terminal, Bot,
  Key, Server, BookOpen, Save, Shield
} from 'lucide-react';

// Mock Data
const MOCK_REQUIREMENTS = [
  { id: 'RQ-1042', title: 'User SSO Authentication via Okta', risk: 'High', coverage: 85, aiConf: 98, status: 'approved' },
  { id: 'RQ-1043', title: 'Role-based access control for admin dashboard', risk: 'High', coverage: 40, aiConf: 72, status: 'review' },
  { id: 'RQ-1044', title: 'Session timeout after 15 minutes of inactivity', risk: 'Low', coverage: 100, aiConf: 95, status: 'approved' },
  { id: 'RQ-1045', title: 'Password reset flow with email OTP', risk: 'Medium', coverage: 15, aiConf: 60, status: 'draft' },
];

// Global Styles with Design Tokens
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
      overflow: hidden;
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

// Badge Component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    brand: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Icon Button Component
const IconButton = ({ icon: Icon, onClick, className = '', active = false }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-md spring-transition flex items-center justify-center
      ${active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}
      ${className}`}
  >
    <Icon size={16} strokeWidth={1.5} />
  </button>
);

// Button Component
const Button = ({ children, variant = 'primary', icon: Icon, className = '', onClick }) => {
  const base = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium spring-transition border";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300 border-transparent",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={1.5} />}
      {children}
    </button>
  );
};

// Sidebar Component
const Sidebar = ({ isCollapsed, setIsCollapsed, activeRoute, setActiveRoute }) => {
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
      className={`h-full border-r border-zinc-800 bg-zinc-950 flex flex-col spring-transition ${isCollapsed ? 'w-16' : 'w-[240px]'}`}
      style={{ minWidth: isCollapsed ? '64px' : '240px' }}
    >
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              QA
            </div>
            <span className="font-semibold text-sm truncate">Acme Corp</span>
          </div>
        )}
        <IconButton
          icon={isCollapsed ? ChevronRight : ChevronLeft}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={isCollapsed ? 'mx-auto' : ''}
        />
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm
              ${activeRoute === item.id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <item.icon size={16} strokeWidth={1.5} className={activeRoute === item.id ? 'text-indigo-400' : ''} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-2 border-t border-zinc-800 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 spring-transition text-sm mt-1">
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={12} />
          </div>
          {!isCollapsed && <span>John Doe</span>}
        </button>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ activeRoute }) => {
  const routeNames = {
    'dashboard': 'Dashboard',
    'prd-intake': 'PRD Intake',
    'coverage-audit': 'Coverage Audit',
    'test-catalogue': 'Test Catalogue',
    'qase-integration': 'Qase Integration',
    'ai-playground': 'AI Playground',
    'settings': 'Settings'
  };

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Core API</span>
          <span className="text-zinc-600">/</span>
          <span className="font-medium text-zinc-100">{routeNames[activeRoute]}</span>
        </div>
        <Badge variant="default" className="bg-zinc-900">Production</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-400 text-sm w-64 spring-transition hover:border-zinc-700">
          <Search size={14} />
          <span className="flex-1">Search or jump to...</span>
          <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          AI Online
        </div>
        <IconButton icon={Bell} />
        <div className="w-px h-4 bg-zinc-800 mx-1"></div>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs font-medium">
          <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-100 shadow-sm">ID</button>
          <button className="px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 spring-transition">EN</button>
        </div>
        <IconButton icon={LogOut} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10" />
      </div>
    </header>
  );
};

// Dashboard Page
const DashboardPage = () => (
  <div className="h-full w-full p-6 overflow-y-auto bg-zinc-950">
    <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Test Case Generator Overview</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Test Cases', value: '1,248', trend: '+12%', isUp: true },
        { label: 'AI Automation %', value: '78%', trend: '+5%', isUp: true },
        { label: 'Flaky Tests', value: '2.4%', trend: '-1.2%', isUp: true },
        { label: 'Pending PRDs', value: '4', trend: 'Needs Review', isUp: false, neutral: true },
      ].map((stat, i) => (
        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between spring-transition hover:border-zinc-700 hover:bg-zinc-900">
          <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-zinc-100 tracking-tight">{stat.value}</span>
            <Badge variant={stat.neutral ? 'warning' : stat.isUp ? 'success' : 'danger'}>
              {stat.trend}
            </Badge>
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 flex flex-col" style={{ flex: '1 1 61.8%' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-300 text-sm font-medium">Test Coverage Trend</span>
          <Button variant="ghost" className="text-xs py-1 h-auto">View Report</Button>
        </div>
        <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-800/50 rounded-lg text-zinc-600 text-sm bg-zinc-950/50">
          <BarChart3 size={24} className="mr-2 text-zinc-700" /> [ Interactive Chart ]
        </div>
      </div>

      <div className="flex flex-col bg-zinc-900/30 border border-zinc-800 rounded-xl p-5" style={{ flex: '0 0 38.2%' }}>
        <span className="text-zinc-300 text-sm font-medium mb-4">Recent AI Activity</span>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {[
            { action: 'Generated 12 tests', target: 'RQ-1048', time: '10m ago', type: 'ai' },
            { action: 'Updated selectors for', target: 'Login Flow', time: '1h ago', type: 'ai' },
            { action: 'Synced 45 tests to', target: 'Qase Project', time: '2h ago', type: 'system' },
            { action: 'Flagged 2 edge cases in', target: 'RQ-1042', time: '3h ago', type: 'ai' },
          ].map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 w-2 h-2 rounded-full ${event.type === 'ai' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <div className="flex-1 text-sm leading-tight">
                <span className="text-zinc-400">{event.action} </span>
                <span className="text-zinc-200 font-medium">{event.target}</span>
                <div className="text-xs text-zinc-600 mt-1">{event.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// PRD Intake Page
const PRDIntakePage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('MI Android');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const platforms = [
    { id: 'MI Android', icon: Smartphone },
    { id: 'MI iOS', icon: Smartphone },
    { id: 'MP Android', icon: Smartphone },
    { id: 'MP iOS', icon: Smartphone },
    { id: 'Web Pro', icon: Monitor },
  ];

  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'current' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Initialize Test Generation</h2>

          <div className="flex items-center w-full relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : step.status === 'pending'
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-500'
                        : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'}`}
                  >
                    {step.status === 'completed' ? <Check size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'current' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {isUploaded ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between spring-transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100 font-mono">PRD-2026-017.pdf</h3>
                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Parsed successfully
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setIsUploaded(false)} className="text-xs py-1.5 px-3">
                  Change
                </Button>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-1">
                <div
                  onClick={() => setIsUploaded(true)}
                  className="border-2 border-dashed border-zinc-700/50 hover:border-indigo-500/50 rounded-lg p-10 flex flex-col items-center justify-center text-center spring-transition cursor-pointer bg-zinc-950/50"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10">
                    <UploadCloud size={32} className="text-zinc-400" />
                  </div>
                  <h3 className="text-base font-medium text-zinc-200 mb-1">Upload PRD Document</h3>
                  <p className="text-sm text-zinc-500 max-w-sm mb-4">
                    Drag and drop your file here, or click to browse.
                  </p>
                  <Button variant="secondary" className="pointer-events-none">Select File</Button>
                </div>
              </div>
            )}

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
              <div className="relative">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-3">
                  <span>Target Platform</span>
                </label>

                {isDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                )}

                <div className="relative z-50">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between bg-zinc-950 border rounded-lg px-4 py-2.5 text-sm text-zinc-200 spring-transition
                      ${isDropdownOpen ? 'border-indigo-500' : 'border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const active = platforms.find(p => p.id === selectedPlatform);
                        return active ? (
                          <>
                            <active.icon size={16} className="text-zinc-500" />
                            <span>{active.id}</span>
                          </>
                        ) : 'Select Platform';
                      })()}
                    </div>
                    <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`absolute top-full left-0 w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 transform origin-top transition-all duration-200
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
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-zinc-300 hover:bg-zinc-800'}`}
                      >
                        <platform.icon size={16} />
                        <span>{platform.id}</span>
                        {selectedPlatform === platform.id && <Check size={14} className="ml-auto text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsUploaded(false)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-transparent px-4"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                icon={Sparkles}
                className="px-8 py-2.5 text-sm"
              >
                Generate Scenarios
              </Button>
            </div>
          </div>

          <div className="hidden lg:block space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-3">
                <Sparkles size={16} /> AI Parsing
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Automatically extract requirements and identify edge cases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty Page Component
const EmptyPage = ({ title, icon: Icon, setActiveRoute, to = 'prd-intake' }) => (
  <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
    <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20 h-full">
      <div className="flex-1 min-h-[400px] border-2 border-dashed border-zinc-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-950/50">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
          <Icon size={36} className="text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-3">{title}</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          Please complete the PRD Intake phase first.
        </p>
        <Button
          variant="primary"
          icon={FileText}
          onClick={() => setActiveRoute(to)}
          className="px-6 py-2.5"
        >
          Go to PRD Intake
        </Button>
      </div>
    </div>
  </div>
);

// Settings Page
const SettingsPage = () => (
  <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
    <div className="max-w-4xl mx-auto w-full p-8 flex flex-col gap-6 pb-20">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100 mb-1">Settings</h2>
        <p className="text-sm text-zinc-500">Manage integrations and configuration.</p>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="font-medium text-zinc-200">LLM Configuration</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Base URL</label>
            <input type="text" placeholder="https://api.openai.com/v1" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200" />
          </div>
          <Button variant="primary" className="py-2">Test Connection</Button>
        </div>
      </div>
    </div>
  </div>
);

// Main App
export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState('dashboard');

  const renderContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'prd-intake':
        return <PRDIntakePage />;
      case 'coverage-audit':
        return <EmptyPage title="Coverage Audit" icon={ShieldCheck} setActiveRoute={setActiveRoute} />;
      case 'test-catalogue':
        return <EmptyPage title="Test Catalogue" icon={Library} setActiveRoute={setActiveRoute} />;
      case 'qase-integration':
        return <EmptyPage title="Qase Integration" icon={RefreshCcw} setActiveRoute={setActiveRoute} />;
      case 'ai-playground':
        return <EmptyPage title="AI Playground" icon={Sparkles} setActiveRoute={setActiveRoute} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          activeRoute={activeRoute}
          setActiveRoute={setActiveRoute}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
          <Header activeRoute={activeRoute} />
          <div className="flex-1 relative overflow-hidden">
            {renderContent()}
          </div>

          <footer className="h-6 border-t border-zinc-800 bg-zinc-950 flex items-center px-4 justify-between text-[10px] text-zinc-500 font-mono shrink-0 relative z-20">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500"/> All systems operational</span>
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
