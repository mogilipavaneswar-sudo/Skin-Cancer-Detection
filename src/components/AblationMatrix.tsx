import React, { useState } from 'react';
import { ABLATION_STUDY_DATA, ModelAblationResult } from '../data/ablationData';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Filter,
  Layers,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';

export const AblationMatrix: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedResultId, setSelectedResultId] = useState<string>('ours-full');

  const filteredData = filterCategory === 'All'
    ? ABLATION_STUDY_DATA
    : ABLATION_STUDY_DATA.filter((d) => d.category === filterCategory);

  const selectedResult = ABLATION_STUDY_DATA.find((d) => d.id === selectedResultId) || ABLATION_STUDY_DATA[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Empirical Ablation Study & Benchmark Leaderboard
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                ISIC-2024 Evaluation
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Rigorous comparative performance evaluation across fusion paradigms, loss formulations, and unimodal baselines.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800 text-xs font-mono">
          {['All', 'Fusion Paradigm', 'Loss Formulation', 'Baseline Single Modality'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white font-bold dark:border-neutral-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ablation Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <th className="pb-3 font-semibold">Model Configuration</th>
                <th className="pb-3 font-semibold">Fusion Mode</th>
                <th className="pb-3 font-semibold">Optimization Loss</th>
                <th className="pb-3 font-semibold text-right">Balanced Acc</th>
                <th className="pb-3 font-semibold text-right">Macro F1</th>
                <th className="pb-3 font-semibold text-right">Melanoma Sens @ 95% Spec</th>
                <th className="pb-3 font-semibold text-right">Rare DF Recall</th>
                <th className="pb-3 font-semibold text-right">pAUC</th>
                <th className="pb-3 font-semibold text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 font-mono text-xs">
              {filteredData.map((row) => {
                const isSelected = selectedResultId === row.id;
                const isOurs = row.id === 'ours-full';

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedResultId(row.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-black text-cyan-950 dark:text-white font-medium border-l-2 border-l-cyan-500 dark:border-l-white'
                        : isOurs
                        ? 'bg-cyan-50/60 dark:bg-black text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-900'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <td className="py-3 font-sans font-bold">
                      <span>{row.name}</span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{row.fusionMode}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{row.lossFunction}</td>
                    <td className={`py-3 text-right font-bold ${isOurs ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {row.balancedAccuracy}%
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">{row.macroF1}%</td>
                    <td className={`py-3 text-right font-bold ${row.melanomaSensitivity95Spec > 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {row.melanomaSensitivity95Spec}%
                    </td>
                    <td className={`py-3 text-right ${row.rareClassRecallDF < 50 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {row.rareClassRecallDF}%
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300">{row.pAUC}</td>
                    <td className="py-3 text-right text-slate-500 dark:text-slate-400">{row.inferenceLatencyMs}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Insight Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Selected Configuration Inspector
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {selectedResult.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {selectedResult.description}
          </p>
        </div>

        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex flex-col gap-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key Diagnostic Advantage</span>
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-snug">{selectedResult.keyAdvantage}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex flex-col gap-1">
            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Computational / Algorithmic Trade-off</span>
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-snug">{selectedResult.keyLimitation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
