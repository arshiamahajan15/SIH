import React, { useState } from 'react';
import { Database, Search, Download, Trash2, ArrowUpDown, FileSpreadsheet, FileCode, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToSQLiteDB } from '../utils/sqliteExport';

export default function DatabaseGrid({ trials, onDeleteTrial, onClearAll }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('year');
  const [sortDirection, setSortDirection] = useState('desc');
  const [diseaseFilter, setDiseaseFilter] = useState('All');

  // Unique Diseases for filter dropdown
  const uniqueDiseases = ['All', ...new Set(trials.map(t => t.extracted.disease).filter(Boolean))];

  // Filtering
  const filteredTrials = trials.filter(trial => {
    const matchesSearch = 
      trial.pmid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.extracted.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.extracted.intervention.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDisease = diseaseFilter === 'All' || trial.extracted.disease === diseaseFilter;

    return matchesSearch && matchesDisease;
  });

  // Sorting
  const sortedTrials = [...filteredTrials].sort((a, b) => {
    let aVal = a[sortField] || a.extracted[sortField] || 0;
    let bVal = b[sortField] || b.extracted[sortField] || 0;

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Database Controls Header */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>SQLite Clinical Trials Relational Database</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {trials.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Structured information extracted from PubMed abstracts using Patent US20250252261A1</p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToSQLiteDB(trials)}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded-xl font-medium text-xs border border-cyan-800 transition-all flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export .SQL Dump</span>
          </button>

          <button
            onClick={() => exportToCSV(trials)}
            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-xl font-medium text-xs border border-emerald-800 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportToJSON(trials)}
            className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded-xl font-medium text-xs border border-purple-800 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {trials.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl font-medium text-xs border border-rose-800/60 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PMID, Title, Disease, Drug..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Disease Filter:
          </span>
          <select
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {uniqueDiseases.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th onClick={() => handleSort('pmid')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    PMID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Title & Journal</th>
                <th onClick={() => handleSort('disease')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Target Disease <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('intervention')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    Intervention / Drug <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('sampleSize')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right">
                  <div className="flex items-center justify-end gap-1">
                    Sample N <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Assertion Status</th>
                <th onClick={() => handleSort('overallConfidence')} className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center">
                  <div className="flex items-center justify-center gap-1">
                    Conf. <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sortedTrials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No clinical trial records match the selected filter.
                  </td>
                </tr>
              ) : (
                sortedTrials.map((trial) => (
                  <tr key={trial.pmid} className="hover:bg-slate-900/50 transition-colors group">
                    
                    {/* PMID */}
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {trial.pmid}
                    </td>

                    {/* Title & Journal */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {trial.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {trial.journal} ({trial.year})
                      </div>
                    </td>

                    {/* Disease */}
                    <td className="py-3 px-4 font-semibold text-purple-300">
                      {trial.extracted.disease}
                    </td>

                    {/* Intervention */}
                    <td className="py-3 px-4 font-semibold text-emerald-300">
                      {trial.extracted.intervention}
                    </td>

                    {/* Sample N */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
                      {typeof trial.extracted.sampleSize === 'number' 
                        ? trial.extracted.sampleSize.toLocaleString() 
                        : trial.extracted.sampleSize}
                    </td>

                    {/* Assertion */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        trial.extracted.assertionStatus === 'PRESENT_POSITIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : trial.extracted.assertionStatus === 'ABSENT_NEGATED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {trial.extracted.assertionStatus}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-cyan-400 whitespace-nowrap">
                      {trial.extracted.overallConfidence}%
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteTrial(trial.pmid)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-950/40"
                        title="Delete trial record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
