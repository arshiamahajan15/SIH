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
      <div className="glass-panel rounded-xl p-5 border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                PMID: {editedTrial.pmid}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {editedTrial.journal} ({editedTrial.year})
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                <span>Extraction Score: {extracted.overallConfidence}%</span>
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {editedTrial.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">{editedTrial.authors}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 border border-slate-300"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Edit Fields</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className={`px-3.5 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 border ${
                isSavedInDb
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSavedInDb ? 'Update in SQLite DB' : 'Save to SQLite DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Abstract Reader (Left) + Patent US20250252261A1 Multi-Task Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Abstract Reader with Entity Highlighting (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-xl p-5 border border-slate-200 bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Raw PubMed Abstract Reader
              </h3>
              
              {/* Entity Color Legend */}
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Disease</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">Drug</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Sample N</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">Outcome</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[300px]">
              {renderHighlightedAbstract()}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Patent US20250252261A1 Shared Token Encoder</span>
            <span className="font-mono text-teal-700">Context Window: 512 Tokens</span>
          </div>
        </div>

        {/* Right Column: Multi-Task Extraction Output (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* TASK 1: Named Entity Recognition (NER) */}
          <div className="glass-panel rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Task 1: Named Entity Recognition
              </span>
              <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                NER Head
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Target Disease */}
              <div>
                <label className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Target Disease / Condition:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.disease}
                    onChange={(e) => handleFieldChange('disease', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-purple-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-900 mt-1">
                    {extracted.disease}
                  </div>
                )}
              </div>

              {/* Intervention / Drug */}
              <div>
                <label className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> Intervention / Drug Applied:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.intervention}
                    onChange={(e) => handleFieldChange('intervention', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-teal-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-900 mt-1">
                    {extracted.intervention}
                  </div>
                )}
              </div>

              {/* Sample Size (N) */}
              <div>
                <label className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Patient Sample Size (N):
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={extracted.sampleSize}
                    onChange={(e) => handleFieldChange('sampleSize', parseInt(e.target.value, 10) || 0)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-amber-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono font-bold text-amber-700 mt-1 flex items-center justify-between">
                    <span>N = {typeof extracted.sampleSize === 'number' ? extracted.sampleSize.toLocaleString() : extracted.sampleSize}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">Participants Enrolled</span>
                  </div>
                )}
              </div>

              {/* Study Design */}
              <div>
                <label className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Trial Design:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={extracted.studyDesign}
                    onChange={(e) => handleFieldChange('studyDesign', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 mt-1">
                    {extracted.studyDesign}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TASK 2: Relation Extraction (RE) */}
          <div className="glass-panel rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Task 2: Relation Extraction (RE)
              </span>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                RE Head
              </span>
            </div>

            <div className="space-y-2">
              {multiTaskGraph?.relations?.map((rel) => (
                <div key={rel.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-semibold text-teal-700 truncate">{rel.sourceText}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-200 text-slate-800 shrink-0">
                      {rel.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-purple-700 truncate">{rel.targetText}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                    {Math.round(rel.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TASK 3: Assertion Detection (AD) */}
          <div className="glass-panel rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Task 3: Assertion Detection (AD)
              </span>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                AD Head
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Clinical Assertion Status:</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                  extracted.assertionStatus === 'PRESENT_POSITIVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : extracted.assertionStatus === 'ABSENT_NEGATED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {extracted.assertionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{extracted.assertionExplanation}"
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
