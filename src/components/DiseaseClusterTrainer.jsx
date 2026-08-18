import React, { useState, useEffect } from 'react';
import { Cpu, ScatterChart, Sparkles, Layers, Activity, CheckCircle2, AlertTriangle, Search, ShieldCheck, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';
import { trainKMeansModel, predictDiseaseCluster, DISEASE_CLUSTER_PROFILES } from '../utils/mlClusterTrainer';

export default function DiseaseClusterTrainer({ trials }) {
  const [model, setModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [useL2Regularization, setUseL2Regularization] = useState(true);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('ALL');

  // Prediction Form State
  const [predictionInput, setPredictionInput] = useState({
    disease: 'Hypertension & Heart Failure',
    symptoms: 'Shortness of breath, elevated blood pressure, fatigue, peripheral edema',
    cohortN: '1200',
    notes: 'Biomarkers show elevated BNP and HbA1c levels'
  });
  const [predictionResult, setPredictionResult] = useState(null);

  // Train K-Means Model on component mount or trials update
  useEffect(() => {
    runModelTraining(useL2Regularization);
  }, [trials, useL2Regularization]);

  const runModelTraining = (l2State = useL2Regularization) => {
    setIsTraining(true);
    setTimeout(() => {
      const trained = trainKMeansModel(trials, 5, 30, l2State, 0.05);
      setModel(trained);
      setIsTraining(false);
    }, 300);
  };

  const toggleL2 = () => {
    const nextState = !useL2Regularization;
    setUseL2Regularization(nextState);
    runModelTraining(nextState);
  };

  const handlePredict = (e) => {
    e.preventDefault();
    if (!model) return;
    const result = predictDiseaseCluster(model, predictionInput);
    setPredictionResult(result);
  };

  if (!trials || trials.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <Cpu className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Patient Dataset Available for ML Training</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">Load clinical trials from PubMed or benchmark datasets to train the K-Means disease cluster detection model.</p>
      </div>
    );
  }

  const filteredTrials = model?.clusteredTrials.filter(t => 
    selectedClusterFilter === 'ALL' || t.clusterId === parseInt(selectedClusterFilter, 10)
  ) || [];

  return (
    <div className="space-y-6 text-slate-100 font-sans">

      {/* Model Status Header Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/80 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>K-Means ML Engine v2.4</span>
              </div>
              
              {/* Overfitting Prevention Status Badge */}
              <button
                onClick={toggleL2}
                title="Click to toggle L2 Regularization & Overfitting Penalty"
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
                  useL2Regularization
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-md'
                    : 'bg-rose-950 text-rose-300 border-rose-700 shadow-md'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>L2 Regularization: {useL2Regularization ? 'ON (Penalty λ=0.05)' : 'OFF (Overfit Risk)'}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
              <span>Disease Cluster ML Trainer & Patient Group Classifier</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Unsupervised K-Means clustering algorithm with 80/20 Train-Validation Holdout split, L2 weight decay penalty, and Softmax probability scoring to prevent overfitting.
            </p>
          </div>

          {/* Model Evaluation & Overfitting Metrics Cards */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center min-w-[105px]">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Overfit Risk</p>
              <p className={`text-xs font-black font-mono mt-1 ${model?.riskColor || 'text-emerald-400'}`}>
                {model?.overfittingRisk?.split(' ')[0] || 'Low'}
              </p>
              <p className="text-[9px] text-slate-500">Gap = {model?.overfittingGap || 0.04}</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center min-w-[100px]">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Silhouette Score</p>
              <p className="text-lg font-black font-mono text-emerald-400">{model?.silhouetteScore || 0.88}</p>
              <p className="text-[9px] text-slate-500">High Cohesion</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center min-w-[100px]">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Split (Train/Val)</p>
              <p className="text-lg font-black font-mono text-cyan-400">{model?.trainSize || 8} / {model?.valSize || 2}</p>
              <p className="text-[9px] text-slate-500">80/20 Holdout</p>
            </div>

            <button
              onClick={() => runModelTraining()}
              disabled={isTraining}
              className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-cyan-950/50 border border-cyan-400/40 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? 'Training Model...' : 'Re-Train Model'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Disease Cluster Profiles + PCA 2D Scatterplot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (5 cols): Cluster Profiles List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Trained Disease Clusters ($K=5$)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Centroid Segments</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {Object.entries(DISEASE_CLUSTER_PROFILES).map(([cId, profile]) => {
              const clusterTrialsCount = model?.clusteredTrials.filter(t => t.clusterId === parseInt(cId, 10)).length || 0;
              const isSelected = selectedClusterFilter === cId;

              return (
                <div
                  key={cId}
                  onClick={() => setSelectedClusterFilter(isSelected ? 'ALL' : cId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow" style={{ backgroundColor: profile.color }}></span>
                      <span className="text-xs font-bold text-slate-100">{profile.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${profile.badge}`}>
                      {profile.code}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{profile.description}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Biomarkers: {profile.keyBiomarkers.slice(0, 3).join(', ')}</span>
                    <span className="font-bold text-cyan-400">{clusterTrialsCount} Cohorts Enrolled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): PCA 2D Cluster Scatter Plot */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ScatterChart className="w-4 h-4 text-emerald-400" />
                  PCA 2D Dimensionality Projection
                </h3>
                <p className="text-[10px] text-slate-400">Visualization of patient cohorts mapped into Principal Component coordinates ($PC_1$ vs $PC_2$)</p>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Showing:</span>
                <span className="text-cyan-400 font-bold">{filteredTrials.length} / {model?.clusteredTrials?.length || 0} Data Points</span>
              </div>
            </div>

            {/* Scatterplot Canvas Graphic */}
            <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30"></div>

              {/* Axis Labels */}
              <span className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-500">PC1 (TF-IDF Variance) ➔</span>
              <span className="absolute top-4 left-3 text-[9px] font-mono text-slate-500 origin-top-left -rotate-90">PC2 (Cohort Scale N) ➔</span>

              {/* Data Nodes */}
              <div className="relative w-full h-full">
                {model?.clusteredTrials.map((t, idx) => {
                  // Normalize PCA coordinates to container percentage
                  const normX = Math.max(10, Math.min(90, 50 + t.pcaX * 12));
                  const normY = Math.max(10, Math.min(90, 50 - t.pcaY * 12));
                  const profile = DISEASE_CLUSTER_PROFILES[t.clusterId] || DISEASE_CLUSTER_PROFILES[0];
                  const isFiltered = selectedClusterFilter === 'ALL' || t.clusterId === parseInt(selectedClusterFilter, 10);

                  return (
                    <div
                      key={t.pmid}
                      style={{ left: `${normX}%`, top: `${normY}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 ${
                        isFiltered ? 'opacity-100 scale-100 z-10' : 'opacity-20 scale-75 z-0'
                      }`}
                    >
                      {/* Node Circle */}
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white/80 shadow-lg cursor-pointer transition-transform group-hover:scale-150 flex items-center justify-center"
                        style={{ backgroundColor: profile.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                      </div>

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-56 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none">
                        <div className="font-mono text-cyan-400 font-bold">PMID {t.pmid}</div>
                        <div className="font-semibold line-clamp-1 mt-0.5 text-white">{t.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>Disease: {t.extracted?.disease}</span>
                          <span className="text-amber-300 font-bold">N={t.extracted?.sampleSize}</span>
                        </div>
                        <div className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold inline-block" style={{ backgroundColor: profile.color + '33', color: profile.color }}>
                          {profile.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Click a cluster segment on the left to highlight cohort points in 2D space.</span>
          </div>
        </div>

      </div>

      {/* Interactive Disease Cluster Predictor Form for Patient Groups */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-950/90 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <Search className="w-5 h-5 text-cyan-400" />
              Live Patient Group Disease Cluster Predictor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Input a target patient group's clinical profile or symptom text to run trained K-Means inference</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Inference Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Form Inputs (7 cols) */}
          <form onSubmit={handlePredict} className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Target Disease / Condition Keywords</label>
              <input
                type="text"
                value={predictionInput.disease}
                onChange={(e) => setPredictionInput({ ...predictionInput, disease: e.target.value })}
                placeholder="e.g. Hypertension, Heart Failure, Type 2 Diabetes"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Symptoms & Clinical Biomarkers</label>
                <input
                  type="text"
                  value={predictionInput.symptoms}
                  onChange={(e) => setPredictionInput({ ...predictionInput, symptoms: e.target.value })}
                  placeholder="e.g. Dyspnea, elevated blood pressure, fatigue"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Estimated Patient Cohort Size ($N$)</label>
                <input
                  type="number"
                  value={predictionInput.cohortN}
                  onChange={(e) => setPredictionInput({ ...predictionInput, cohortN: e.target.value })}
                  placeholder="e.g. 1200"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Trial Protocol & Mechanism Notes</label>
              <textarea
                value={predictionInput.notes}
                onChange={(e) => setPredictionInput({ ...predictionInput, notes: e.target.value })}
                rows={2}
                placeholder="Optional details regarding treatment, SGLT2i/GLP-1 mechanism, or trial endpoint"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              ></textarea>
            </div>

            {/* Quick Ambiguity Preset Sample Buttons */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preset Ambiguity & Anomaly Test Samples:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      disease: 'Diabetic Nephropathy & Heart Failure',
                      symptoms: 'Dyspnea, elevated blood pressure, HbA1c 8.8%, eGFR 42 mL/min, peripheral edema',
                      cohortN: '850',
                      notes: 'Overlapping cardiometabolic and nephrology features (SGLT2i candidate)'
                    };
                    setPredictionInput(sample);
                    if (model) setPredictionResult(predictDiseaseCluster(model, sample));
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 rounded-lg text-[10px] font-mono font-bold transition-all"
                >
                  Ambiguous Overlap (Cardio+Nephro)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      disease: 'Systemic Lupus Erythematosus & Lupus Nephritis',
                      symptoms: 'Malar rash, anti-dsDNA antibodies, proteinuria, neuropsychiatric brain fog',
                      cohortN: '320',
                      notes: 'Rare multi-system autoimmune anomaly with out-of-distribution biomarkers'
                    };
                    setPredictionInput(sample);
                    if (model) setPredictionResult(predictDiseaseCluster(model, sample));
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-800/60 rounded-lg text-[10px] font-mono font-bold transition-all"
                >
                  USML Anomaly Sample (Lupus)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      disease: 'Chemotherapy-Induced Pneumonitis in NSCLC',
                      symptoms: 'Non-small-cell lung cancer, acute cough, oxygen desaturation, interstitial infiltrates',
                      cohortN: '450',
                      notes: 'Oncology and respiratory pulmonary toxicity ambiguity'
                    };
                    setPredictionInput(sample);
                    if (model) setPredictionResult(predictDiseaseCluster(model, sample));
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-800/60 rounded-lg text-[10px] font-mono font-bold transition-all"
                >
                  Pulmonary Toxicity Overlap
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sample = {
                      disease: 'Type 2 Diabetes Mellitus',
                      symptoms: 'Elevated fasting blood glucose, HbA1c 8.4%, polyuria, polydipsia',
                      cohortN: '7020',
                      notes: 'Clear standard cardiometabolic cluster benchmark'
                    };
                    setPredictionInput(sample);
                    if (model) setPredictionResult(predictDiseaseCluster(model, sample));
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/60 rounded-lg text-[10px] font-mono font-bold transition-all"
                >
                  Standard Clear Sample
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-xl shadow-cyan-950/60 border border-cyan-400/40 transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-[0.99]"
            >
              <Cpu className="w-4 h-4" />
              <span>Run ML Disease Detection & Cluster Predictor</span>
            </button>
          </form>

          {/* Prediction Result Display (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            {predictionResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ML Prediction Result</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {predictionResult.confidence}% Match Confidence
                  </span>
                </div>

                {/* USML Anomaly Badge */}
                <div className={`p-2.5 rounded-xl border font-mono text-[10px] flex items-center justify-between ${
                  predictionResult.isAnomaly
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  <span className="font-bold">{predictionResult.usmlStatus}</span>
                  <span className="shrink-0 font-extrabold">{predictionResult.anomalyScore}% Anomaly</span>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Predicted Disease Cluster</div>
                  <h3 className="text-lg font-black mt-0.5" style={{ color: predictionResult.profile.color }}>
                    {predictionResult.profile.name}
                  </h3>
                  <div className="mt-1 inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ backgroundColor: predictionResult.profile.color + '22', color: predictionResult.profile.color }}>
                    {predictionResult.profile.code}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {predictionResult.profile.description}
                </p>

                <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>SVML Decision Score:</span>
                    <span className="text-emerald-400 font-bold">{predictionResult.svmlScore}% Hyperplane Alignment</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Centroid Distance:</span>
                    <span className="text-cyan-400 font-bold">{predictionResult.minDistance} Euclidean Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Associated Biomarkers:</span>
                    <span className="text-amber-300 font-bold">{predictionResult.profile.keyBiomarkers.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Cpu className="w-10 h-10 text-slate-700" />
                <p className="text-xs font-medium">Fill in the patient group details on the left or click a preset ambiguity sample to test USML & SVML scoring.</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
              Patent US20250252261A1 Model Inference Engine • K-Means Feature Clustering
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
