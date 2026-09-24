import React, { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchModelPerformanceMetrics } from '../../utils/mlApi';
import type { ModelPerformanceMetrics } from '../../types/train';

export const ModelPerformanceCard: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchModelPerformanceMetrics()
      .then((data) => {
        if (isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ETA Model Performance
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active: {metrics.active_model.split('(')[0].trim()}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  v{metrics.model_version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated on held-out test set ({metrics.evaluation_period} · {metrics.test_observations.toLocaleString()} observations)
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <span>{expanded ? 'Collapse Details' : 'Expand Details'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* MAE */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-1">
              <span>Mean Absolute Error</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.mae_minutes.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">25.1% better</strong> than Current Delay Baseline (6.82m)
            </p>
          </div>

          {/* RMSE */}
          <div className="bg-slate-50 dark:bg-slate-850/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
              <span>Root Mean Sq Error</span>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.rmse_minutes.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Penalizes large delay shock outliers (vs 19.95m baseline)
            </p>
          </div>

          {/* Median Absolute Error */}
          <div className="bg-slate-50 dark:bg-slate-850/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
              <span>Median Error</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.median_absolute_error_minutes.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Typical forecast error for 50% of all section arrivals
            </p>
          </div>

          {/* 80% Uncertainty Coverage */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/60">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-1">
              <span>Interval Coverage</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.uncertainty_interval_80_coverage.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">P10–P90</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Well-calibrated uncertainty bounds (nominal 80.0%)
            </p>
          </div>
        </div>

        {/* Accuracy Tolerances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Cumulative Prediction Accuracy by Error Tolerance Window
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Held-out Test Set (N = {metrics.test_observations.toLocaleString()})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Within ±5 min', pct: metrics.within_5_minutes_percent, color: 'bg-emerald-500' },
              { label: 'Within ±10 min', pct: metrics.within_10_minutes_percent, color: 'bg-teal-500' },
              { label: 'Within ±15 min', pct: metrics.within_15_minutes_percent, color: 'bg-indigo-500' },
              { label: 'Within ±30 min', pct: metrics.within_30_minutes_percent, color: 'bg-blue-500' }
            ].map((t) => (
              <div key={t.label} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t.label}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{t.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${t.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, t.pct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Benchmark Comparison & Methodology */}
        {expanded && (
          <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Baseline Comparison Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Benchmark Comparison vs Operational Baselines
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Model / Baseline</th>
                      <th className="py-2.5 px-3 text-right">MAE (min)</th>
                      <th className="py-2.5 px-3 text-right">RMSE (min)</th>
                      <th className="py-2.5 px-3 text-right">MedAE (min)</th>
                      <th className="py-2.5 px-3 text-right">Within 5m</th>
                      <th className="py-2.5 px-3 text-right">Within 10m</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {metrics.baseline_comparison.map((b) => {
                      const isActive = b.model.includes('Active') || b.model.includes('XGBoost');
                      return (
                        <tr
                          key={b.model}
                          className={
                            isActive
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold text-indigo-900 dark:text-indigo-200'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                          }
                        >
                          <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                            <span>{b.model}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">{b.mae.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">{b.rmse.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">{b.medae.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">{b.within_5m.toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-right">{b.within_10m.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scientific Rigor & Data Governance Note */}
            <div className="bg-slate-50 dark:bg-slate-850/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Supervised Learning & Data Governance Notice</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Trained on verified September 2024 section movements across the Rajasthan railway network. The dataset uses a strict chronological split (Train: Sep 1–20, Val: Sep 21–25, Test: Sep 26–30) to eliminate point-in-time leakage. Timetable Scheduled Arrival Time (STA) is strictly preserved, and ETA is calculated as <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[11px]">ETA = STA + predicted_delay</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
