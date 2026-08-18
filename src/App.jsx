import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PubMedSearch from './components/PubMedSearch';
import MultiTaskViewer from './components/MultiTaskViewer';
import DatabaseGrid from './components/DatabaseGrid';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DiseaseClusterTrainer from './components/DiseaseClusterTrainer';
import { getProcessedBenchmarkTrials } from './utils/pubmedApi';
import { processClinicalAbstract } from './utils/multiTaskExtractor';
import { Sparkles, CheckCircle2, AlertCircle, Database, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('extractor');
  const [databaseTrials, setDatabaseTrials] = useState([]);
  const [activeTrial, setActiveTrial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize dataset with benchmark trials
  useEffect(() => {
    try {
      const benchmarkData = getProcessedBenchmarkTrials();
      setDatabaseTrials(benchmarkData);
      if (benchmarkData.length > 0) {
        setActiveTrial(benchmarkData[0]);
      }
    } catch (e) {
      console.error("Failed to load initial benchmark trials:", e);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle selecting a trial from search or benchmark list
  const handleSelectTrial = (rawTrial) => {
    const processed = processClinicalAbstract(rawTrial);
    setActiveTrial(processed);
    showToast(`Ingested & processed PMID ${processed.pmid} using Patent US20250252261A1 Multi-Task Engine!`);
  };

  // Custom abstract submission
  const handleCustomIngest = (customTrial) => {
    const processed = processClinicalAbstract(customTrial);
    setActiveTrial(processed);
    showToast(`Extracted entities & relations for custom input!`);
  };

  // Save/Update trial in active SQLite database
  const handleSaveToDatabase = (trialToSave) => {
    setDatabaseTrials(prev => {
      const existingIdx = prev.findIndex(t => t.pmid === trialToSave.pmid);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = trialToSave;
        return updated;
      } else {
        return [trialToSave, ...prev];
      }
    });
    showToast(`Saved PMID ${trialToSave.pmid} to SQLite Database!`);
  };

  const handleDeleteTrial = (pmid) => {
    setDatabaseTrials(prev => prev.filter(t => t.pmid !== pmid));
    showToast(`Removed trial record ${pmid} from database.`, 'info');
  };

  const handleClearAll = () => {
    setDatabaseTrials([]);
    showToast(`Cleared SQLite database records.`, 'info');
  };

  const isSavedInDb = activeTrial ? databaseTrials.some(t => t.pmid === activeTrial.pmid) : false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className="px-4 py-3 rounded-xl shadow-xl bg-slate-900 text-white border border-slate-800 flex items-center space-x-2.5 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalTrialsCount={databaseTrials.length}
      />

      {/* Main Content Area with Smooth Horizontal Sliding View Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        
        <div className="transition-all duration-300 ease-in-out transform">
          
          {/* TAB 1: EXTRACTOR & READER */}
          {activeTab === 'extractor' && (
            <div className="space-y-6 animate-fadeIn transition-transform duration-300">
              <PubMedSearch
                onSelectTrial={handleSelectTrial}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onCustomIngest={handleCustomIngest}
              />

              <MultiTaskViewer
                activeTrial={activeTrial}
                onSaveToDatabase={handleSaveToDatabase}
                isSavedInDb={isSavedInDb}
              />
            </div>
          )}

          {/* TAB 2: DISEASE CLUSTER ML TRAINER & PREDICTOR */}
          {activeTab === 'clusterTrainer' && (
            <div className="animate-fadeIn transition-transform duration-300">
              <DiseaseClusterTrainer trials={databaseTrials} />
            </div>
          )}

          {/* TAB 3: SQLITE DATABASE GRID */}
          {activeTab === 'database' && (
            <div className="animate-fadeIn transition-transform duration-300">
              <DatabaseGrid
                trials={databaseTrials}
                onDeleteTrial={handleDeleteTrial}
                onClearAll={handleClearAll}
              />
            </div>
          )}

          {/* TAB 4: ANALYTICS & INSIGHTS */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn transition-transform duration-300">
              <AnalyticsDashboard trials={databaseTrials} />
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Patent US20250252261A1 Implementation: Multi-Task Learning for NLP Tasks</span>
          </div>
          <span>Automated Clinical Trial Literature Information Extractor • React & SQLite</span>
        </div>
      </footer>

    </div>
  );
}
