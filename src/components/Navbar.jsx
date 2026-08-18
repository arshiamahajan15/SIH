import React from 'react';
import { Stethoscope, Database, BarChart3, FileSearch, Cpu, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, totalTrialsCount }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          
          {/* Brand & Patent Identifier */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">ClinicalTrial<span className="text-teal-600">Extractor</span></h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>Patent US20250252261A1</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hidden md:flex items-center space-x-1">
                  <span>Accuracy: 94.2%</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Multi-Task NLP Engine • Biomedical Literature Information Extractor</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 font-sans">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'extractor'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-teal-500" />
              <span>Extractor</span>
            </button>

            <button
              onClick={() => setActiveTab('clusterTrainer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clusterTrainer'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>ML Clusters</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'database'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-500" />
              <span>SQLite DB</span>
              {totalTrialsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  {totalTrialsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Analytics</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
