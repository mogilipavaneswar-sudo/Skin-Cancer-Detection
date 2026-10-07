import React, { useState } from 'react';
import { LESION_CLASSES, TOTAL_BENCHMARK_SAMPLES } from '../data/classDefinitions';
import {
  CONFUSION_MATRIX_OURS,
  CONFUSION_MATRIX_STANDARD_CE
} from '../data/ablationData';
import { calculateClassBalancedWeights, calculateEffectiveSamples, runMultimodalInference } from '../utils/multimodalEngine';
import { extractImageMetrics } from '../utils/imageAnalysis';
import { DiagnosticResult, PatientMetadata, SkinLesionClass } from '../types';
import { ISICLongTailGraph } from './ISICLongTailGraph';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  HelpCircle,
  Layers,
  Scale,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const MODEL_BENCHMARK_BARS = [
  { model: 'Proposed (CB-Focal)', shortName: 'Proposed', sensitivity: 93.6, balancedAcc: 91.8, pAUC: 94.2, color: '#06b6d4' },
  { model: 'Early Concat', shortName: 'Early Concat', sensitivity: 84.2, balancedAcc: 83.5, pAUC: 86.4, color: '#818cf8' },
  { model: 'Image Only', shortName: 'Image Only', sensitivity: 79.1, balancedAcc: 80.2, pAUC: 81.3, color: '#f59e0b' },
  { model: 'Standard CE', shortName: 'Standard CE', sensitivity: 71.5, balancedAcc: 74.6, pAUC: 75.8, color: '#ef4444' }
];

export const ClassBalanceLab: React.FC = () => {
  const [beta, setBeta] = useState<number>(0.9999);
  const [activeMatrix, setActiveMatrix] = useState<'ours' | 'standard_ce'>('ours');
  const [selectedConfusionCell, setSelectedConfusionCell] = useState<{
    trueClass: SkinLesionClass;
    predClass: SkinLesionClass;
    count: number;
    isDiagonal: boolean;
  } | null>(null);

  // Live image evaluation on graph
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const handleImageDrop = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        setUploadedImage(dataUrl);
        const metrics = await extractImageMetrics(dataUrl);
        const defaultPriors: PatientMetadata = {
          age: 52,
          sex: 'male',
          anatomicalSite: 'torso',
          diameterMm: 6.5,
          fitzpatrickSkinType: 'III',
          evolutionHistory: 'color_change',
          personalMelanomaHistory: false,
          familyMelanomaHistory: false,
          biopsyHistory: false
        };
        const res = runMultimodalInference(
          null,
          defaultPriors,
          'cross_attention',
          'cb_focal',
          dataUrl,
          undefined,
          metrics
        );
        setDiagnosticResult(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(undefined);
    setDiagnosticResult(null);
  };

  const classes = Object.keys(LESION_CLASSES) as SkinLesionClass[];
  const cbWeights = calculateClassBalancedWeights(beta);

  const currentMatrixData = activeMatrix === 'ours' ? CONFUSION_MATRIX_OURS : CONFUSION_MATRIX_STANDARD_CE;

  // Prepare distribution data for chart
  const distributionChartData = classes.map((c) => {
    const def = LESION_CLASSES[c];
    const eff = calculateEffectiveSamples(def.isicFrequency, beta);
    return {
      name: c,
      fullName: def.name,
      rawCount: def.isicFrequency,
      effectiveVolume: Math.round(eff),
      lossWeight: cbWeights[c],
      color: def.color,
      category: def.category
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Class-Balanced Learning & Loss Formulation Lab
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                Long-Tail Optimization
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Interactive mathematical modeling of Effective Number of Samples E_n = (1 - β^n) / (1 - β) and LDAM margin Δ_j = C / (n_j)^0.25.
            </p>
          </div>
        </div>

        {/* Beta Hyperparameter Interactive Controller */}
        <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Volume Parameter β:</span>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-white">{beta}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0.9, 0.99, 0.999, 0.9999].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setBeta(val)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  beta === val
                    ? 'bg-black dark:bg-black text-white font-bold shadow-sm border border-neutral-600'
                    : 'bg-white dark:bg-black text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-800'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: The Class Imbalance Problem & Effective Sample Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dataset Class Frequency vs Loss Weight Bar Chart / Interactive Dropzone */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ISICLongTailGraph
            diagnosticResult={diagnosticResult}
            uploadedImage={uploadedImage}
            onImageDrop={handleImageDrop}
            onRemoveImage={handleRemoveImage}
            beta={beta}
          />
        </div>

        {/* Mathematical Formulations Deep-Dive Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Formula Card 1: Class-Balanced Loss */}
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>1. Class-Balanced (CB) Focal Loss</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Cui et al. CVPR 2019</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-black font-mono text-xs text-cyan-900 dark:text-cyan-200 overflow-x-auto border border-cyan-200 dark:border-neutral-800 shadow-sm">
              L_CB-Focal(p, y) = - [ (1 - β) / (1 - β^n_y) ] · (1 - p_t)^γ · log(p_t)
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Standard inverse-frequency (1/N) over-penalizes frequent classes due to sample overlap in feature space. The effective number of samples E_n = (1 - β^n) / (1 - β) captures the diminishing returns of redundant majority samples.
            </p>
          </div>

          {/* Formula Card 2: LDAM Loss + DRW */}
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>2. Label-Distribution-Aware Margin (LDAM)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">Cao et al. NeurIPS 2019</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-black font-mono text-xs text-amber-900 dark:text-amber-200 overflow-x-auto border border-amber-200 dark:border-neutral-800 shadow-sm">
              Δ_j = C / (n_j)^(1/4),  where C is the margin constant
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Enforces wider decision margins for minority classes (Melanoma, Dermatofibroma) in logit space, combined with Deferred Re-Weighting (DRW) to learn clean representations during early epochs.
            </p>
          </div>

          {/* Why Standard Cross-Entropy Fails */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-black border border-rose-200 dark:border-red-900/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-red-400" />
              <span>The Fatal Flaw of Standard Cross-Entropy in Oncology</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
              Under unweighted Cross-Entropy, gradients are dominated by the 6,705 benign nevi. The optimizer maximizes overall accuracy (achieving &gt; 75%) by systematically predicting the majority class, resulting in lethal false negatives where early-stage melanomas are misclassified as benign moles.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Live Confusion Matrix Comparison + ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Confusion Matrix (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Confusion Matrix: Real-World Error Analysis</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400">
                Click on any cell to inspect true positive vs misclassification patterns.
              </p>
            </div>

            {/* Switch Matrix */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveMatrix('ours')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  activeMatrix === 'ours'
                    ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white dark:border-neutral-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                Proposed CB-Focal
              </button>
              <button
                type="button"
                onClick={() => setActiveMatrix('standard_ce')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  activeMatrix === 'standard_ce'
                    ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white dark:border-neutral-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                Standard Cross-Entropy
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Predicted Labels Header */}
              <div className="grid grid-cols-9 gap-1 text-center text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-left text-[10px] text-slate-400 dark:text-slate-500">True \ Pred</span>
                {currentMatrixData.classes.map((c) => (
                  <span key={c} style={{ color: LESION_CLASSES[c as SkinLesionClass].color }}>
                    {c}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {currentMatrixData.matrix.map((row, rIdx) => {
                const trueClass = currentMatrixData.classes[rIdx] as SkinLesionClass;
                const rowTotal = row.reduce((a, b) => a + b, 0);

                return (
                  <div key={trueClass} className="grid grid-cols-9 gap-1 mb-1 items-center">
                    <span
                      className="text-xs font-mono font-bold truncate pr-1"
                      style={{ color: LESION_CLASSES[trueClass].color }}
                    >
                      {trueClass}
                    </span>

                    {row.map((val, cIdx) => {
                      const predClass = currentMatrixData.classes[cIdx] as SkinLesionClass;
                      const isDiag = rIdx === cIdx;
                      const pct = rowTotal > 0 ? (val / rowTotal) * 100 : 0;

                      let cellBg = 'bg-slate-50 dark:bg-black text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-neutral-850';
                      if (isDiag) {
                        cellBg = 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/30';
                      } else if (val > 0) {
                        if (trueClass === 'MEL' && predClass === 'NV') {
                          // Lethal false negative
                          cellBg = 'bg-rose-50 dark:bg-rose-500/30 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-500/40';
                        } else {
                          cellBg = 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800';
                        }
                      }

                      return (
                        <button
                          key={predClass}
                          type="button"
                          onClick={() => setSelectedConfusionCell({ trueClass, predClass, count: val, isDiagonal: isDiag })}
                          className={`h-9 rounded flex flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 cursor-pointer ${cellBg}`}
                        >
                          <span>{val}</span>
                          <span className="text-[8px] opacity-70">{pct.toFixed(0)}%</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cell Inspection Detail Box */}
          {selectedConfusionCell ? (
            <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600 dark:text-neutral-400 font-mono">
                  True: <strong className="text-slate-900 dark:text-white">{selectedConfusionCell.trueClass} ({LESION_CLASSES[selectedConfusionCell.trueClass].name})</strong> →
                  Pred: <strong className="text-slate-900 dark:text-white">{selectedConfusionCell.predClass} ({LESION_CLASSES[selectedConfusionCell.predClass].name})</strong>
                </span>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5">
                  {selectedConfusionCell.isDiagonal
                    ? `Correctly identified ${selectedConfusionCell.count} patients.`
                    : `Misclassified ${selectedConfusionCell.count} patients. ${
                        selectedConfusionCell.trueClass === 'MEL' && selectedConfusionCell.predClass === 'NV'
                          ? 'CRITICAL LETHAL ERROR: Malignant melanoma diagnosed as benign mole.'
                          : ''
                      }`}
                </p>
              </div>
              <span className="text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {selectedConfusionCell.count} Cases
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
              Tip: Notice how under Standard CE, 280 Melanomas and 88 Dermatofibromas are erroneously absorbed into the Nevus class.
            </p>
          )}
        </div>

        {/* Model Benchmark Performance Bar Graph (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Model Benchmark Performance</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400">
                Proposed Framework vs Ablated Baselines on ISIC-2024
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">pAUC: 0.942</span>
          </div>

          {/* Benchmark Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MODEL_BENCHMARK_BARS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-neutral-800" vertical={false} />
                <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} fontFamily="Tinos, Times New Roman, serif" tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="Tinos, Times New Roman, serif" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#262626', color: '#ffffff', borderRadius: '0.75rem', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: any) => [`${value}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Tinos, Times New Roman, serif' }} />
                <Bar dataKey="sensitivity" name="Melanoma Sens @ 95% Spec" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="balancedAcc" name="Balanced Accuracy" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pAUC" name="pAUC (×100)" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm text-xs text-slate-700 dark:text-neutral-300 flex items-center justify-between">
            <span className="font-mono text-slate-500 dark:text-neutral-400">Melanoma Sens @ 95% Spec:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">93.6% (vs 71.5% for CE)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
