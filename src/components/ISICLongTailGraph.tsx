import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Upload,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Layers,
  Info,
  CheckCircle2,
  FileImage,
  X
} from 'lucide-react';
import { DiagnosticResult, SkinLesionClass } from '../types';
import { LESION_CLASSES, TOTAL_BENCHMARK_SAMPLES } from '../data/classDefinitions';
import { calculateClassBalancedWeights, calculateEffectiveSamples } from '../utils/multimodalEngine';

export interface ISICLongTailGraphProps {
  diagnosticResult?: DiagnosticResult | null;
  uploadedImage?: string;
  onImageDrop?: (file: File) => void;
  onRemoveImage?: () => void;
  beta?: number;
  compact?: boolean;
  className?: string;
}

export const ISICLongTailGraph: React.FC<ISICLongTailGraphProps> = ({
  diagnosticResult,
  uploadedImage,
  onImageDrop,
  onRemoveImage,
  beta = 0.9999,
  compact = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'probabilities' | 'benchmark'>('combined');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SkinLesionClass | null>(null);

  // The 8 classes ordered along the authentic ISIC benchmark long-tail distribution (from majority to extreme tail)
  const orderedClasses: SkinLesionClass[] = useMemo(() => {
    return (Object.keys(LESION_CLASSES) as SkinLesionClass[]).sort(
      (a, b) => LESION_CLASSES[b].isicFrequency - LESION_CLASSES[a].isicFrequency
    );
  }, []);

  const cbWeights = useMemo(() => calculateClassBalancedWeights(beta), [beta]);

  // Formulate data for chart
  const chartData = useMemo(() => {
    return orderedClasses.map((c) => {
      const def = LESION_CLASSES[c];
      const eff = calculateEffectiveSamples(def.isicFrequency, beta);
      const prob = diagnosticResult ? diagnosticResult.classProbabilities[c] || 0 : 0;
      const isTopPred = diagnosticResult?.predictedClass === c;
      const prevalencePct = Number(((def.isicFrequency / TOTAL_BENCHMARK_SAMPLES) * 100).toFixed(1));

      return {
        classCode: c,
        name: c,
        fullName: def.name,
        rawCount: def.isicFrequency,
        prevalence: prevalencePct,
        effectiveVolume: Math.round(eff),
        cbWeight: cbWeights[c],
        color: def.color,
        category: def.category,
        resultProb: prob,
        isTopPred,
        // formatted values for tooltip
        samplesLabel: `${def.isicFrequency.toLocaleString()} cases`,
        probLabel: `${prob.toFixed(1)}%`
      };
    });
  }, [orderedClasses, diagnosticResult, beta, cbWeights]);

  const topClass = diagnosticResult?.predictedClass;
  const topClassDef = topClass ? LESION_CLASSES[topClass] : null;
  const isMalignant = topClassDef && (topClassDef.category === 'Malignant' || topClassDef.category === 'Premalignant');

  // Drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && onImageDrop) {
      onImageDrop(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageDrop) {
      onImageDrop(file);
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl bg-white dark:bg-black border transition-all duration-300 flex flex-col gap-4 p-4 sm:p-5 ${
        isDragOver
          ? 'border-cyan-400 bg-cyan-50 dark:bg-black ring-2 ring-cyan-400/50 shadow-xl'
          : 'border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-xl'
      } ${className}`}
    >
      {/* Drag Over Active Modal Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-white/95 dark:bg-black/95 backdrop-blur-sm border-2 border-dashed border-cyan-500 dark:border-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 pointer-events-none">
          <div className="p-3.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-white border border-cyan-400/40 mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Drop Skin Lesion Image Here</h4>
          <p className="text-xs text-cyan-700 dark:text-neutral-300 mt-1 max-w-sm">
            Evaluating dual-stream feature extraction and plotting diagnostic result directly onto the ISIC Benchmark Long-Tail Class Imbalance curve.
          </p>
        </div>
      )}

      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>ISIC Benchmark Long-Tail Class Imbalance</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-black text-slate-700 dark:text-white border border-slate-200 dark:border-neutral-800">
                N = {TOTAL_BENCHMARK_SAMPLES.toLocaleString()} Cases
              </span>
              {diagnosticResult && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40">
                  <TrendingUp className="w-3 h-3" />
                  <span>Result Plotted</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Melanocytic Nevus (NV) dominates at 67.05%, while rare malignant Melanoma (MEL) and DF represent the long tail.
              {diagnosticResult ? ' The purple line and highlighted bar trace the current image prediction.' : ' Drop a lesion image to plot classification on the graph.'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-neutral-800 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white font-bold dark:border-neutral-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="Dual-axis: Benchmark Training Frequency + Dropped Image Result %"
          >
            Combined Dual-Axis
          </button>
          <button
            type="button"
            onClick={() => setViewMode('probabilities')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
              viewMode === 'probabilities'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white font-bold dark:border-neutral-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="Dropped Lesion Posterior Probabilities along Long-Tail Spectrum"
          >
            Prediction Result (%)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('benchmark')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
              viewMode === 'benchmark'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs dark:bg-black dark:text-white font-bold dark:border-neutral-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="ISIC Benchmark Dataset Distribution (N=10,000)"
          >
            ISIC Counts (n)
          </button>
        </div>
      </div>

      {/* Dynamic Active Dropped Lesion Outcome Callout Banner */}
      {diagnosticResult && topClassDef ? (
        <div className="p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all bg-red-50/80 dark:bg-black border-red-200 dark:border-red-500/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border shrink-0 bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dropped Lesion Classified
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded border ${topClassDef.bgBadge} ${topClassDef.borderBadge}`}>
                  {topClassDef.category}
                </span>
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold">
                  [{topClass}] {topClassDef.name}
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                <span>{topClassDef.fullName}</span>
                <span className="text-red-600 dark:text-red-400 font-mono font-bold">
                  {diagnosticResult.classProbabilities[topClass]}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto text-xs font-mono">
            <div className="text-right">
              <div className="text-slate-500 dark:text-slate-400 text-[10px]">Benchmark Imbalance Status:</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">
                {topClass === 'NV'
                  ? 'Head Class (67.1% of ISIC)'
                  : topClass === 'DF' || topClass === 'SCC' || topClass === 'VASC'
                  ? 'Extreme Long-Tail (<1.5% of ISIC)'
                  : 'Minority Tail (11% of ISIC)'}
              </div>
            </div>
            {uploadedImage && onRemoveImage && (
              <button
                type="button"
                onClick={onRemoveImage}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-black dark:hover:bg-neutral-900 text-slate-700 dark:text-white border border-slate-300 dark:border-neutral-800 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear dropped image"
              >
                <X className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Standby Hint & Quick Drop Invitation */
        <div className="p-3 rounded-xl bg-white dark:bg-black border border-dashed border-slate-300 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Upload className="w-4 h-4 text-cyan-600 dark:text-white shrink-0 animate-pulse" />
            <span>
              <strong>Drop your lesion photograph here</strong> to plot real-time dual-stream probability on top of the ISIC Long-Tail distribution.
            </span>
          </div>
          {onImageDrop && (
            <label className="cursor-pointer shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-700 text-xs font-mono font-semibold transition-all">
              <span>Select File</span>
              <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </label>
          )}
        </div>
      )}

      {/* Main Recharts Visualizer */}
      <div className={`w-full ${compact ? 'h-64' : 'h-72 sm:h-80'} select-none`}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'combined' ? (
            <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="classCode"
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="Times New Roman, Times, serif"
                tickLine={false}
              />
              {/* Left Y-Axis for Sample Counts */}
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={10}
                fontFamily="Times New Roman, Times, serif"
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                tickLine={false}
                axisLine={false}
              />
              {/* Right Y-Axis for Predicted Posterior Probabilities */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#38bdf8"
                fontSize={10}
                fontFamily="Times New Roman, Times, serif"
                domain={[0, 100]}
                unit="%"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-mono flex flex-col gap-1.5 z-50">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-white text-sm" style={{ color: data.color }}>
                            [{data.classCode}] {data.fullName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/40 font-bold">
                            {data.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1">
                          <span className="text-slate-400">ISIC Benchmark Count:</span>
                          <span className="font-bold text-slate-200 text-right">{data.rawCount.toLocaleString()} ({data.prevalence}%)</span>
                          
                          <span className="text-slate-400">Effective Volume (E_n):</span>
                          <span className="font-bold text-cyan-300 text-right">{data.effectiveVolume.toLocaleString()}</span>

                          <span className="text-slate-400">Class-Balanced Weight:</span>
                          <span className="font-bold text-amber-400 text-right">{data.cbWeight}x</span>

                          {diagnosticResult && (
                            <>
                              <span className="text-cyan-400 font-bold border-t border-slate-800 pt-1">
                                Dropped Image Result:
                              </span>
                              <span className="font-extrabold text-cyan-300 text-right border-t border-slate-800 pt-1 text-sm">
                                {data.resultProb.toFixed(1)}% {data.isTopPred ? '🎯' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'Times New Roman, Times, serif' }}
              />
              {/* Benchmark sample count bars */}
              <Bar
                yAxisId="left"
                dataKey="rawCount"
                name="ISIC Benchmark Frequency (n_i)"
                radius={[4, 4, 0, 0]}
                barSize={28}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.classCode}`}
                    fill={entry.color}
                    opacity={entry.isTopPred ? 1 : 0.65}
                    stroke={entry.isTopPred ? '#ffffff' : entry.color}
                    strokeWidth={entry.isTopPred ? 2.5 : 1}
                  />
                ))}
              </Bar>
              {/* Dropped image result line overlaid */}
              {diagnosticResult && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="resultProb"
                  name="Dropped Image Result (% Prob)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          ) : viewMode === 'probabilities' ? (
            /* Probability view across long-tail spectrum */
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="classCode" stroke="#94a3b8" fontSize={11} fontFamily="Times New Roman, Times, serif" tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} fontFamily="Times New Roman, Times, serif" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Probability']}
                labelStyle={{ color: '#38bdf8', fontWeight: 'normal' }}
              />
              <Bar dataKey="resultProb" name="Lesion Probability (%)" radius={[5, 5, 0, 0]} barSize={32}>
                {chartData.map((entry) => (
                  <Cell
                    key={`prob-cell-${entry.classCode}`}
                    fill={entry.color}
                    stroke={entry.isTopPred ? '#ffffff' : 'transparent'}
                    strokeWidth={entry.isTopPred ? 2.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            /* Benchmark count view */
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="classCode" stroke="#94a3b8" fontSize={11} fontFamily="Times New Roman, Times, serif" tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} fontFamily="Times New Roman, Times, serif" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                labelStyle={{ color: '#38bdf8', fontWeight: 'normal' }}
              />
              <Bar dataKey="rawCount" name="Sample Count (n_i)" radius={[5, 5, 0, 0]} barSize={32}>
                {chartData.map((entry) => (
                  <Cell
                    key={`bench-cell-${entry.classCode}`}
                    fill={entry.color}
                    stroke={entry.isTopPred ? '#38bdf8' : 'transparent'}
                    strokeWidth={entry.isTopPred ? 2.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Class Statistics Pill Grid / Interactive Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 border-t border-slate-200 dark:border-neutral-800">
        {chartData.map((item) => {
          const isSelected = selectedClass === item.classCode;
          const isTop = item.isTopPred;
          return (
            <button
              key={item.classCode}
              type="button"
              onClick={() => setSelectedClass(isSelected ? null : item.classCode)}
              className={`p-2 rounded-xl text-left transition-all border flex flex-col gap-1 cursor-pointer ${
                isTop
                  ? 'bg-cyan-50 dark:bg-black border-cyan-400 dark:border-white text-cyan-950 dark:text-white shadow-sm ring-1 ring-cyan-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : isSelected
                  ? 'bg-slate-100 dark:bg-black border-slate-400 dark:border-white text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-900 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold" style={{ color: item.color }}>
                  {item.classCode}
                </span>
                {isTop && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-white animate-white-beacon shadow-[0_0_8px_#ffffff]"></span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                {item.fullName}
              </div>
              <div className="flex items-baseline justify-between pt-0.5 text-[10px] font-mono border-t border-slate-200 dark:border-neutral-800">
                <span className="text-slate-500">{item.prevalence}%</span>
                <span className={`font-bold ${isTop ? 'text-cyan-700 dark:text-white' : 'text-slate-800 dark:text-slate-300'}`}>
                  {diagnosticResult ? `${item.resultProb.toFixed(1)}%` : `${item.rawCount}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Class Clinical Explainer (Accordion / Drawer) */}
      {selectedClass && (
        <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: LESION_CLASSES[selectedClass].color }}
            ></div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">[{selectedClass}] {LESION_CLASSES[selectedClass].name}</span>
              <span className="text-red-600 dark:text-red-400 ml-1.5 font-mono text-[11px] font-bold">
                ({LESION_CLASSES[selectedClass].category})
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-mono text-[11px]">
                • ISIC Benchmark: {LESION_CLASSES[selectedClass].isicFrequency} cases (
                {((LESION_CLASSES[selectedClass].isicFrequency / TOTAL_BENCHMARK_SAMPLES) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
            <span>Effective Vol E_n: <strong className="text-cyan-700 dark:text-white">{Math.round(calculateEffectiveSamples(LESION_CLASSES[selectedClass].isicFrequency, beta))}</strong></span>
            <span>Loss Weight: <strong className="text-amber-600 dark:text-amber-400">{cbWeights[selectedClass].toFixed(3)}x</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
