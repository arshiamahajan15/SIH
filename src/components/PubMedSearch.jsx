import React, { useState } from 'react';
import { Search, BookOpen, Sparkles, FileText, Loader2, Filter, Upload, CheckCircle2 } from 'lucide-react';
import { BENCHMARK_TRIALS, searchPubMedAPI } from '../utils/pubmedApi';

export default function PubMedSearch({ onSelectTrial, isLoading, setIsLoading, onCustomIngest }) {
  const [searchMode, setSearchMode] = useState('benchmark'); // 'benchmark' | 'live' | 'custom'
  const [query, setQuery] = useState('Semaglutide Heart Failure');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('All');
  
  // Custom abstract state
  const [customTitle, setCustomTitle] = useState('');
  const [customPMID, setCustomPMID] = useState('');
  const [customAbstractText, setCustomAbstractText] = useState('');

  const domains = ['All', 'Cardiology', 'Oncology', 'Endocrinology', 'Neurology', 'Infectious Diseases'];

  const filteredBenchmarkTrials = selectedDomainFilter === 'All'
    ? BENCHMARK_TRIALS
    : BENCHMARK_TRIALS.filter(t => t.domain === selectedDomainFilter);

  const handleLiveSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const results = await searchPubMedAPI(query, 6);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customAbstractText.trim()) return;

    const customTrial = {
      pmid: customPMID.trim() || `CUSTOM-${Date.now().toString().slice(-6)}`,
      title: customTitle.trim() || 'User Ingested Clinical Trial Abstract',
      authors: 'User Defined Study Consortium',
      journal: 'Custom Clinical Input',
      year: new Date().getFullYear(),
      abstract: customAbstractText
    };

    onCustomIngest(customTrial);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl mb-6">
      
      {/* Search Header Mode Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Ingest Biomedical Literature</span>
          </h2>
          <p className="text-xs text-slate-400">Select curated benchmark trials, search live PubMed API, or paste custom abstract text</p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSearchMode('benchmark')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              searchMode === 'benchmark'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Benchmark Trials
          </button>
          <button
            onClick={() => setSearchMode('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              searchMode === 'live'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live PubMed API
          </button>
          <button
            onClick={() => setSearchMode('custom')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              searchMode === 'custom'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {/* MODE 1: Benchmark Clinical Trials */}
      {searchMode === 'benchmark' && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Filter Medical Domain:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomainFilter(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedDomainFilter === d
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBenchmarkTrials.map((trial) => (
              <div
                key={trial.pmid}
                onClick={() => onSelectTrial(trial)}
                className="glass-card rounded-xl p-3.5 cursor-pointer hover:border-cyan-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-slate-700">
                      PMID: {trial.pmid}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {trial.domain}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 line-clamp-2 transition-colors">
                    {trial.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                    "{trial.abstract.substring(0, 110)}..."
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{trial.journal} ({trial.year})</span>
                  <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-1">
                    Extract <Sparkles className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 2: Live PubMed API Search */}
      {searchMode === 'live' && (
        <div className="pt-4">
          <form onSubmit={handleLiveSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search NCBI PubMed (e.g. Metformin Diabetes, Pembrolizumab, semaglutide...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Query PubMed</span>
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((trial) => (
                <div
                  key={trial.pmid}
                  onClick={() => onSelectTrial(trial)}
                  className="glass-card rounded-xl p-3.5 cursor-pointer hover:border-cyan-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-slate-700">
                      PMID: {trial.pmid}
                    </span>
                    <span className="text-[10px] text-slate-400">{trial.journal} ({trial.year})</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 line-clamp-2">
                    {trial.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {trial.abstract}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Custom Text Ingestion */}
      {searchMode === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Study / Trial Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Double-blind evaluation of drug X in 450 diabetes patients..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PMID / Identifier (Optional)</label>
              <input
                type="text"
                value={customPMID}
                onChange={(e) => setCustomPMID(e.target.value)}
                placeholder="e.g. 39102456"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Unstructured Abstract Text</label>
            <textarea
              rows={4}
              value={customAbstractText}
              onChange={(e) => setCustomAbstractText(e.target.value)}
              placeholder="Paste raw abstract text here containing Background, Methods, Results, and Conclusions..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Patent US20250252261A1 Multi-Task NLP Extraction</span>
          </button>
        </form>
      )}

    </div>
  );
}
