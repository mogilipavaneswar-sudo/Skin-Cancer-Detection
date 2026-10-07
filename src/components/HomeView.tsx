import React from 'react';
import {
  Activity,
  Award,
  Cpu,
  Microscope
} from 'lucide-react';
import { TabType } from '../types';
import { LESION_CLASSES } from '../data/classDefinitions';

interface HomeViewProps {
  onNavigate: (tab: TabType) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const lesionList = Object.values(LESION_CLASSES);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Hero Welcome Banner - Clean & Pristine (Pure White in Light, Pure Black in Dark) */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-white dark:bg-black dark:border-white/40 text-xs font-mono font-semibold w-fit">
              <Activity className="w-3.5 h-3.5 text-cyan-500 dark:text-white" />
              <span>Multimodal Deep Learning in Onco-Dermatology</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
              DermaScan
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Addressing severe class imbalance and morphological variability in skin cancer triage with 
              bidirectional cross-attention fusion between high-resolution dermoscopic imaging (Swin-T) 
              and patient clinical metadata (FT-Transformer).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="home-launch-workbench-btn"
                onClick={() => onNavigate('workbench')}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-700 font-bold text-xs font-mono flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-600 dark:text-white" />
                <span>Launch Diagnostic Workbench</span>
              </button>

              <button
                type="button"
                id="home-view-architecture-btn"
                onClick={() => onNavigate('architecture')}
                className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-black dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/40 dark:hover:border-white dark:hover:shadow-[0_0_14px_rgba(255,255,255,0.5)] text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-blue-600 dark:text-white" />
                <span>Dual-Stream Pipeline</span>
              </button>

              <button
                type="button"
                id="home-view-ablation-btn"
                onClick={() => onNavigate('ablation')}
                className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-black dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/40 dark:hover:border-white dark:hover:shadow-[0_0_14px_rgba(255,255,255,0.5)] text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-purple-600 dark:text-white" />
                <span>ISIC-2024 Benchmarks</span>
              </button>
            </div>
          </div>

          {/* Key Metric Highlight Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 lg:w-80">
            <div className="p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Melanoma Sens @ 95% Spec</span>
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">93.6%</span>
              <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">+22.1% vs Standard CE</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">High-Spec pAUC</span>
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">0.942</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">ISIC-2024 Evaluation</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Balanced Accuracy</span>
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">90.8%</span>
              <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">Across 8 Lesion Classes</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Fusion Latency</span>
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">42 ms</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">Real-time Clinical Triage</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Diagnostic Lesion Classes Overview - 2 Columns and 4 Rows */}
      <div className="p-6 rounded-3xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Target Diagnostic Classes (ISIC Spectrum)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            8 Histopathologic Categories (2 Columns × 4 Rows)
          </span>
        </div>

        {/* Exactly 2 Columns and 4 Rows (8 items total) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lesionList.map((lesion) => (
            <div
              key={lesion.code}
              className="p-4 rounded-2xl bg-white hover:bg-neutral-50/60 dark:bg-black dark:hover:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white">{lesion.code}</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{lesion.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${lesion.bgBadge}`}>
                  {lesion.category}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {lesion.clinicalDescription}
              </p>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span>Dataset Representation:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{lesion.isicFrequency} cases</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
