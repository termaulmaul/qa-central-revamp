'use client';

import { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  Check,
  Smartphone,
  Monitor,
  Database,
  Globe,
  ShieldCheck,
  Library,
  Link2,
} from 'lucide-react';
import { Button } from '../ui/Button';

export function PRDIntakePage() {
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
    { id: 'ITS', icon: Database },
  ];

  type StepStatus = 'current' | 'pending' | 'completed';

  const steps: Array<{ id: number; label: string; icon: typeof FileText; status: StepStatus }> = [
    { id: 1, label: 'PRD Intake', icon: FileText, status: 'current' },
    { id: 2, label: 'Coverage Audit', icon: ShieldCheck, status: 'pending' },
    { id: 3, label: 'Test Catalogue', icon: Library, status: 'pending' },
    { id: 4, label: 'Qase Integration', icon: Link2, status: 'pending' },
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
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center spring-transition
                    ${
                      step.status === 'current'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : step.status === 'pending'
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-500'
                        : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <Check size={18} />
                    ) : (
                      <step.icon size={18} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      step.status === 'current' ? 'text-zinc-200' : 'text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area */}
            {isUploaded ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between spring-transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100 font-mono">
                      DT-PRD-2026-017_Stock_Screener.pdf
                    </h3>
                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Parsed successfully • 21,873 chars
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setIsUploaded(false)}
                  className="text-xs py-1.5 px-3"
                >
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
                    Drag and drop your file here, or click to browse. Supported formats: TXT, PDF, MD, CSV.
                  </p>
                  <Button variant="secondary" className="pointer-events-none">
                    Select File
                  </Button>
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
                        const active = platforms.find((p) => p.id === selectedPlatform);
                        return active ? (
                          <>
                            <active.icon size={16} className="text-zinc-500" />
                            <span>{active.id}</span>
                          </>
                        ) : (
                          'Select Platform'
                        );
                      })()}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-500 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute top-full left-0 w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 transform origin-top transition-all duration-200 
                    ${
                      isDropdownOpen
                        ? 'opacity-100 scale-y-100'
                        : 'opacity-0 scale-y-95 pointer-events-none'
                    }`}
                  >
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm spring-transition
                          ${
                            selectedPlatform === platform.id
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                          }`}
                      >
                        <platform.icon
                          size={16}
                          className={
                            selectedPlatform === platform.id
                              ? 'text-indigo-400'
                              : 'text-zinc-500'
                          }
                        />
                        <span className="flex-1 text-left">{platform.id}</span>
                        {selectedPlatform === platform.id && (
                          <Check size={14} className="text-indigo-400" />
                        )}
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
                  <span className="text-xs text-zinc-500 font-normal mt-0.5">
                    Optional: Bind to a specific microservice context
                  </span>
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
          </div>

          {/* Right Sidebar - Info */}
          <div className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-zinc-200">Quick Info</h4>
              <div className="space-y-2 text-xs text-zinc-400">
                <p>• Upload your PRD in PDF or TXT format</p>
                <p>• Select target platform for test generation</p>
                <p>• AI will analyze and generate test cases</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
