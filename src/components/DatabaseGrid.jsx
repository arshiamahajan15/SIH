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
      <div className="glass-panel rounded-xl p-5 border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            <span>SQLite Clinical Trials Relational Database</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
              {trials.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Structured biomedical knowledge extracted from PubMed abstracts</p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportToSQLiteDB(trials)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
            <span>Export .SQL</span>
          </button>

          <button
            onClick={() => exportToCSV(trials)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportToJSON(trials)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export JSON</span>
          </button>

          {trials.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg font-medium text-xs border border-slate-200 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-xl p-3.5 border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PMID, Title, Disease, Drug..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-teal-600" /> Disease Filter:
          </span>
          <select
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
          >
            {uniqueDiseases.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th onClick={() => handleSort('pmid')} className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors">
                  <div className="flex items-center gap-1">
                    PMID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Title & Journal</th>
                <th onClick={() => handleSort('disease')} className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors">
                  <div className="flex items-center gap-1">
                    Target Disease <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('intervention')} className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors">
                  <div className="flex items-center gap-1">
                    Intervention / Drug <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('sampleSize')} className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right">
                  <div className="flex items-center justify-end gap-1">
                    Sample N <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Assertion Status</th>
                <th onClick={() => handleSort('overallConfidence')} className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-center">
                  <div className="flex items-center justify-center gap-1">
                    Conf. <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium">
              {sortedTrials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No clinical trial records match the selected filter.
                  </td>
                </tr>
              ) : (
                sortedTrials.map((trial) => (
                  <tr key={trial.pmid} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* PMID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {trial.pmid}
                    </td>

                    {/* Title & Journal */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                        {trial.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {trial.journal} ({trial.year})
                      </div>
                    </td>

                    {/* Disease */}
                    <td className="py-3 px-4 font-semibold text-purple-700">
                      {trial.extracted.disease}
                    </td>

                    {/* Intervention */}
                    <td className="py-3 px-4 font-semibold text-teal-700">
                      {trial.extracted.intervention}
                    </td>

                    {/* Sample N */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                      {typeof trial.extracted.sampleSize === 'number' 
                        ? trial.extracted.sampleSize.toLocaleString() 
                        : trial.extracted.sampleSize}
                    </td>

                    {/* Assertion */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        trial.extracted.assertionStatus === 'PRESENT_POSITIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : trial.extracted.assertionStatus === 'ABSENT_NEGATED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {trial.extracted.assertionStatus}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-teal-700 whitespace-nowrap">
                      {trial.extracted.overallConfidence}%
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteTrial(trial.pmid)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-rose-50"
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
