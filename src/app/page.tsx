"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, Command, LayoutGrid, Sparkles, Code2, 
  CheckCircle2, BarChart3, Settings, Database, 
  ChevronRight, ChevronLeft, Bell, MoreHorizontal,
  Filter, Plus, Play, GitPullRequest, ShieldAlert,
  MessageSquare, FileCode2, Zap, Send, RotateCcw, Copy,
  LayoutDashboard, FileText, ShieldCheck, Library, RefreshCcw,
  UploadCloud, Globe, LogOut, Check, Link2, Smartphone, Monitor,
  AlertCircle, ArrowLeft, Clock, ChevronDown,
  SlidersHorizontal, Activity, Cpu, Terminal, Bot,
  Key, Server, BookOpen, Save, Shield, Sun, Moon,
  X, Edit3, Trash2, Network, Loader, Download, Paperclip, Square,
  List, History, Folder
} from 'lucide-react';
import { QAEngine, type CoverageItem, type TestCase } from '../lib/qa-engine/qa-engine';
import { PDFParser } from '../lib/pdf-parser';
import { QaseAPI, type QaseSuite, type QaseProject } from '../lib/qase-api';
import { useQaseState, updateQaseState } from '../lib/qase-store';
import type { QaseCapability } from '../types/qase';
import { useLLMState, updateLLMState, testLLMChat, abortLLMChat, fetchLLMModels } from '../lib/llm-store';
import { useQAGuidelinesState, updateQAGuidelinesState } from '../lib/qa-guidelines-store';
import { useCurrentUser, triggerSignOut, type CurrentUser } from '../lib/use-current-user';
import { useTheme, setTheme } from '../lib/theme-store';
import { useUserSettingsSync } from '../lib/user-settings';

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'|'info'}[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...customEvent.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-500' : 'bg-zinc-800'} transition-all transform pointer-events-auto flex items-center gap-2`}
          role="status"
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
        >
          {t.type === 'error' && <AlertCircle size={16} aria-hidden="true" />}
          {t.type === 'success' && <CheckCircle2 size={16} aria-hidden="true" />}
          {t.type === 'info' && <Bell size={16} aria-hidden="true" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};


// --- REMOVED MOCK DATA ---

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
    brand: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
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
  const base = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium spring-transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
    secondary: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] text-zinc-700 dark:text-zinc-300 border-transparent",
    danger: "bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant] ?? variants.primary} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={1.5} />}
      {children}
    </button>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, activeRoute, setActiveRoute, isDarkMode, setIsDarkMode, user }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void, activeRoute: string, setActiveRoute: (val: string) => void, isDarkMode: boolean, setIsDarkMode: (val: boolean) => void, user: CurrentUser | null }) => {
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
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
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
        <Link
          href="/modules"
          aria-label="Back to Menu"
          title="Back to Menu"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          {!isCollapsed && <span className="truncate">Back to Menu</span>}
        </Link>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoute(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md spring-transition text-sm group
              ${activeRoute === item.id 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200'}`}
          >
            <item.icon size={16} strokeWidth={1.5} className={activeRoute === item.id ? 'text-blue-600 dark:text-blue-400' : ''} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex flex-col gap-1">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900/70">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white uppercase">
              {(user.username ?? user.displayName ?? user.email ?? '?').slice(0, 2)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {user.displayName ?? user.username ?? user.email}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-blue-500 font-semibold">
                  {user.role}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <IconButton
                icon={LogOut}
                onClick={() => triggerSignOut()}
                className="shrink-0 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:bg-rose-500/10"
              />
            )}
          </div>
        )}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800/50 hover:text-zinc-800 dark:text-zinc-200 spring-transition text-sm"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </div>
          {!isCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </div>
  );
};

const Header = ({ activeRoute, user }: { activeRoute: string, user: CurrentUser | null }) => {
  const routeNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'prd-intake': 'PRD Intake',
    'coverage-audit': 'Coverage Audit',
    'test-catalogue': 'Test Catalogue',
    'qase-integration': 'Qase Integration',
    'ai-playground': 'AI Playground',
    'settings': 'Settings',
  };

  return (
    <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400 ">Test Case Generator</span>
          <span className="text-zinc-600 dark:text-zinc-400">/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{routeNames[activeRoute]}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <IconButton icon={Bell} />
        
        <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 mx-1"></div>
        
        {/* Language Toggle */}
        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-xs font-medium">
          <button className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm">ID</button>
          <button className="px-2 py-1 rounded text-zinc-600 dark:text-zinc-400  hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-300  dark:text-zinc-300 spring-transition">EN</button>
        </div>
        

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
  const [fileName, setFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentIntakes, setRecentIntakes] = useState<{name: string, time: string, content: string}[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('recentIntakes');
    if (saved) setRecentIntakes(JSON.parse(saved));
  }, []);

  const saveRecentIntake = (name: string, content: string) => {
    const newIntakes = [{ name, time: new Date().toLocaleString(), content }, ...recentIntakes.filter(i => i.name !== name)].slice(0, 5);
    setRecentIntakes(newIntakes);
    localStorage.setItem('recentIntakes', JSON.stringify(newIntakes));
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    let text = '';
    if (file.name.endsWith('.pdf')) {
      text = await PDFParser.extractText(file);
    } else {
      text = await file.text();
    }
    
    setLocalText(text);
    setIsUploaded(true);
  };
  
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  
  const handleAnalyze = async () => {
    if (!localText) return;
    setIsAnalyzing(true);
    try {
      saveRecentIntake(inputMode === 'upload' ? (fileName || 'Document.pdf') : 'Raw PRD Text', localText);
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

  const handleLoadRecent = (intake: any) => {
    setFileName(intake.name);
    setLocalText(intake.content);
    setInputMode(intake.name === 'Raw PRD Text' ? 'text' : 'upload');
    setIsUploaded(intake.name !== 'Raw PRD Text');
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
    <div className="h-full w-full bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-6 flex-1 min-h-0 pb-10">
        
        {/* Header & Pipeline Workflow */}
        <div className="shrink-0">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Initialize Test Generation</h2>
          
          <div className="flex items-center w-full relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
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

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Area (66%) */}
          <div className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
            
            {/* Input Mode Toggle */}
            <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setInputMode('upload')}
                className={`pb-3 text-sm font-medium transition-colors ${inputMode === 'upload' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent'}`}
              >
                Upload PDF
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`pb-3 text-sm font-medium transition-colors ${inputMode === 'text' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent'}`}
              >
                PRD Content
              </button>
            </div>

            {/* Input Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {inputMode === 'upload' ? (
                isUploaded ? (
                  <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                          <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono">{fileName || 'Document.pdf'}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">{localText.length.toLocaleString()} chars</Badge>
                        <Button variant="secondary" onClick={() => { setIsUploaded(false); setLocalText(''); }} className="text-xs py-1 px-2 h-7">
                          Change
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950/30">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {localText}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 relative min-h-[300px]">
                    <input 
                      type="file" 
                      accept=".txt,.md,.csv,.pdf" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div 
                      className="h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700/50 hover:border-blue-500/50 rounded-lg flex flex-col items-center justify-center text-center spring-transition group bg-white/50 dark:bg-zinc-950/50"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:bg-blue-500/10 group-hover:scale-110 spring-transition">
                        <UploadCloud size={32} className="text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-1">Upload PRD Document</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mb-4">
                        Drag and drop your file here, or click to browse. 
                        Supported formats: TXT, PDF, MD, CSV.
                      </p>
                      <Button variant="secondary" className="pointer-events-none">Select File</Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Raw Content</span>
                    </div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{localText.length.toLocaleString()} chars</span>
                  </div>
                  <textarea
                    value={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    placeholder="Paste your PRD content here in plain text or Markdown..."
                    className="flex-1 w-full p-4 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none font-mono"
                  />
                </div>
              )}
            </div>





          </div>

          {/* Side Panel (33%) */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
            
            <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Recent Intakes</h4>
              <div className="space-y-3">
                {recentIntakes.length > 0 ? recentIntakes.map((item, i) => (
                  <div key={i} onClick={() => handleLoadRecent(item)} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-zinc-500 dark:text-zinc-500 shrink-0 group-hover:text-blue-500 spring-transition" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 spring-transition">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-500 shrink-0 ml-2">{item.time.split(',')[0]}</span>
                  </div>
                )) : (
                  <div className="text-xs text-zinc-500 text-center py-2 italic">No recent intakes</div>
                )}
              </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm mb-1">
                <Settings size={16} /> Configuration
              </div>
              
              {/* Target Platform Dropdown */}
              <div className="relative">
                <label className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
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
                    className={`w-full flex items-center justify-between bg-white dark:bg-zinc-950 border rounded-lg px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 spring-transition focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${isDropdownOpen ? 'border-blue-500' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-300 dark:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const active = platforms.find(p => p.id === selectedPlatform);
                        return active ? (
                          <>
                            <active.icon size={14} className="text-zinc-600 dark:text-zinc-400 " />
                            <span>{active.id}</span>
                          </>
                        ) : 'Select Platform';
                      })()}
                    </div>
                    <ChevronDown size={14} className={`text-zinc-600 dark:text-zinc-400  transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`absolute top-full left-0 w-full mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 transform origin-top transition-all duration-200 
                    ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}
                  >
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm spring-transition
                          ${selectedPlatform === platform.id 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-zinc-100'}`}
                      >
                        <platform.icon size={14} className={selectedPlatform === platform.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'} />
                        <span className="flex-1 text-left">{platform.id}</span>
                        {selectedPlatform === platform.id && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* API Service */}
              <div>
                <label className="flex flex-col text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span>API Service Identifier</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">Optional: Bind to a specific microservice</span>
                </label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 " />
                  <input 
                    type="text" 
                    placeholder="e.g., core-transaction-api" 
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 spring-transition"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {((inputMode === 'upload' && !isUploaded) || (inputMode === 'text' && !localText.trim())) ? (
                <Button variant="primary" icon={Sparkles} className="w-full py-2.5 pointer-events-none opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  Begin AI Analysis
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="primary" 
                    icon={Sparkles} 
                    className="w-full py-2.5 text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Generate Scenarios'}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => { setIsUploaded(false); setLocalText(''); }} 
                    className="w-full py-2.5 text-sm shadow-sm"
                  >
                    Clear Content
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ExplorerPage removed

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
    <div className="h-full w-full bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-6 flex-1 min-h-0 pb-10">
        
        {/* Header & Pipeline Workflow */}
        <div className="shrink-0">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Business Capability Audit</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
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
        <div className="shrink-0 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-sm">
             <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
             </div>
             <span>AI identified <strong className="text-zinc-800 dark:text-zinc-200 text-base mx-1 font-mono">{coverage.length}</strong> key business capabilities from PRD.</span>
           </div>
           <Badge variant="success" className="bg-zinc-50 dark:bg-zinc-900">Analysis Complete</Badge>
        </div>

        {/* Coverage Content */}
        <div className="flex-1 min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-950/50 shadow-sm flex flex-col">
          <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
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
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{item.progress}</span>
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
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800/80 shrink-0">
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
const EditTestCaseModal = ({ tc, onClose, onSave, onDelete }: { tc: any, onClose: () => void, onSave: (updatedTc: any) => void, onDelete?: (tc: any) => void }) => {
  const [formData, setFormData] = useState<any>(tc);

  useEffect(() => {
    setFormData(tc);
  }, [tc]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      if (!prev) return prev;
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });
  };

  const handleAddStep = () => {
    setFormData((prev: any) => {
      if (!prev) return prev;
      return { ...prev, steps: [...(prev.steps || []), { action: '', expectedResult: '', data: '' }] };
    });
  };

  const handleDeleteStep = (index: number) => {
    setFormData((prev: any) => {
      if (!prev) return prev;
      const newSteps = [...prev.steps];
      newSteps.splice(index, 1);
      return { ...prev, steps: newSteps };
    });
  };

  if (!tc || !formData) return null;

  return (
    <>
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl flex flex-col rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative max-h-[90vh]">
          
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formData.tcId}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{formData.suite || 'Uncategorized'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 spring-transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Test Case Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Suite</label>
                <input
                  type="text"
                  value={formData.suite || ''}
                  onChange={(e) => setFormData({ ...formData, suite: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Type</label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Priority</label>
                <select
                  value={
                    formData.priority === 'Critical' ? 'P0' :
                    formData.priority === 'High' ? 'P1' :
                    formData.priority === 'Medium' ? 'P2' :
                    formData.priority === 'Low' ? 'P3' :
                    (formData.priority || 'P2')
                  }
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="P0">P0 (Critical)</option>
                  <option value="P1">P1 (High)</option>
                  <option value="P2">P2 (Medium)</option>
                  <option value="P3">P3 (Low)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Behavior</label>
                <select
                  value={formData.behavior || 'Positive'}
                  onChange={(e) => setFormData({ ...formData, behavior: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Tags (comma-separated)</label>
              <input
                type="text"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
                placeholder="e.g., UI, Search, Critical"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Pre-condition</label>
              <textarea
                value={formData.precondition || ''}
                onChange={(e) => setFormData({ ...formData, precondition: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Test Steps</label>
                <Button variant="ghost" onClick={handleAddStep} className="text-xs px-2 py-1 h-auto">+ Add Step</Button>
              </div>
              <div className="space-y-3">
                {formData.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-600">Step {idx + 1}</span>
                      <button onClick={() => handleDeleteStep(idx)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-medium text-zinc-500 uppercase">Action</label>
                          <input
                            type="text"
                            value={step.action || ''}
                            onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-medium text-zinc-500 uppercase">Expected Result</label>
                          <input
                            type="text"
                            value={step.expectedResult || ''}
                            onChange={(e) => handleStepChange(idx, 'expectedResult', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Post-condition</label>
              <textarea
                value={formData.postcondition || ''}
                onChange={(e) => setFormData({ ...formData, postcondition: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center shrink-0">
            <div>
                {onDelete && (
                <Button variant="ghost" onClick={() => { onDelete(formData); onClose(); }} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">Delete Case</Button>
                )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const TestCataloguePage = ({ setActiveRoute, testCases = [], setTestCases }: { setActiveRoute: (route: string) => void, testCases?: any[], setTestCases?: (tests: any[]) => void }) => {
  const [expandedTc, setExpandedTc] = useState<string | null>(null);
  const [editingTc, setEditingTc] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'pending' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'current' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' }
  ];

  const normalizePriority = (p: string): string => {
    if (!p) return 'P2';
    const lower = p.toLowerCase();
    if (lower === 'critical' || lower === 'p0') return 'P0';
    if (lower === 'high' || lower === 'p1') return 'P1';
    return 'P2';
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'P0': return 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20';
      case 'P1': return 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20';
      case 'P2': return 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
    }
  };

  const filteredCases = testCases.filter(tc => {
    const p = normalizePriority(tc.priority);
    if (filterPriority !== 'all' && p !== filterPriority) return false;
    if (filterType !== 'all' && (tc.type || 'Functional') !== filterType) return false;
    return true;
  });

  const allFilteredIds = filteredCases.map((tc, i) => tc.tcId || `TC-${testCases.indexOf(tc)+1}`);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveTestCase = (updatedTc: any) => {
    if (!setTestCases) return;
    const exists = testCases.find(tc => tc.tcId === updatedTc.tcId);
    if (exists) {
      const newCases = testCases.map(tc => tc.tcId === updatedTc.tcId ? updatedTc : tc);
      setTestCases(newCases);
    } else {
      setTestCases([...testCases, updatedTc]);
    }
  };

  const handleDeleteTestCase = (tcToDelete: any) => {
    if (!setTestCases) return;
    const newCases = testCases.filter(tc => tc.tcId !== tcToDelete.tcId);
    setTestCases(newCases);
  };

  const handleAddManualCase = () => {
    const newTc = {
      tcId: `TC-${testCases.length + 1}`,
      title: '',
      priority: 'P2',
      type: 'Functional',
      precondition: '',
      postcondition: '',
      steps: [{ action: '', expectedResult: '' }],
    };
    setEditingTc(newTc);
    setIsAddingNew(true);
  };

  const uniqueTypes = Array.from(new Set(testCases.map(tc => tc.type || 'Functional')));

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-6 flex-1 min-h-0">
        
        {/* Header & Pipeline Workflow */}
        <div className="shrink-0">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Test Catalogue Review</h2>
          
          <div className="flex items-center w-full relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-100 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
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
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                  <Library size={16} className="text-blue-500" />
               </div>
               <span className="text-sm text-zinc-600 dark:text-zinc-400">Generated <strong className="text-zinc-800 dark:text-zinc-200">{testCases.length}</strong> test cases. {selectedIds.size > 0 && <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedIds.size} selected</span>}</span>
            </div>
            <div className="flex gap-2 relative">
                <div className="relative">
                  <Button variant="secondary" icon={Filter} className="text-xs" onClick={() => setFilterOpen(!filterOpen)}>Filter</Button>
                  {filterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-4 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Priority</label>
                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500">
                          <option value="all">All</option>
                          <option value="P0">P0 (Critical)</option>
                          <option value="P1">P1 (High)</option>
                          <option value="P2">P2 (Medium)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Type</label>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500">
                          <option value="all">All</option>
                          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { setFilterPriority('all'); setFilterType('all'); setFilterOpen(false); }} className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1">Clear Filters</button>
                    </div>
                  )}
                </div>
                <Button variant="secondary" icon={Plus} className="text-xs" onClick={handleAddManualCase}>Add Manual Case</Button>
            </div>
        </div>

        {/* Test Catalogue Content - fitted with internal scroll */}
        <div className="flex-1 min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-950/50 shadow-sm flex flex-col">
          <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600" />
                </th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium w-[40%]">Test Case</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Priority</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Type</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">Source</th>
                <th className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-zinc-600 dark:text-zinc-400">
              {filteredCases.map((tc, index) => {
                const tcKey = tc.tcId || `TC-${testCases.indexOf(tc)+1}`;
                const isExpanded = expandedTc === tcKey;
                const isChecked = selectedIds.has(tcKey);
                const prio = normalizePriority(tc.priority);
                
                return (
                <React.Fragment key={tcKey}>
                  <tr 
                    onClick={() => setExpandedTc(isExpanded ? null : tcKey)}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 spring-transition cursor-pointer group ${isChecked ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(tcKey)} className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{tcKey}</span>
                          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{tc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${priorityColor(prio)}`}>
                        {prio}
                      </span>
                    </td>
                    <td className="px-4 py-3">{tc.type || 'Functional'}</td>
                    <td className="px-4 py-3">
                      <Bot size={16} className="text-blue-500" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTc(tc); setIsAddingNew(false); }}
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800">
                        <td colSpan={6} className="px-6 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pre-condition</h4>
                                    <p className="text-zinc-700 dark:text-zinc-300 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg leading-relaxed">
                                        {tc.precondition || 'No pre-condition specified'}
                                    </p>
                                    
                                    <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-6">Post-condition</h4>
                                    <p className="text-zinc-700 dark:text-zinc-300 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg leading-relaxed">
                                        {tc.postcondition || 'No post-condition specified'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Test Steps</h4>
                                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-xs">
                                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400 w-8">#</th>
                                                    <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">Action</th>
                                                    <th className="px-3 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">Expected Result</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                                {tc.steps?.map((step: any, sIdx: number) => (
                                                    <tr key={sIdx}>
                                                        <td className="px-3 py-2.5 text-zinc-400 font-mono text-[10px]">{sIdx + 1}</td>
                                                        <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 leading-relaxed">{step.action}</td>
                                                        <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 leading-relaxed">{step.expectedResult}</td>
                                                    </tr>
                                                ))}
                                                {(!tc.steps || tc.steps.length === 0) && (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 italic">No steps defined</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <Library size={32} className="mb-3 opacity-20" />
                      <p>{testCases.length === 0 ? 'No test cases generated.' : 'No test cases match the current filter.'}</p>
                      <p className="text-xs mt-1 opacity-70">{testCases.length === 0 ? 'Please go back and analyze a PRD first.' : 'Try adjusting your filter criteria.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800/80 shrink-0">
            <Button 
                variant="secondary" 
                icon={ArrowLeft} 
                onClick={() => setActiveRoute('coverage-audit')}
                className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
                Back
            </Button>
            <Button 
                variant="primary" 
                icon={Link2} 
                onClick={() => setActiveRoute('qase-integration')}
                className="px-6 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
                Continue to Sync {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Button>
        </div>
      </div>
      
      {editingTc && (
        <EditTestCaseModal
          tc={editingTc}
          onClose={() => { setEditingTc(null); setIsAddingNew(false); }}
          onSave={(updated: any) => { handleSaveTestCase(updated); setEditingTc(null); setIsAddingNew(false); }}
          onDelete={isAddingNew ? undefined : handleDeleteTestCase}
        />
      )}
    </div>
  );
};

const QaseIntegrationPage = ({ setActiveRoute, testCases = [] }: { setActiveRoute: (route: string) => void, testCases?: any[] }) => {
  const qaseState = useQaseState()
  const token = qaseState.token || ''
  const setToken = (newToken: string) => updateQaseState({ token: newToken })
  
  const isGloballyConnected = qaseState.status === 'connected';
  
  const [testing, setTesting] = useState(false)
  const [tokenValid, setTokenValid] = useState(isGloballyConnected || !!token.trim())
  const [projects, setProjects] = useState<QaseProject[]>(qaseState.projects || [])
  const [selectedProject, setSelectedProject] = useState(qaseState.selectedProjectCode || '')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectCode, setNewProjectCode] = useState('')
  const [creatingProjectLoader, setCreatingProjectLoader] = useState(false)
  const [suites, setSuites] = useState<QaseSuite[]>(isGloballyConnected ? qaseState.suites : [])
  const [selectedSuite, setSelectedSuite] = useState('')
  const [loadingSuites, setLoadingSuites] = useState(false)
  const [isCreatingSuite, setIsCreatingSuite] = useState(false)
  const [newSuiteTitle, setNewSuiteTitle] = useState('')
  const [creatingSuiteLoader, setCreatingSuiteLoader] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const steps = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'completed' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'completed' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'completed' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'current' }
  ];

  const showToast = (msg: string, type: 'error' | 'success') => {
    if (type === 'error') setErrorToast(msg)
    else setSuccessToast(msg)
    setTimeout(() => { setErrorToast(null); setSuccessToast(null) }, 3000)
  }

  useEffect(() => {
    if (tokenValid && projects.length === 0) {
      // If we have a token but projects aren't loaded locally yet, fetch them
      const api = new QaseAPI(token);
      api.getProjects().then(p => {
        setProjects(p);
        if (p.length > 0 && !selectedProject) {
          setSelectedProject(qaseState.selectedProjectCode || p[0].code);
        }
      }).catch((err) => {
        console.error(err);
        showToast('Failed to load projects. Token might be invalid.', 'error');
        setTokenValid(false);
      });
    }
  }, [])

  useEffect(() => {
    if (selectedProject && tokenValid) {
      setLoadingSuites(true)
      const api = new QaseAPI(token)
      api.getSuites(selectedProject)
        .then(setSuites)
        .catch((err) => {
          console.error(err)
          showToast('Failed to fetch suites', 'error')
        })
        .finally(() => setLoadingSuites(false))
    } else {
      setSuites([])
      setSelectedSuite('')
    }
  }, [selectedProject, tokenValid, token])

  const handleTestConnection = async () => {
    if (!token.trim()) {
      showToast('Please enter a token', 'error')
      return
    }
    setTesting(true)
    try {
      const api = new QaseAPI(token)
      const isValid = await api.testConnection()
      if (isValid) {
        const projectList = await api.getProjects()
        setProjects(projectList)
        setTokenValid(true)
        showToast('Connection successful!', 'success')
      } else {
        showToast('Connection failed', 'error')
        setTokenValid(false)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Connection failed', 'error')
      setTokenValid(false)
    } finally {
      setTesting(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !newProjectCode.trim()) {
      showToast('Please enter project name and code', 'error')
      return
    }
    setCreatingProjectLoader(true)
    try {
      const api = new QaseAPI(token)
      const newProject = await api.createProject(newProjectTitle, newProjectCode)
      setProjects((prev) => [...prev, newProject])
      setSelectedProject(newProject.code)
      setIsCreatingProject(false)
      setNewProjectTitle('')
      setNewProjectCode('')
      showToast('Project created successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create project', 'error')
    } finally {
      setCreatingProjectLoader(false)
    }
  }

  const handleCreateSuite = async () => {
    if (!newSuiteTitle.trim()) {
      showToast('Please enter a suite name', 'error')
      return
    }
    setCreatingSuiteLoader(true)
    try {
      const api = new QaseAPI(token)
      const newSuite = await api.createSuite(selectedProject, newSuiteTitle)
      setSuites((prev) => [...prev, newSuite])
      setSelectedSuite(newSuite.id.toString())
      setIsCreatingSuite(false)
      setNewSuiteTitle('')
      showToast('Suite created successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create suite', 'error')
    } finally {
      setCreatingSuiteLoader(false)
    }
  }

  const casesToPush = testCases.map((tc) => ({
    title: tc.title,
    description: tc.type,
    preconditions: tc.precondition,
    postconditions: tc.postcondition,
    priority: tc.priority === 'P0' || tc.priority === 'Critical' ? 1 : tc.priority === 'High' || tc.priority === 'P1' ? 2 : 3,
    type: 2, 
    behavior: tc.behavior === 'Positive' ? 2 : 3, 
    suite_id: selectedSuite ? parseInt(selectedSuite) : undefined,
    custom_field: { "6": "2", "7": "4" },
    tags: tc.tags || [],
    steps: tc.steps?.map((step: any) => ({
      action: step.action,
      expected_result: step.expectedResult,
      data: step.data || '',
    })) || [],
  }))

  const handlePushToQase = async () => {
    if (!testCases || testCases.length === 0) {
      showToast('No test cases to push. Please input PRD in PRD Intake first.', 'error')
      return
    }

    let finalProjectCode = selectedProject
    let finalSuiteId = selectedSuite

    if (isCreatingProject && newProjectTitle.trim() && newProjectCode.trim()) {
      setPushing(true)
      try {
        const api = new QaseAPI(token)
        const newProject = await api.createProject(newProjectTitle, newProjectCode)
        setProjects((prev) => [...prev, newProject])
        finalProjectCode = newProject.code
        setSelectedProject(newProject.code)
        setIsCreatingProject(false)
        setNewProjectTitle('')
        setNewProjectCode('')
      } catch (error) {
        showToast('Failed to create project before pushing', 'error')
        setPushing(false)
        return
      }
    }

    if (!token.trim() || !finalProjectCode.trim()) {
      showToast('Please select a project', 'error')
      setPushing(false)
      return
    }

    if (isCreatingSuite && newSuiteTitle.trim()) {
      setPushing(true)
      try {
        const api = new QaseAPI(token)
        const newSuite = await api.createSuite(finalProjectCode, newSuiteTitle)
        setSuites((prev) => [...prev, newSuite])
        finalSuiteId = newSuite.id.toString()
        setSelectedSuite(newSuite.id.toString())
        setIsCreatingSuite(false)
        setNewSuiteTitle('')
      } catch (error) {
        showToast('Failed to create suite before pushing', 'error')
        setPushing(false)
        return
      }
    }

    setPushing(true)
    try {
      const api = new QaseAPI(token)
      const finalCasesToPush = testCases.map((tc) => ({
        title: tc.title.length > 255 ? tc.title.substring(0, 252) + '...' : tc.title,
        description: tc.type,
        preconditions: tc.precondition,
        postconditions: tc.postcondition,
        priority: tc.priority === 'P0' || tc.priority === 'Critical' ? 1 : tc.priority === 'High' || tc.priority === 'P1' ? 2 : 3,
        type: 2,
        behavior: tc.behavior === 'Positive' ? 2 : 3,
        suite_id: finalSuiteId ? parseInt(finalSuiteId) : undefined,
        custom_field: { "6": "2", "7": "4" },
        tags: tc.tags || [],
        steps: tc.steps?.map((step: any) => ({
          action: step.action,
          expected_result: step.expectedResult,
          data: step.data || '',
        })) || [],
      }))

      await api.bulkCreateTestCases(finalProjectCode, finalCasesToPush)
      showToast(`Successfully pushed ${testCases.length} test cases to Qase!`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to push to Qase', 'error')
    } finally {
      setPushing(false)
    }
  }

  const handleCopy = () => {
    const json = JSON.stringify(casesToPush, null, 2)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const json = JSON.stringify(casesToPush, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-cases-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 flex flex-col overflow-hidden relative">
      {(errorToast || successToast) && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-sm z-[200] text-white ${errorToast ? 'bg-red-500' : 'bg-emerald-500'}`}>
            {errorToast || successToast}
        </div>
      )}
      <div className="max-w-[1200px] mx-auto w-full p-8 flex flex-col gap-6 flex-1 min-h-0 pb-10">
        
        {/* Header & Pipeline Workflow */}
        <div className="shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-500">Qase Integration</h2>
              <p className="text-sm text-zinc-900 dark:text-zinc-100 mt-1">Push {testCases.length} test cases to Qase or download as JSON</p>
            </div>
            <Button 
                variant="secondary" 
                icon={ArrowLeft} 
                onClick={() => setActiveRoute('test-catalogue')}
                className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 border border-zinc-200 dark:border-zinc-800"
            >
                Back
            </Button>
          </div>
          
          <div className="flex items-center w-full relative mb-8 max-w-5xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-800 z-0"></div>
            <div className="w-full flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-zinc-950 px-2">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${step.status === 'current' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
            {/* Left Column: Qase Connection & Settings */}
            <div className={`rounded-xl border ${tokenValid ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'} p-6 relative flex flex-col gap-6 self-start`}>
                {!tokenValid ? (
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <Network size={18} /> Qase Authentication
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qase API Token</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter your Qase API token"
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <p className="text-xs text-zinc-500">Get your token from Qase Settings &rarr; API Tokens</p>
                        </div>
                        <Button 
                            variant="primary" 
                            onClick={handleTestConnection} 
                            disabled={testing}
                            className="w-full mt-4 justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        >
                            {testing ? <><Loader size={16} className="animate-spin mr-2" /> Testing Connection...</> : 'Test Connection'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-medium">
                                <Check size={18} /> Connected to Qase
                            </div>
                            <Button 
                                variant="primary" 
                                onClick={handlePushToQase}
                                disabled={pushing || (!selectedProject && !isCreatingProject)}
                                className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm px-6 py-2"
                            >
                                {pushing ? <><Loader size={16} className="animate-spin mr-2" /> Pushing...</> : 'Push to Qase'}
                            </Button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Select Project</label>
                                {isCreatingProject ? (
                                    <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-md p-1 border border-zinc-200 dark:border-zinc-700">
                                        <input 
                                            type="text" 
                                            value={newProjectTitle} 
                                            onChange={(e) => setNewProjectTitle(e.target.value)} 
                                            placeholder="Name" 
                                            className="w-full text-sm outline-none px-2 py-1 bg-transparent dark:text-zinc-100" 
                                        />
                                        <input 
                                            type="text" 
                                            value={newProjectCode} 
                                            onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())} 
                                            placeholder="CODE" 
                                            className="w-16 text-sm outline-none px-2 py-1 border-l border-zinc-200 dark:border-zinc-700 bg-transparent uppercase dark:text-zinc-100" 
                                        />
                                        <button onClick={handleCreateProject} disabled={creatingProjectLoader} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded">
                                            {creatingProjectLoader ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                        </button>
                                        <button onClick={() => setIsCreatingProject(false)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select 
                                            value={selectedProject} 
                                            onChange={(e) => setSelectedProject(e.target.value)}
                                            className="flex-1 min-w-0 truncate px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Choose a project...</option>
                                            {projects.map((p) => (
                                                <option key={p.code} value={p.code}>{p.title} ({p.code})</option>
                                            ))}
                                        </select>
                                        <Button variant="secondary" onClick={() => setIsCreatingProject(true)} className="px-3 bg-white dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                            <Plus size={14} className="mr-1 font-bold" /> New Project
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2">
                                    Select Suite {loadingSuites && <Loader size={12} className="animate-spin text-zinc-400" />}
                                </label>
                                {isCreatingSuite ? (
                                    <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-md p-1 border border-zinc-200 dark:border-zinc-700">
                                        <input 
                                            type="text" 
                                            value={newSuiteTitle} 
                                            onChange={(e) => setNewSuiteTitle(e.target.value)} 
                                            placeholder="Enter new suite name" 
                                            className="w-full text-sm outline-none px-2 py-1 bg-transparent dark:text-zinc-100" 
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSuite()}
                                        />
                                        <button onClick={handleCreateSuite} disabled={creatingSuiteLoader} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded">
                                            {creatingSuiteLoader ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                        </button>
                                        <button onClick={() => setIsCreatingSuite(false)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select 
                                            value={selectedSuite} 
                                            onChange={(e) => setSelectedSuite(e.target.value)}
                                            className="flex-1 min-w-0 truncate px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            disabled={!selectedProject}
                                        >
                                            <option value="">Root (No Suite)</option>
                                            {suites.map((s) => (
                                                <option key={s.id} value={s.id}>{s.parent_id ? '  └ ' : ''}{s.title} ({s.cases_count || 0})</option>
                                            ))}
                                        </select>
                                        <Button variant="secondary" onClick={() => setIsCreatingSuite(true)} disabled={!selectedProject} className="px-3 bg-white dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                            <Plus size={14} className="mr-1 font-bold" /> New Suite
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: JSON Preview */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 flex flex-col overflow-hidden min-h-0">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-semibold text-sm">
                        <AlertCircle size={16} /> Export Data
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">{testCases.length} test cases prepared</span>
                </div>
                
                <div className="flex-1 overflow-hidden relative flex flex-col p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <pre className="text-[12px] font-mono text-zinc-800 dark:text-zinc-200 w-full flex-1 overflow-auto whitespace-pre m-0 p-0 rounded-md">
                        {JSON.stringify(casesToPush, null, 2)}
                    </pre>
                </div>
                
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 bg-zinc-50 dark:bg-zinc-900/30 shrink-0">
                    <Button variant="secondary" onClick={handleCopy} className="flex-1 bg-white dark:bg-zinc-900 hover:bg-zinc-50 border border-zinc-200 dark:border-zinc-700 font-semibold flex items-center justify-center">
                        <Copy size={16} className="mr-2" /> {copied ? 'Copied!' : 'Copy JSON'}
                    </Button>
                    <Button variant="secondary" onClick={handleDownload} className="flex-1 bg-white dark:bg-zinc-900 hover:bg-zinc-50 border border-zinc-200 dark:border-zinc-700 font-semibold flex items-center justify-center">
                        <Download size={16} className="mr-2" /> Download
                    </Button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

const ChatMessage = ({ msg, idx, onEdit, onDelete }: { msg: any, idx: number, onEdit: (msg: string) => void, onDelete: (idx: number) => void }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCopyMarkdown = () => {
    let md = msg.content;
    if (msg.thinking) {
      md = `> Thinking:\n> ${msg.thinking.replace(/\n/g, '\n> ')}\n\n${md}`;
    }
    navigator.clipboard.writeText(md);
    setShowMenu(false);
  };

  return (
    <div className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-2`}>
      <div className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'}`}>
        {msg.thinking && (
          <div className="mb-2 p-2 rounded bg-black/10 dark:bg-black/20 text-xs font-mono text-zinc-700 dark:text-zinc-400 whitespace-pre-wrap italic">
            <div className="font-semibold mb-1 flex items-center gap-1"><Cpu size={10} /> Thinking</div>
            {msg.thinking}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
      </div>
      
      {/* Action Bar (visible on hover) */}
      <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
        <button onClick={() => onEdit(msg.content)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded" title="Edit">
          <Edit3 size={14} />
        </button>
        <button onClick={handleCopy} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded" title="Copy">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} onBlur={() => setTimeout(() => setShowMenu(false), 200)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded" title="More">
            <MoreHorizontal size={14} />
          </button>
          
          {showMenu && (
            <div className={`absolute top-full mt-1 ${msg.role === 'user' ? 'right-0' : 'left-0'} w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-20 py-1`}>
              <button onMouseDown={(e) => { e.preventDefault(); handleCopyMarkdown(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Copy Markdown
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); onDelete(idx); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AIPlaygroundPage = () => {
  const llmState = useLLMState();
  const [prompt, setPrompt] = useState("");
  const [attachment, setAttachment] = useState<{ name: string, content: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!prompt.trim() && !attachment) return;
    const msg = prompt + (attachment ? `\n\n[Attached File: ${attachment.name}]\n${attachment.content}` : "");
    setPrompt("");
    setAttachment(null);
    await testLLMChat(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const text = await PDFParser.extractText(file);
        setAttachment({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      showToast("Failed to read file.", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const text = await PDFParser.extractText(file);
        setAttachment({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachment({ name: file.name, content: text });
      }
    } catch (err) {
      showToast("Failed to read file.", "error");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANE: Chat Interface (61.8%) */}
      <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800" style={{ flex: '1 1 61.8%', minWidth: 0 }}>
        
        {/* Chat Header */}
        <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Chat Session</span>
            </div>
            <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800"></div>
            <Badge variant="brand" className="font-mono bg-blue-500/5 text-blue-300 border-blue-200 dark:border-blue-500/20">
              {llmState.model || "No model selected"}
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

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col relative bg-white/50 dark:bg-zinc-950/50">
          {llmState.chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950/0 to-zinc-950/0 pointer-events-none opacity-50"></div>
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 relative z-10 shadow-lg">
                <MessageSquare size={24} className="text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1 relative z-10">No messages yet</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 relative z-10">Send a prompt to test the model.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10 pb-4">
              {llmState.chatHistory.map((msg, idx) => (
                <ChatMessage 
                  key={idx} 
                  msg={msg} 
                  idx={idx} 
                  onEdit={(content) => setPrompt(content)} 
                  onDelete={(i) => updateLLMState((prev) => {
                    const newHistory = [...prev.chatHistory];
                    newHistory.splice(i, 1);
                    return { chatHistory: newHistory };
                  })} 
                />
              ))}
              {llmState.isGenerating && (
                <div className="flex items-start">
                   <div className="max-w-[85%] rounded-xl p-3 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                     <Loader size={14} className="animate-spin text-zinc-500" /> Generating...
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          {attachment && (
            <div className="mb-2 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-2 rounded border border-blue-100 dark:border-blue-800/30 text-xs">
               <FileText size={14} />
               <span className="truncate max-w-[200px] font-medium">{attachment.name}</span>
               <button onClick={() => setAttachment(null)} className="ml-auto hover:text-blue-900 dark:hover:text-blue-100"><X size={14} /></button>
            </div>
          )}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-950 spring-transition shadow-sm">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="*/*" />
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent p-3.5 pr-20 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none min-h-[80px]"
              placeholder="Enter your prompt here... (Shift+Enter for newline)"
            ></textarea>
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1.5 rounded-lg spring-transition">
                <Paperclip size={16} />
              </button>
              {llmState.isGenerating ? (
                <button onClick={abortLLMChat} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg spring-transition shadow-md">
                  <Square size={14} className="fill-current" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!prompt.trim() && !attachment} className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2 rounded-lg spring-transition shadow-md">
                <Send size={14} className="ml-0.5" />
              </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono flex items-center gap-1">
              <Terminal size={10} /> {llmState.status === 'connected' ? 'Engine Ready' : 'Not Connected'}
            </span>
            {llmState.isGenerating && (
              <button onClick={abortLLMChat} className="text-[10px] text-red-500 hover:text-red-600 font-medium">Stop Generation</button>
            )}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-zinc-50 dark:bg-zinc-900/10">
          
          {/* Section: Model */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <Server size={14} className="text-zinc-500" />
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Model</h4>
            </div>
            
            <div className="space-y-2">
              {llmState.models.length > 0 ? (
                <select 
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-blue-500 spring-transition appearance-none focus:outline-none focus:border-blue-500"
                  value={llmState.model}
                  onChange={(e) => updateLLMState({ model: e.target.value })}
                >
                  {llmState.models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="e.g. llama3, gpt-4" 
                  value={llmState.model}
                  onChange={(e) => updateLLMState({ model: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-blue-500 spring-transition focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-zinc-600 dark:text-zinc-400">Thinking</label>
              <select 
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 hover:border-blue-500 spring-transition appearance-none focus:outline-none focus:border-blue-500"
                value={llmState.thinking}
                onChange={(e) => updateLLMState({ thinking: e.target.value })}
              >
                <option value="auto">Auto</option>
                <option value="on_unlimited">On (Unlimited)</option>
                <option value="on_limit">On (Limit)</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>

          {/* Section: Chat */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <MessageSquare size={14} className="text-zinc-500" />
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Chat</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Temperature</span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{(llmState.temperature ?? 0.7).toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.01" value={llmState.temperature ?? 0.7} onChange={(e) => updateLLMState({ temperature: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Max Tokens */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Max Tokens</span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{llmState.maxTokens ?? 2048}</span>
                </div>
                <input type="range" min="1" max="8192" step="1" value={llmState.maxTokens ?? 2048} onChange={(e) => updateLLMState({ maxTokens: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Top P */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Top P</span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{(llmState.topP ?? 0.9).toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={llmState.topP ?? 0.9} onChange={(e) => updateLLMState({ topP: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Top K */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Top K</span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{llmState.topK ?? 40}</span>
                </div>
                <input type="range" min="1" max="100" step="1" value={llmState.topK ?? 40} onChange={(e) => updateLLMState({ topK: parseInt(e.target.value) })} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Min P */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Min P</span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{(llmState.minP ?? 0.05).toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={llmState.minP ?? 0.05} onChange={(e) => updateLLMState({ minP: parseFloat(e.target.value) })} className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50"></div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} className="text-blue-600 dark:text-blue-400" /> Performance
              </label>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400 ">
                <div className={`w-1.5 h-1.5 rounded-full ${llmState.isGenerating ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700 dark:bg-zinc-500'}`}></div> 
                {llmState.isGenerating ? 'Generating...' : 'Idle'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2">Prefill (t/s)</div>
                <div className="flex justify-between items-end">
                  <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 leading-none">{llmState.telemetry.prefillTs}</div>
                  {llmState.telemetry.prefillTokens !== undefined && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">{llmState.telemetry.prefillTokens} tok</div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2">Token Gen (t/s)</div>
                <div className="flex justify-between items-end">
                  <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 leading-none">{llmState.telemetry.tokenGenTs}</div>
                  {llmState.telemetry.genTokens !== undefined && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">{llmState.telemetry.genTokens} tok</div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2">Thinking (s)</div>
                <div className="flex justify-between items-end">
                  <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 leading-none">{llmState.telemetry.thinkingS}</div>
                  {llmState.telemetry.thinkingTokens !== undefined && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">{llmState.telemetry.thinkingTokens} tok</div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2">Duration (s)</div>
                <div className="flex justify-between items-end">
                  <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 leading-none">{llmState.telemetry.durationS}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {

  const llmState = useLLMState();
  const qaseState = useQaseState();
  const qaGuidelinesState = useQAGuidelinesState();

  const handleLLMChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateLLMState({ [e.target.name]: e.target.value });
  };

  const handleQaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQaseState({ [e.target.name]: e.target.value });
  };

  const handleTestLLM = async () => {
    if (!llmState.baseUrl) {
      showToast("Please provide a Base URL first.", "error");
      return;
    }
    updateLLMState({ status: 'testing', error: undefined });
    try {
      const res = await fetch('/api/llm/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: llmState.baseUrl, apiToken: llmState.apiToken }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      updateLLMState({ status: 'connected' });
      showToast("LLM Connection Successful!", "success");
    } catch (err: any) {
      updateLLMState({ status: 'error', error: err.message || 'Connection failed' });
      showToast(`LLM Connection Failed: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const handleExploreCapabilities = async () => {
    if (!qaseState.token) {
      showToast("Please provide a Qase API Token first.", "error");
      return;
    }
    updateQaseState({ status: 'syncing' });
    try {
      const api = new QaseAPI(qaseState.token);
      let pCode = qaseState.selectedProjectCode;
      
      if (!pCode) {
        showToast("No project selected, fetching one to test capabilities...", "info");
        const projects = await api.getProjects();
        if (projects.length > 0) {
          pCode = projects[0].code;
          updateQaseState({ projects, selectedProjectCode: pCode });
        } else {
          showToast("No projects available to test capability matrix.", "error");
          updateQaseState({ status: 'error' });
          return;
        }
      }
      
      const capabilities = await api.checkCapabilities(pCode);
      updateQaseState({
        status: 'connected',
        capabilities,
        lastSyncAt: new Date().toISOString()
      });
      showToast("Capability Matrix tested successfully!", "success");
    } catch (err: any) {
      updateQaseState({
        status: 'error',
        error: err.message || "Failed to check capabilities"
      });
      showToast("Failed to explore capabilities.", "error");
    }
  };

  const handleTestQase = async () => {
    if (!qaseState.token) {
      showToast("Please provide an API Token", "error");
      return;
    }
    updateQaseState({ status: 'testing' });
    try {
      const api = new QaseAPI(qaseState.token);
      const success = await api.testConnection();
      updateQaseState({ status: success ? 'connected' : 'error' });
      if (success) {
        showToast("Qase Connection Successful!", "success");
      } else {
        showToast("Qase Connection Failed", "error");
      }
    } catch(err) {
      updateQaseState({ status: 'error' });
      showToast("Qase Connection Error", "error");
    }
  };

  const updateCapability = (resource: string, updates: Partial<QaseCapability>) => {
    updateQaseState((curr) => {
      const caps = [...curr.capabilities];
      const idx = caps.findIndex(c => c.resource === resource);
      if (idx > -1) {
        caps[idx] = { ...caps[idx], ...updates, checkedAt: new Date().toISOString() };
      }
      return { capabilities: caps };
    });
  };

  const handleFetchProjects = async () => {
    if (!qaseState.token) return;
    updateQaseState({ status: 'syncing' });
    try {
      const api = new QaseAPI(qaseState.token);
      const projects = await api.getProjects();
      updateQaseState({ projects, status: 'idle' });
      updateCapability('Projects', { status: 'ok', count: projects.length });
    } catch(err) {
      updateQaseState({ status: 'error' });
      updateCapability('Projects', { status: 'failed' });
    }
  };

  const handleFetchSuites = async () => {
    if (!qaseState.token || !qaseState.selectedProjectCode) {
      showToast("Select a project first", "error");
      return;
    }
    updateQaseState({ status: 'syncing' });
    try {
      const api = new QaseAPI(qaseState.token);
      const suites = await api.getSuites(qaseState.selectedProjectCode);
      updateQaseState({ suites: suites as any, status: 'idle' });
      updateCapability('Suites', { status: 'ok', count: suites.length });
    } catch(err) {
      updateQaseState({ status: 'error' });
      updateCapability('Suites', { status: 'failed' });
    }
  };

  const handleFetchCases = async () => {
     showToast("Fetching test cases is not fully implemented in QaseAPI yet.", "info");
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQaseState({ selectedProjectCode: e.target.value });
  };

  return (
    <div className="h-full w-full bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-8 flex flex-col gap-6 pb-20">
        
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Settings</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage integrations, API keys, and generation policies.</p>
        </div>

        {/* Row 1: LLM Configuration (left) + QASE Connection (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LLM Configuration */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Cpu size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-zinc-800 dark:text-zinc-200">LLM Configuration</h3>
              </div>
              <Badge variant={llmState.status === 'connected' ? 'success' : llmState.status === 'error' ? 'danger' : 'warning'} className="uppercase font-mono text-[10px]">
                {llmState.status === 'connected' ? 'Connected' : llmState.status === 'error' ? 'Error' : 'Not Connected'}
              </Badge>
            </div>
            <div className="p-6 space-y-5 bg-transparent dark:bg-zinc-900/20 flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Base URL (OpenAI-compatible)</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    <input type="text" name="baseUrl" value={llmState.baseUrl} onChange={handleLLMChange} placeholder="https://api.openai.com/v1" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Token <span className="font-normal">(Optional)</span></label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    <input type="password" name="apiToken" value={llmState.apiToken} onChange={handleLLMChange} placeholder="sk-..." className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Model</label>
                  <div className="relative">
                    <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    {llmState.models.length > 0 ? (
                      <select name="model" value={llmState.model} onChange={handleLLMChange} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition appearance-none">
                        {llmState.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input type="text" name="model" value={llmState.model} onChange={handleLLMChange} placeholder="e.g. llama3, gpt-4" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button variant="secondary" icon={RefreshCcw} onClick={fetchLLMModels} disabled={llmState.status === 'testing'} className="text-xs py-1.5">{llmState.status === 'testing' ? 'Fetching...' : 'Fetch Models'}</Button>
                <Button variant="primary" icon={Link2} onClick={handleTestLLM} disabled={llmState.status === 'testing'} className="text-xs py-1.5 border-transparent">Test Connection</Button>
              </div>
            </div>
          </div>

          {/* QASE Connection */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <Database size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-zinc-800 dark:text-zinc-200">QASE Connection</h3>
              </div>
              <Badge variant={qaseState.status === 'connected' ? 'success' : qaseState.status === 'error' ? 'danger' : qaseState.status === 'syncing' ? 'warning' : 'neutral'} className="uppercase font-mono text-[10px]">
                {qaseState.status === 'connected' ? 'Connected' : qaseState.status === 'error' ? 'Error' : qaseState.status === 'syncing' ? 'Syncing...' : 'Not Connected'}
              </Badge>
            </div>
            <div className="p-6 space-y-5 bg-transparent dark:bg-zinc-900/20 flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Qase API Token</label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    <input type="password" name="token" value={qaseState.token} onChange={handleQaseChange} placeholder="Enter Qase API token" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Project Code</label>
                  <div className="relative">
                    <Database size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400" />
                    {qaseState.projects.length > 0 ? (
                      <select name="selectedProjectCode" value={qaseState.selectedProjectCode} onChange={handleProjectSelect} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition appearance-none">
                        <option value="">Select Project</option>
                        {qaseState.projects.map(p => <option key={p.code} value={p.code}>{p.title} ({p.code})</option>)}
                      </select>
                    ) : (
                      <input type="text" name="selectedProjectCode" value={qaseState.selectedProjectCode} onChange={handleQaseChange} placeholder="e.g. PRJ1" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 spring-transition" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button variant="secondary" icon={RefreshCcw} onClick={handleFetchProjects} disabled={qaseState.status === 'syncing' || !qaseState.token} className="text-xs py-1.5">{qaseState.status === 'syncing' ? 'Fetching...' : 'Fetch Projects'}</Button>
                <Button variant="primary" icon={Link2} onClick={handleTestQase} disabled={qaseState.status === 'testing'} className="text-xs py-1.5 border-transparent">Test Connection</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: QA Guidelines (left) + Qase Capability Matrix (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QA Guidelines (Knowledge Base) */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                  <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-800 dark:text-zinc-200">QA Guidelines (Knowledge Base)</h3>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">Standards injected as RAG Context during AI generation.</p>
                </div>
              </div>
              <Badge variant="brand" className="uppercase font-mono text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">RAG Context</Badge>
            </div>
            <div className="p-6 bg-transparent dark:bg-zinc-900/20 flex-1">
              <textarea 
                className="w-full h-full min-h-[200px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 resize-y spring-transition font-mono leading-relaxed"
                placeholder="Enter company QA standards, BDD formatting rules, negative testing requirements, etc..."
                value={qaGuidelinesState.guidelinesText}
                onChange={(e) => updateQAGuidelinesState({ guidelinesText: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Qase Capability Matrix */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 flex items-center justify-between">
              <h3 className="font-medium text-sm text-zinc-800 dark:text-zinc-200">Qase Capability Matrix</h3>
              <Button variant="primary" icon={Activity} className="text-xs py-1.5 border-transparent" disabled={qaseState.status === 'testing' || qaseState.status === 'syncing'} onClick={handleExploreCapabilities}>Explore & Test All</Button>
            </div>
            <div className="w-full overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Resource</th>
                    <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Endpoint</th>
                    <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider text-center">Count</th>
                    <th className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {qaseState.capabilities.map((c, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 spring-transition">
                      <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {c.resource}
                        {c.optional && <span className="ml-1 text-[10px] text-zinc-500 font-normal bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">(optional)</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{c.endpoint}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={c.status === 'ok' ? 'success' : c.status === 'unchecked' ? 'neutral' : 'danger'} className="text-[10px] uppercase font-mono">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-800 dark:text-zinc-200">{c.count ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {c.checkedAt ? new Date(c.checkedAt).toLocaleString() : c.error ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    className="w-full bg-blue-500/20 hover:bg-blue-500/40 border-t-2 border-blue-500 rounded-t-sm transition-all duration-300 relative"
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
               <div className={`mt-0.5 w-2 h-2 rounded-full ${event.type === 'ai' ? 'bg-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : event.type === 'system' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
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
const TelemetryFooter = () => {
  const llmState = useLLMState();
  const qaseState = useQaseState();
  
  const [llmStatus, setLlmStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [qaseStatus, setQaseStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [qaseLatency, setQaseLatency] = useState<number | null>(null);
  const [llmLatency, setLlmLatency] = useState<number | null>(null);
  const [qaseError, setQaseError] = useState<string>('');
  const [llmError, setLlmError] = useState<string>('');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const checkConnections = async () => {
      const nowStr = new Intl.DateTimeFormat('id-ID', { 
        timeZone: 'Asia/Jakarta', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }).format(new Date());
      if (mounted) setLastCheck(nowStr);

      // Check Qase Heartbeat
      if (qaseState.token) {
        if (mounted && qaseStatus !== 'checking') setQaseStatus('checking');
        try {
          const start = performance.now();
          const res = await fetch('/api/qase/project?limit=1', {
            headers: { 'Token': qaseState.token }
          });
          if (mounted) {
            setQaseStatus(res.ok ? 'ok' : 'error');
            if (res.ok) {
              setQaseLatency(Math.round(performance.now() - start));
              setQaseError('');
            } else {
              setQaseError(`HTTP ${res.status}`);
            }
          }
        } catch (err: any) {
          if (mounted) {
            setQaseStatus('error');
            setQaseError(err.message || 'Network error');
          }
        }
      } else {
        if (mounted) {
          setQaseStatus('error');
          setQaseError('Not configured');
        }
      }

      // Check LLM Heartbeat
      if (llmState.baseUrl) {
        if (mounted && llmStatus !== 'checking') setLlmStatus('checking');
        try {
          const start = performance.now();
          const headers: Record<string, string> = {};
          if (llmState.apiToken) headers['Authorization'] = `Bearer ${llmState.apiToken}`;
          const res = await fetch(`${llmState.baseUrl.replace(/\/+$/, '')}/models`, { headers });
          if (mounted) {
            setLlmStatus(res.ok ? 'ok' : 'error');
            if (res.ok) {
              setLlmLatency(Math.round(performance.now() - start));
              setLlmError('');
            } else {
              setLlmError(`HTTP ${res.status}`);
            }
          }
        } catch (err: any) {
          if (mounted) {
            setLlmStatus('error');
            setLlmError(err.message || 'Network error');
          }
        }
      } else {
        if (mounted) {
          setLlmStatus('error');
          setLlmError('Not configured');
        }
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Poll every 30s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [qaseState.token, qaseState.baseUrl, llmState.baseUrl, llmState.apiToken]);

  return (
    <footer className="h-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono shrink-0 relative z-20">
      <div className="flex items-center gap-6">
        <div 
          className="relative flex items-center gap-1.5 font-medium cursor-default group"
        >
          <span className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">QASE</span>
          <div className={`w-1.5 h-1.5 rounded-full ${qaseStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : qaseStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
          
          {/* Custom Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-max max-w-[200px] p-2 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded border border-zinc-200 dark:border-zinc-700 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            <div className="font-semibold mb-1 border-b border-zinc-200 dark:border-zinc-700 pb-1">QASE Status: {qaseStatus.toUpperCase()}</div>
            <div>Latency: {qaseLatency !== null ? `${qaseLatency}ms` : '--'}</div>
            <div>Last Checked: {lastCheck || '--'}</div>
            {qaseError && <div className="text-rose-500 dark:text-rose-400 mt-1">Error: {qaseError}</div>}
            {/* Arrow */}
            <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-zinc-200 dark:border-t-zinc-700"></div>
            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-white dark:border-t-zinc-800"></div>
          </div>
        </div>
        
        <div 
          className="relative flex items-center gap-1.5 font-medium cursor-default group"
        >
          <span className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">LLM</span>
          <div className={`w-1.5 h-1.5 rounded-full ${llmStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : llmStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
          {/* Custom Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-max max-w-[200px] p-2 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded border border-zinc-200 dark:border-zinc-700 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            <div className="font-semibold mb-1 border-b border-zinc-200 dark:border-zinc-700 pb-1">LLM Status: {llmStatus.toUpperCase()}</div>
            <div>Latency: {llmLatency !== null ? `${llmLatency}ms` : '--'}</div>
            <div>Last Checked: {lastCheck || '--'}</div>
            {llmError && <div className="text-rose-500 dark:text-rose-400 mt-1">Error: {llmError}</div>}
            {/* Arrow */}
            <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-zinc-200 dark:border-t-zinc-700"></div>
            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-white dark:border-t-zinc-800"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const { user } = useCurrentUser();
  // Two-way sync of the signed-in user's saved settings (theme, LLM, Qase, guidelines).
  useUserSettingsSync(user?.id ?? null);
  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState('dashboard');
  
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
                 setTestCases={setTestCases}
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
      <div 
        className="flex h-screen w-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30"
        role="application"
        aria-label="QA Central - Test Management Platform"
      >
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
          activeRoute={activeRoute}
          setActiveRoute={setActiveRoute}
          isDarkMode={isDarkMode}
          setIsDarkMode={(val: boolean) => setTheme(val ? 'dark' : 'light')}
          user={user}
        />
        
        <main 
          className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative shadow-[-10px_0_30px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10"
          role="main"
          aria-label="Main content"
        >
          <Header activeRoute={activeRoute} user={user} />
          <div className="flex-1 relative overflow-hidden">
            {renderContent()}
          </div>
          
          {/* Telemetry Footer */}
          <TelemetryFooter />
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
