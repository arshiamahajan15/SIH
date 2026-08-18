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
    <div className="glass-panel rounded-xl p-5 border border-slate-200 bg-white shadow-sm mb-6">
      
      {/* Search Header Mode Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Ingest Biomedical Literature</span>
          </h2>
          <p className="text-xs text-slate-500">Select benchmark clinical trials, search NCBI PubMed API, or paste abstract text</p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setSearchMode('benchmark')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              searchMode === 'benchmark'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Benchmark Trials
          </button>
          <button
            onClick={() => setSearchMode('live')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              searchMode === 'live'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live PubMed API
          </button>
          <button
            onClick={() => setSearchMode('custom')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              searchMode === 'custom'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste Abstract
          </button>
        </div>
      </div>

      {/* MODE 1: Benchmark Clinical Trials */}
      {searchMode === 'benchmark' && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              Medical Domain:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomainFilter(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedDomainFilter === d
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
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
                className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      PMID: {trial.pmid}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                      {trial.domain}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 line-clamp-2 transition-colors">
                    {trial.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 italic">
                    "{trial.abstract.substring(0, 110)}..."
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{trial.journal} ({trial.year})</span>
                  <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-1">
                    Extract Data ➔
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
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
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
                  className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      PMID: {trial.pmid}
                    </span>
                    <span className="text-[10px] text-slate-500">{trial.journal} ({trial.year})</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 line-clamp-2">
                    {trial.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Study / Trial Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Double-blind evaluation of drug X in 450 diabetes patients..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PMID / Identifier (Optional)</label>
              <input
                type="text"
                value={customPMID}
                onChange={(e) => setCustomPMID(e.target.value)}
                placeholder="e.g. 39102456"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-mono shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Unstructured Abstract Text</label>
            <textarea
              rows={4}
              value={customAbstractText}
              onChange={(e) => setCustomAbstractText(e.target.value)}
              placeholder="Paste raw abstract text here containing Background, Methods, Results, and Conclusions..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-mono leading-relaxed shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Run Multi-Task NLP Extraction</span>
          </button>
        </form>
      )}

    </div>
  );
}
