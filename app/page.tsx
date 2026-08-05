'use client';

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
  Key, Server, BookOpen, Save, Shield
} from 'lucide-react';

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

// Reusable atoms implementing the 8pt grid and strict styling
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
      {/* Workspace Header */}
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

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm group
              ${activeRoute === item.id 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <item.icon size={16} strokeWidth={1.5} className={activeRoute === item.id ? 'text-indigo-400' : ''} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
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
        {/* Global Search Mock */}
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
        
        {/* Language Toggle */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs font-medium">
          <button className="px-2 py-1 rounded bg-zinc-800 text-zinc-100 shadow-sm">ID</button>
          <button className="px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 spring-transition">EN</button>
        </div>
        
        {/* Logout */}
        <IconButton icon={LogOut} className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10" />
      </div>
    </header>
  );
};

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
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Initialize Test Generation</h2>
          
          <div className="flex items-center w-full relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
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
          
          {/* Main Form Area (66%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area / File State */}
            {isUploaded ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between spring-transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100 font-mono">DT-PRD-2026-017_ Stock Screener-210726-115334.pdf</h3>
                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Parsed successfully • 21,873 chars
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
                  className="border-2 border-dashed border-zinc-700/50 hover:border-indigo-500/50 rounded-lg p-10 flex flex-col items-center justify-center text-center spring-transition group cursor-pointer bg-zinc-950/50"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 group-hover:scale-110 spring-transition">
                    <UploadCloud size={32} className="text-zinc-400 group-hover:text-indigo-400" />
                  </div>
                  <h3 className="text-base font-medium text-zinc-200 mb-1">Upload PRD Document</h3>
                  <p className="text-sm text-zinc-500 max-w-sm mb-4">
                    Drag and drop your file here, or click to browse. 
                    Supported formats: TXT, PDF, MD, CSV.
                  </p>
                  <Button variant="secondary" className="pointer-events-none">Select File</Button>
                </div>
              </div>
            )}

            {/* Configuration Form */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
              
              {/* Target Platform Dropdown */}
              <div className="relative">
                <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-3">
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
                    className={`w-full flex items-center justify-between bg-zinc-950 border rounded-lg px-4 py-2.5 text-sm text-zinc-200 spring-transition focus:outline-none focus:ring-1 focus:ring-indigo-500
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

                  {/* Dropdown Menu */}
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
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}`}
                      >
                        <platform.icon size={16} className={selectedPlatform === platform.id ? 'text-indigo-400' : 'text-zinc-500'} />
                        <span className="flex-1 text-left">{platform.id}</span>
                        {selectedPlatform === platform.id && <Check size={14} className="text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-zinc-800/50"></div>

              {/* API Service */}
              <div>
                <label className="flex flex-col text-sm font-medium text-zinc-300 mb-3">
                  <span>API Service Identifier</span>
                  <span className="text-xs text-zinc-500 font-normal mt-0.5">Optional: Bind to a specific microservice context</span>
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="e.g., core-transaction-api" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 spring-transition"
                  />
                </div>
              </div>
            </div>

            {/* PRD Content Preview (Only shown when uploaded) */}
            {isUploaded && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <span className="text-sm font-medium text-zinc-200">PRD Content Extracted</span>
                  </div>
                  <Badge variant="default" className="font-mono bg-zinc-900 border-zinc-700">21,873 chars</Badge>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[600px] text-sm text-zinc-300 space-y-8 bg-zinc-950/30">
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">PRD-2026-017: Stock Screener</h2>
                    <p className="text-zinc-500 text-sm">Product: Growin&apos;</p>
                    <hr className="border-zinc-800/80 my-5" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Document Control</div>
                        <div className="space-y-1.5 text-sm">
                          <div>Writer: <span className="text-indigo-400 font-medium">@Said Muhammad Yahya</span></div>
                          <div>Designer: <span className="text-indigo-400 font-medium">@Rafli Hidayat</span></div>
                        </div>
                      </div>
                      <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Metadata</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">Status: <Badge variant="success">Approved</Badge></div>
                          <div>Version: 1.0.0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-3 flex items-center gap-2">
                      <span className="text-zinc-600">1.</span> Background &amp; Problem Statement
                    </h3>
                    <p className="text-zinc-400 leading-relaxed bg-zinc-900/30 p-4 rounded border border-zinc-800/30">
                      With over 900+ emiten currently listed on the IDX, retail investors face significant cognitive overload when attempting to discover potential investment opportunities.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions Footer */}
            <div className="flex justify-between items-center pt-4">
              {isUploaded ? (
                <>
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
                    className="px-8 py-2.5 text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                  >
                    Generate Scenarios
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <Button variant="primary" icon={Sparkles} className="px-6 py-2 pointer-events-none opacity-50">
                    Begin AI Analysis
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel (33%) */}
          <div className="hidden lg:block space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-3">
                <Sparkles size={16} /> AI Parsing Engine
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Our models automatically extract requirements, identify edge cases, and map dependencies from unstructured product documentation.
              </p>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Gherkin BDD Generation</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Risk Assessment Scoring</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> Cross-platform Context</li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Recent Intakes</h4>
              <div className="space-y-3">
                {[
                  { name: 'Onboarding_Flow_v2.pdf', time: '2 hours ago', status: 'parsed' },
                  { name: 'Payment_Gateway_Specs.md', time: 'Yesterday', status: 'parsed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-zinc-500 shrink-0" />
                      <span className="text-xs text-zinc-400 truncate group-hover:text-zinc-200 spring-transition">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0 ml-2">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExplorerPage = () => {
  const [selectedReq, setSelectedReq] = useState(MOCK_REQUIREMENTS[0]);
  
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden">
      {/* LEFT PANE: Data Grid (61.8%) */}
      <div className="flex flex-col h-full border-r border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Filter}>Filter</Button>
            <div className="h-6 w-px bg-zinc-800 mx-2"></div>
            <Badge variant="brand">High Risk</Badge>
            <Badge variant="default">Owner: AI</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" icon={Sparkles}>Generate Tests</Button>
          </div>
        </div>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-400 shrink-0">
          <div className="col-span-2">ID</div>
          <div className="col-span-5">Requirement</div>
          <div className="col-span-2">Coverage</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2 text-right">AI Conf</div>
        </div>
        {/* Table Body */}
        <div className="flex-1 overflow-y-auto">
          {MOCK_REQUIREMENTS.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedReq(req)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-zinc-800/50 text-sm spring-transition cursor-pointer items-center
                ${selectedReq?.id === req.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/50'}`}
            >
              <div className="col-span-2 font-mono text-zinc-400">{req.id}</div>
              <div className="col-span-5 font-medium truncate text-zinc-200">{req.title}</div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${req.coverage > 80 ? 'bg-emerald-500' : req.coverage > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${req.coverage}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 w-8">{req.coverage}%</span>
              </div>
              <div className="col-span-1">
                <Badge variant={req.risk === 'High' ? 'danger' : req.risk === 'Medium' ? 'warning' : 'success'}>
                  {req.risk}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${req.aiConf > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <span className="font-mono text-zinc-400">{req.aiConf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* RIGHT PANE: Details Drawer (38.2%) */}
      <div className="flex flex-col h-full bg-zinc-900/30" style={{ flex: '0 0 38.2%', minWidth: '320px' }}>
        {selectedReq ? (
          <>
            <div className="p-6 border-b border-zinc-800 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-1">{selectedReq.id}</div>
                  <h2 className="text-lg font-semibold text-zinc-100 leading-tight">{selectedReq.title}</h2>
                </div>
                <IconButton icon={MoreHorizontal} />
              </div>
              <div className="flex gap-2 mb-6">
                <Badge variant="default">Version 2.4</Badge>
                <Badge variant="default">API Team</Badge>
              </div>
              
              {/* AI Insight Box */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-2">
                  <Sparkles size={14} /> AI Analysis
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  High confidence ({selectedReq.aiConf}%) in extracting test steps. 
                  Identified 3 edge cases regarding concurrent sessions that are not currently covered in the automation suite.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="bg-zinc-900 border-zinc-700 py-1 px-2 text-xs">View Edge Cases</Button>
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Generated Test Cases</h3>
              
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 spring-transition group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-zinc-200">Verify successful login with valid Okta token</h4>
                      <Badge variant="success" className="opacity-0 group-hover:opacity-100 transition-opacity">Automated</Badge>
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="text-xs text-zinc-500 font-mono"><span className="text-indigo-400 mr-2">GIVEN</span> user is on login page</div>
                      <div className="text-xs text-zinc-500 font-mono"><span className="text-amber-400 mr-2">WHEN</span> Okta SSO callback returns valid JWT</div>
                      <div className="text-xs text-zinc-500 font-mono"><span className="text-emerald-400 mr-2">THEN</span> session is created and user redirected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Select a requirement to view details
          </div>
        )}
      </div>
    </div>
  );
};

const CoverageAuditPage = () => {
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'current' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20 h-full">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Business Capability Audit</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
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
        {/* AI Summary Stats - 0 Capabilities */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3 text-zinc-400 text-sm">
             <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-amber-500" />
             </div>
             <span>AI identified <strong className="text-zinc-200 text-base mx-1 font-mono">0</strong> key business capabilities from PRD.</span>
           </div>
           <Badge variant="warning" className="bg-zinc-900">No Data</Badge>
        </div>
        {/* Empty State Main Area */}
        <div className="flex-1 min-h-[300px] border-2 border-dashed border-zinc-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-950/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950/0 to-zinc-950/0 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
            
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl relative z-10">
                <ShieldAlert size={36} className="text-zinc-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 relative z-10 tracking-tight">No PRD Uploaded</h3>
            
            <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed relative z-10">
                You haven&apos;t uploaded or successfully parsed a Product Requirements Document yet. 
                Please return to the PRD Intake phase to upload your file and begin the analysis.
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
                <Button 
                    variant="secondary" 
                    icon={ArrowLeft}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800"
                >
                    Back
                </Button>
                <Button 
                    variant="primary" 
                    icon={FileText}
                    className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                >
                    Go to PRD Intake
                </Button>
            </div>
        </div>
        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-zinc-800/80 mt-auto shrink-0">
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <Clock size={16} className="text-zinc-600 animate-pulse" /> 
                Waiting for analysis...
            </div>
            <Button 
              variant="primary" 
              className="opacity-50 pointer-events-none px-6 py-2.5" 
              icon={Sparkles}
            >
                Generate Test Cases
            </Button>
        </div>
        
      </div>
    </div>
  );
};

const TestCataloguePage = () => {
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'current' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20 h-full">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Test Catalogue Review</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
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
        {/* Empty State Main Area */}
        <div className="flex-1 min-h-[400px] border-2 border-dashed border-zinc-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-950/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950/0 to-zinc-950/0 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
            
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl relative z-10">
                <Library size={36} className="text-zinc-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 relative z-10 tracking-tight">No PRD Uploaded</h3>
            
            <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed relative z-10">
                You haven&apos;t uploaded or successfully parsed a Product Requirements Document yet. 
                Please return to the PRD Intake phase to upload your document before reviewing the test catalogue.
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
                <Button 
                    variant="secondary" 
                    icon={ArrowLeft}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800"
                >
                    Back
                </Button>
                <Button 
                    variant="primary" 
                    icon={FileText}
                    className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                >
                    Go to PRD Intake
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

const QaseIntegrationPage = () => {
  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'current' }
  ];
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-8 pb-20 h-full">
        
        {/* Header & Pipeline Workflow */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Qase Integration</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
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
        {/* Empty State Main Area */}
        <div className="flex-1 min-h-[400px] border-2 border-dashed border-zinc-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-950/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950/0 to-zinc-950/0 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
            
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl relative z-10">
                <RefreshCcw size={36} className="text-zinc-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-zinc-100 mb-3 relative z-10 tracking-tight">No Test Cases Available</h3>
            
            <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed relative z-10">
                You haven&apos;t generated or approved any test cases yet. 
                Please complete the PRD Intake and Test Catalogue Review phases to generate test cases before syncing to Qase.
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
                <Button 
                    variant="secondary" 
                    icon={ArrowLeft}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800"
                >
                    Back to Catalogue
                </Button>
                <Button 
                    variant="primary" 
                    icon={FileText}
                    className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                >
                    Go to PRD Intake
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
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANE: Chat Interface (61.8%) */}
      <div className="flex flex-col h-full border-r border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
        
        {/* Chat Header */}
        <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-indigo-400" />
              <span className="font-semibold text-sm text-zinc-100">Chat Session</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <Badge variant="brand" className="font-mono bg-indigo-500/5 text-indigo-300 border-indigo-500/20">
              DeepSeek-R1-Distill-Qwen-7B-4bit-mlx
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-zinc-900 border-zinc-700 flex items-center gap-1.5">
              <Cpu size={12} className="text-emerald-400" />
              Apple Silicon (Local)
            </Badge>
            <IconButton icon={MoreHorizontal} />
          </div>
        </div>
        {/* Chat Body (Empty State) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center relative bg-zinc-950/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950/0 to-zinc-950/0 pointer-events-none opacity-50"></div>
          
          <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mb-4 relative z-10 shadow-lg">
            <MessageSquare size={24} className="text-zinc-600" />
          </div>
          <h3 className="text-base font-medium text-zinc-300 mb-1 relative z-10">No messages yet</h3>
          <p className="text-sm text-zinc-500 relative z-10">Send a prompt to test the model.</p>
        </div>
        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
          <div className="relative border border-zinc-700 rounded-xl bg-zinc-900/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:bg-zinc-950 spring-transition shadow-sm">
            <textarea 
              className="w-full bg-transparent p-3.5 pr-12 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none min-h-[80px]"
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
            <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
              <Terminal size={10} /> MLX Engine Ready
            </span>
          </div>
        </div>
      </div>
      {/* RIGHT PANE: Configuration & Performance (38.2%) */}
      <div className="flex flex-col h-full bg-zinc-950" style={{ flex: '0 0 38.2%', minWidth: '320px' }}>
        
        {/* Right Pane Header */}
        <div className="h-12 border-b border-zinc-800 flex items-center px-5 bg-zinc-900/30 shrink-0">
          <SlidersHorizontal size={14} className="text-zinc-400 mr-2" />
          <span className="font-medium text-sm text-zinc-200">Configuration</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-zinc-900/10">
          
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Model</label>
            <button className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 hover:border-zinc-700 spring-transition">
              <span className="truncate pr-2">DeepSeek-R1-Distill-Qwen-7B-4bit-mlx</span>
              <ChevronDown size={14} className="text-zinc-500 shrink-0" />
            </button>
          </div>
          {/* Parameters */}
          <div className="space-y-6">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Parameters</label>
            
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">Temperature</span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{temperature.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="2" step="0.01" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">Max Tokens</span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{maxTokens}</span>
              </div>
              <input 
                type="range" min="1" max="8192" step="1" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
            {/* Top P */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">Top P</span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{topP.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" value={topP} onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
            {/* Top K */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300">Top K</span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{topK}</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
          </div>
          
          <div className="w-full h-px bg-zinc-800/50"></div>
          {/* Performance Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-400" /> Performance
              </label>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div> Idle
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Prefill (t/s)</div>
                <div className="text-lg font-mono text-zinc-300">0.0</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Token Gen (t/s)</div>
                <div className="text-lg font-mono text-zinc-300">0.0</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Thinking (s)</div>
                <div className="text-lg font-mono text-zinc-300">—</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1 font-medium">Duration (s)</div>
                <div className="text-lg font-mono text-zinc-300">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => (
  <div className="h-full w-full p-6 overflow-y-auto bg-zinc-950">
    <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Test Case Generator Overview</h2>
    
    {/* Top Stats - 4 Columns */}
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
    {/* Layout split mirroring golden ratio approximation (61.8% / 38.2%) */}
    <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
      <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 flex flex-col" style={{ flex: '1 1 61.8%' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-300 text-sm font-medium">Test Coverage Trend</span>
          <Button variant="ghost" className="text-xs py-1 h-auto">View Report</Button>
        </div>
        <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-800/50 rounded-lg text-zinc-600 text-sm bg-zinc-950/50">
          <BarChart3 size={24} className="mr-2 text-zinc-700" /> [ Interactive Chart Placeholder ]
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
             { action: 'Approved pull request for', target: 'Auth Tests', time: '5h ago', type: 'user' },
           ].map((event, i) => (
             <div key={i} className="flex items-start gap-3">
               <div className={`mt-0.5 w-2 h-2 rounded-full ${event.type === 'ai' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : event.type === 'system' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
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

const SettingsPage = () => (
  <div className="h-full w-full p-6 overflow-y-auto bg-zinc-950">
    <h2 className="text-2xl font-semibold text-zinc-100 mb-4">Settings</h2>
    <p className="text-sm text-zinc-500 mb-6">Manage integrations, API keys, and generation policies.</p>
    
    {/* LLM Configuration */}
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden mb-6">
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h3 className="font-medium text-zinc-200">LLM Configuration</h3>
        <Badge variant="danger" className="uppercase font-mono text-[10px]">Not Connected</Badge>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Base URL</label>
          <input type="text" placeholder="https://api.openai.com/v1" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
        </div>
        <Button variant="primary" className="w-full">Test Connection</Button>
      </div>
    </div>
  </div>
);

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
        return <CoverageAuditPage />;
      case 'test-catalogue':
        return <TestCataloguePage />;
      case 'qase-integration':
        return <QaseIntegrationPage />;
      case 'ai-playground':
        return <AIPlaygroundPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-indigo-500/30">
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
  );
}
