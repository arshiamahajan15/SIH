import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Database, Edit3, Save, CheckCircle2, ArrowRight, Activity, AlertCircle, FileText, Layers } from 'lucide-react';

export default function MultiTaskViewer({ activeTrial, onSaveToDatabase, isSavedInDb }) {
  if (!activeTrial) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Clinical Trial Selected</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">Select a benchmark trial above or query live PubMed to visualize Patent US20250252261A1 Multi-Task Extraction.</p>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editedTrial, setEditedTrial] = useState(activeTrial);

  useEffect(() => {
    setEditedTrial(activeTrial);
    setIsEditing(false);
  }, [activeTrial]);

  const { extracted, multiTaskGraph, abstract } = editedTrial;

  // Render Highlighted Abstract
  const renderHighlightedAbstract = () => {
    if (!multiTaskGraph || !multiTaskGraph.entities || multiTaskGraph.entities.length === 0) {
      return <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{abstract}</p>;
    }

    // Sort entities by start character position
    const validEntities = multiTaskGraph.entities
      .filter(e => e.start !== undefined && e.end !== undefined && e.start < e.end)
      .sort((a, b) => a.start - b.start);

    if (validEntities.length === 0) {
      return <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{abstract}</p>;
    }

    const segments = [];
    let lastIndex = 0;

    validEntities.forEach((entity, idx) => {
      if (entity.start >= lastIndex) {
        // Text prior to entity
        if (entity.start > lastIndex) {
          segments.push(
            <span key={`text-${lastIndex}`}>{abstract.substring(lastIndex, entity.start)}</span>
          );
        }

        // Color badge determination
        let badgeClass = 'entity-disease';
        if (entity.type === 'INTERVENTION') badgeClass = 'entity-intervention';
        if (entity.type === 'SAMPLE_SIZE') badgeClass = 'entity-sample-size';
        if (entity.type === 'OUTCOME') badgeClass = 'entity-outcome';

        segments.push(
          <span
            key={`ent-${idx}-${entity.id}`}
            className={`entity-highlight ${badgeClass} text-xs font-medium cursor-pointer transition-transform hover:scale-105`}
            title={`${entity.label} (${Math.round((entity.confidence || 0.9) * 100)}% Confidence)`}
          >
            {abstract.substring(entity.start, entity.end)}
            <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono ml-0.5">[{entity.type}]</span>
          </span>
        );

        lastIndex = entity.end;
      }
    });

    if (lastIndex < abstract.length) {
      segments.push(
        <span key={`text-end`}>{abstract.substring(lastIndex)}</span>
      );
    }

    return (
      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
        {segments}
      </div>
    );
  };

  const handleFieldChange = (field, value) => {
    setEditedTrial(prev => ({
      ...prev,
      extracted: {
        ...prev.extracted,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveToDatabase(editedTrial);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                PMID: {editedTrial.pmid}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                {editedTrial.journal} ({editedTrial.year})
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>MTL Extraction Confidence: {extracted.overallConfidence}%</span>
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-white leading-snug">
              {editedTrial.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{editedTrial.authors}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Confirm & Save</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center gap-2 border border-slate-700"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Parameters</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg ${
                isSavedInDb
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-700/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{isSavedInDb ? 'Update in SQLite DB' : 'Save to SQLite DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Abstract Reader (Left) + Patent US20250252261A1 Multi-Task Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Abstract Reader with Entity Highlighting (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Raw PubMed Abstract Reader
              </h3>
              
              {/* Entity Color Legend */}
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Disease</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Drug</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Sample N</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">Outcome</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 min-h-[300px]">
              {renderHighlightedAbstract()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Patent US20250252261A1 Shared Token Encoder Layer</span>
            <span className="font-mono text-cyan-400">Context Window: 512 Tokens</span>
          </div>
        </div>

        {/* Right Column: Patent US20250252261A1 Multi-Task Extraction Output (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* TASK 1: Named Entity Recognition (NER) */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                Task 1: Named Entity Recognition
              </span>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                NER Head
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Target Disease */}
              <div>
                <label className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Target Disease / Condition:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.disease}
                    onChange={(e) => handleFieldChange('disease', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-purple-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 font-semibold text-slate-100 mt-1">
                    {extracted.disease}
                  </div>
                )}
              </div>

              {/* Intervention / Drug */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Intervention / Drug Applied:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.intervention}
                    onChange={(e) => handleFieldChange('intervention', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 font-semibold text-slate-100 mt-1">
                    {extracted.intervention}
                  </div>
                )}
              </div>

              {/* Sample Size (N) */}
              <div>
                <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Patient Sample Size (N):
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={extracted.sampleSize}
                    onChange={(e) => handleFieldChange('sampleSize', parseInt(e.target.value, 10) || 0)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 font-mono font-bold text-amber-300 mt-1 flex items-center justify-between">
                    <span>N = {typeof extracted.sampleSize === 'number' ? extracted.sampleSize.toLocaleString() : extracted.sampleSize}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Participants Enrolled</span>
                  </div>
                )}
              </div>

              {/* Study Design */}
              <div>
                <label className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Trial Design:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.studyDesign}
                    onChange={(e) => handleFieldChange('studyDesign', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-cyan-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200 mt-1">
                    {extracted.studyDesign}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TASK 2: Relation Extraction (RE) */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Task 2: Relation Extraction (RE)
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                RE Head
              </span>
            </div>

            <div className="space-y-2">
              {multiTaskGraph?.relations?.map((rel) => (
                <div key={rel.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-semibold text-emerald-300 truncate">{rel.sourceText}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                      {rel.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-purple-300 truncate">{rel.targetText}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                    {Math.round(rel.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TASK 3: Assertion Detection (AD) */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Task 3: Assertion Detection (AD)
              </span>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                AD Head
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Clinical Assertion Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  extracted.assertionStatus === 'PRESENT_POSITIVE'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : extracted.assertionStatus === 'ABSENT_NEGATED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {extracted.assertionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{extracted.assertionExplanation}"
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
