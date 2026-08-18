import React from 'react';
import { Stethoscope, Database, BarChart3, FileSearch, Cpu, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, totalTrialsCount }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Patent Identifier */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-slate-900 to-emerald-600 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Stethoscope className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-white tracking-tight">ClinicalTrial<span className="text-cyan-400">Extractor</span></h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center space-x-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Patent US20250252261A1</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">Multi-Task Learning NLP Engine • NER • RE • AD • K-Means Disease Clustering</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 font-mono">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'extractor'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-lg shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <FileSearch className="w-4 h-4 text-cyan-400" />
              <span>Extractor Reader</span>
            </button>

            <button
              onClick={() => setActiveTab('clusterTrainer')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'clusterTrainer'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-lg shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>ML Cluster Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'database'
                  ? 'bg-purple-950 text-purple-300 border border-purple-600 shadow-lg shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>SQLite Database</span>
              {totalTrialsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-900 text-purple-200 border border-purple-700">
                  {totalTrialsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-lg shadow-amber-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Analytics & Metrics</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
}
