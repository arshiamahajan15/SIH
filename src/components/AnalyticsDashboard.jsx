import React from 'react';
import { BarChart3, PieChart as PieIcon, Activity, Users, ShieldCheck, Award, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar as BarChart, Doughnut as DoughnutChart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AnalyticsDashboard({ trials }) {
  if (!trials || trials.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Analytics Data Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">Ingest and process clinical trials from PubMed to view analytics and systematic evidence visualizations.</p>
      </div>
    );
  }

  // 1. Total Patient Cohort Sum & Stats
  const validSampleSizes = trials
    .map(t => typeof t.extracted.sampleSize === 'number' ? t.extracted.sampleSize : parseInt(t.extracted.sampleSize, 10))
    .filter(n => !isNaN(n) && n > 0);

  const totalPatientsEnrolled = validSampleSizes.reduce((acc, curr) => acc + curr, 0);
  const avgSampleSize = validSampleSizes.length > 0 ? Math.round(totalPatientsEnrolled / validSampleSizes.length) : 0;
  const maxSampleSize = validSampleSizes.length > 0 ? Math.max(...validSampleSizes) : 0;
  const avgConfidence = Math.round(trials.reduce((acc, t) => acc + (t.extracted.overallConfidence || 90), 0) / trials.length);

  // 2. Chart Data: Sample Size Distribution Histogram
  const sampleSizeLabels = trials.map(t => t.pmid);
  const sampleSizeValues = trials.map(t => {
    const val = typeof t.extracted.sampleSize === 'number' ? t.extracted.sampleSize : parseInt(t.extracted.sampleSize, 10);
    return isNaN(val) ? 0 : val;
  });

  const sampleSizeChartData = {
    labels: sampleSizeLabels,
    datasets: [
      {
        label: 'Sample Size (N Participants)',
        data: sampleSizeValues,
        backgroundColor: 'rgba(245, 158, 11, 0.65)',
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderRadius: 8,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        callbacks: {
          title: (items) => `PMID: ${items[0].label}`,
          label: (item) => ` Cohort N = ${item.raw.toLocaleString()} Patients`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      }
    }
  };

  // 3. Chart Data: Assertion Status Distribution
  const assertionCounts = trials.reduce((acc, t) => {
    const status = t.extracted.assertionStatus || 'PRESENT_POSITIVE';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const assertionChartData = {
    labels: Object.keys(assertionCounts),
    datasets: [
      {
        data: Object.values(assertionCounts),
        backgroundColor: [
          'rgba(16, 185, 129, 0.75)',
          'rgba(244, 63, 94, 0.75)',
          'rgba(245, 158, 11, 0.75)'
        ],
        borderColor: [
          '#10b981',
          '#f43f5e',
          '#f59e0b'
        ],
        borderWidth: 1.5
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Trials Processed */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Extracted Clinical Trials</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{trials.length}</h3>
            <p className="text-[10px] text-cyan-400 mt-0.5">PubMed Papers Processed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Total Patients Enrolled */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Patient Cohort (N)</p>
            <h3 className="text-2xl font-bold font-mono text-amber-300 mt-1">{totalPatientsEnrolled.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Avg N = {avgSampleSize.toLocaleString()} / trial</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Average Multi-Task Confidence */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Patent MTL Confidence</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">{avgConfidence}%</h3>
            <p className="text-[10px] text-emerald-400 mt-0.5">US20250252261A1 Model Score</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Max Trial Cohort Size */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Largest Trial Cohort</p>
            <h3 className="text-2xl font-bold font-mono text-purple-300 mt-1">N = {maxSampleSize.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Single RCT Max Enrollment</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sample Size Bar Chart (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Patient Sample Size (N) Distribution Across Studies
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Histogram</span>
          </div>

          <div className="h-64 sm:h-72">
            <BarChart data={sampleSizeChartData} options={barOptions} />
          </div>
        </div>

        {/* Clinical Assertion Status Doughnut Chart (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                Task 3: Assertion Polarity
              </h3>
              <span className="text-[10px] font-mono text-slate-400">AD Head</span>
            </div>

            <div className="h-48 sm:h-56 flex items-center justify-center">
              <DoughnutChart data={assertionChartData} options={doughnutOptions} />
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-center">
            Patented Assertion Detection classifies outcome findings into Present/Positive, Absent/Negated, or Conditional.
          </div>
        </div>

      </div>

    </div>
  );
}
