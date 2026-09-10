import React from 'react';
import { Award, BarChart3, TrendingUp, Cpu, FileText, CheckCircle2 } from 'lucide-react';

export default function AnalyticsView({ metrics }) {
  if (!metrics || metrics.error) {
    return (
      <div className="p-12 text-center text-rail-muted bg-rail-card rounded-xl border border-rail-border">
        Loading ML evaluation benchmarks...
      </div>
    );
  }

  const { baseline, ml_model, bin_labels, feature_importance, sample_count, test_count } = metrics;

  return (
    <div className="space-y-6">

      {/* Top Academic Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: MAE Comparison */}
        <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-rail-muted uppercase font-semibold">
            <span>Mean Absolute Error (MAE)</span>
            <Award className="w-4 h-4 text-rail-accent" />
          </div>
          <div className="flex items-baseline space-x-3 pt-1">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {ml_model.mae_minutes} min
            </span>
            <span className="text-sm font-mono text-rose-400/80 line-through">
              {baseline.mae_minutes} min
            </span>
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{ml_model.accuracy_gain_pct}% Error Reduction over NTES</span>
          </div>
        </div>

        {/* Card 2: RMSE */}
        <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-rail-muted uppercase font-semibold">
            <span>Root Mean Squared Error (RMSE)</span>
            <BarChart3 className="w-4 h-4 text-rail-accent" />
          </div>
          <div className="flex items-baseline space-x-3 pt-1">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {ml_model.rmse_minutes} min
            </span>
            <span className="text-sm font-mono text-rose-400/80 line-through">
              {baseline.rmse_minutes} min
            </span>
          </div>
          <p className="text-xs text-rail-muted">
            Measures outlier penalization under cascading delays.
          </p>
        </div>

        {/* Card 3: R2 Score */}
        <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-rail-muted uppercase font-semibold">
            <span>Model Variance Explained (R²)</span>
            <Cpu className="w-4 h-4 text-rail-accent" />
          </div>
          <div className="flex items-baseline space-x-3 pt-1">
            <span className="text-3xl font-extrabold font-mono text-sky-400">
              {ml_model.r2_score}
            </span>
            <span className="text-sm font-mono text-slate-500">/ 1.00</span>
          </div>
          <p className="text-xs text-rail-muted">
            Trained on {sample_count.toLocaleString()} corridor trip runs ({test_count.toLocaleString()} validation tests).
          </p>
        </div>

      </div>

      {/* Prediction Error Distribution Chart */}
      <div className="p-6 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rail-border">
          <div>
            <h4 className="font-bold text-base text-white">Prediction Error Distribution (Histogram)</h4>
            <p className="text-xs text-rail-muted">
              Compares error spread of traditional NTES baseline vs. our Dynamic ML Regressor.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="text-slate-200">Our ML Model</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/60"></span>
              <span className="text-slate-400">Static NTES</span>
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {bin_labels.map((label, idx) => {
            const mlCount = ml_model.histogram[idx] || 0;
            const baseCount = baseline.histogram[idx] || 0;
            const maxVal = Math.max(...ml_model.histogram, ...baseline.histogram, 1);

            const mlWidthPct = Math.round((mlCount / maxVal) * 100);
            const baseWidthPct = Math.round((baseCount / maxVal) * 100);

            const isAccurateBin = label.includes('Accurate');

            return (
              <div key={label} className={`p-2.5 rounded-lg border ${isAccurateBin ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rail-bg/50 border-rail-border'}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-mono font-semibold ${isAccurateBin ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {label} {isAccurateBin && '🎯 (Target Zone)'}
                  </span>
                  <div className="space-x-3 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">{mlCount} tests</span>
                    <span className="text-slate-400">NTES: {baseCount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* ML Model Bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${mlWidthPct}%` }}
                    />
                  </div>
                  {/* NTES Bar */}
                  <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-rose-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${baseWidthPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Importance / Delay Attribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 p-6 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-4">
          <div className="pb-3 border-b border-rail-border">
            <h4 className="font-bold text-base text-white">Feature Importance (Delay Drivers)</h4>
            <p className="text-xs text-rail-muted">
              Calculated via tree-based Gini impurity & Mean Decrease in Impurity (MDI).
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(feature_importance)
              .sort((a, b) => b[1] - a[1])
              .map(([key, val]) => {
                const labelMap = {
                  section_occupancy_ratio: '1. Track Section Congestion (Capacity Utilization)',
                  distance_remaining_km: '2. Distance Remaining to Target Station',
                  weather_fog_index: '3. Weather Visibility / Winter Fog Index',
                  current_delay_min: '4. Accumulated Delay Carried Forward',
                  priority_tier: '5. Train Signaling Priority Class',
                  is_junction_ahead: '6. Major Railway Junction Bottleneck Ahead',
                  headway_km: '7. Distance Headway Behind Preceding Train'
                };

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{labelMap[key] || key}</span>
                      <span className="font-mono font-bold text-sky-400">{val}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                        style={{ width: `${val * 3}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Project Report Viva Notes Card */}
        <div className="lg:col-span-5 p-6 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-rail-border">
              <FileText className="w-4 h-4 text-rail-accent" />
              <h4 className="font-bold text-base text-white">Viva Talking Points for Project Report</h4>
            </div>

            <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Benchmark Baseline:</strong> Evaluated against Indian Railways' current NTES practice (static timetable + current delay).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Key Finding:</strong> Section congestion (25.8%) and fog (20.6%) account for nearly half of all cascading arrival deviations.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Operational Benefit:</strong> Allows station controllers to preemptively detect platform schedule clashes at major junctions like Kanpur Central.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-rail-border">
            <div className="p-3 bg-rail-bg rounded-lg border border-rail-border text-center">
              <span className="text-xs text-rail-muted block">Ready for inclusion in</span>
              <span className="text-xs font-bold text-white font-mono">B.Tech Final Year Thesis / SIH PPT</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
