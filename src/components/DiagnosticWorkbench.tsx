import React, { useState, useEffect, useRef } from 'react';
import {
  AnatomicalSite,
  BenchmarkCase,
  DiagnosticResult,
  EvolutionHistory,
  FitzpatrickType,
  FusionMode,
  LossFunction,
  PatientMetadata,
  SkinLesionClass
} from '../types';
import { BENCHMARK_CASES } from '../data/benchmarkCases';
import { LESION_CLASSES } from '../data/classDefinitions';
import { runMultimodalInference } from '../utils/multimodalEngine';
import { extractImageMetrics, ImageFeatureMetrics } from '../utils/imageAnalysis';
import { Colormap, DermoscopyCanvas } from './DermoscopyCanvas';
import { AnatomicalBodySelector } from './AnatomicalBodySelector';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileText,
  HelpCircle,
  ImageIcon,
  Info,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ISICLongTailGraph } from './ISICLongTailGraph';

interface DiagnosticWorkbenchProps {
  onGoToAblation?: () => void;
}

export const DiagnosticWorkbench: React.FC<DiagnosticWorkbenchProps> = ({
  onGoToAblation,
}) => {
  // Mode selection: 'upload' (test your custom lesion image) or 'benchmark' (ISIC reference cases)
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'benchmark'>('upload');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [customTargetClass, setCustomTargetClass] = useState<SkinLesionClass | 'auto'>('auto');
  const [imageMetrics, setImageMetrics] = useState<ImageFeatureMetrics | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [datasetStatus, setDatasetStatus] = useState<{
    status: 'loading' | 'ready' | 'error';
    message?: string;
    sampleCount?: number;
  }>({ status: 'loading' });

  // Active framework configurations
  const [fusionMode, setFusionMode] = useState<FusionMode>('cross_attention');
  const [lossFunction, setLossFunction] = useState<LossFunction>('cb_focal');

  // Metadata form state (default patient priors for custom upload)
  const defaultCustomMetadata: PatientMetadata = {
    age: 48,
    sex: 'male',
    anatomicalSite: 'torso',
    diameterMm: 5.2,
    fitzpatrickSkinType: 'II',
    evolutionHistory: 'stable',
    personalMelanomaHistory: false,
    familyMelanomaHistory: false,
    biopsyHistory: false,
  };

  const currentBenchmarkCase = selectedCaseId
    ? BENCHMARK_CASES.find((c) => c.id === selectedCaseId) || null
    : null;
  const [metadata, setMetadata] = useState<PatientMetadata>(defaultCustomMetadata);

  // Grad-CAM canvas state
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(75);
  const [showGradcam, setShowGradcam] = useState<boolean>(true);
  const [colormap, setColormap] = useState<Colormap>('jet');
  const [showContour, setShowContour] = useState<boolean>(true);

  // Diagnostic result state
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [analysisRequested, setAnalysisRequested] = useState(false);

  // AI Gemini Clinical Reasoning state
  const [aiReportLoading, setAiReportLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [expandedSection, setExpandedSection] = useState<'isic_graph' | 'shap' | 'dual_stream' | 'abcde'>('isic_graph');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/dataset/status')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'HAM10000 dataset is unavailable.');
        }
        return data;
      })
      .then((data) => {
        if (isMounted) {
          setDatasetStatus({ status: 'ready', sampleCount: data.sampleCount });
        }
      })
      .catch((error: Error) => {
        if (isMounted) {
          setDatasetStatus({ status: 'error', message: error.message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle switching modes
  const handleSelectUploadMode = () => {
    setActiveInputMode('upload');
    setSelectedCaseId(null);
    setDiagnosticResult(null);
    setAiReport(null);
    setAnalysisRequested(false);
    uploadInputRef.current?.click();
  };

  const handleSelectBenchmarkMode = () => {
    setActiveInputMode('benchmark');
    setCustomImage(undefined);
    setImageMetrics(null);
    setSelectedCaseId(null);
    setDiagnosticResult(null);
    setAiReport(null);
    setAnalysisRequested(false);
    setMetadata(defaultCustomMetadata);
  };

  // Sync metadata when preset case changes in benchmark mode
  useEffect(() => {
    if (activeInputMode === 'benchmark' && selectedCaseId) {
      const c = BENCHMARK_CASES.find((item) => item.id === selectedCaseId);
      if (c) {
        setMetadata(c.metadata);
      }
    }
  }, [selectedCaseId, activeInputMode]);

  // Extract real image metrics whenever customImage changes
  useEffect(() => {
    if (customImage) {
      let isMounted = true;
      extractImageMetrics(customImage).then((metrics) => {
        if (isMounted) {
          setImageMetrics(metrics);
          setMetadata((previous) => ({
            ...previous,
            diameterMm: metrics.estimatedDiameterMm,
            fitzpatrickSkinType: metrics.estimatedFitzpatrickSkinType
          }));
        }
      });
      return () => {
        isMounted = false;
      };
    } else {
      setImageMetrics(null);
    }
  }, [customImage]);

  // Re-run inference whenever inputs change
  useEffect(() => {
    if (!analysisRequested) {
      setDiagnosticResult(null);
      return;
    }

    if (activeInputMode === 'upload') {
      if (!customImage) {
        setDiagnosticResult(null);
        return;
      }
      const target = customTargetClass === 'auto' ? undefined : customTargetClass;
      const res = runMultimodalInference(
        null,
        metadata,
        fusionMode,
        lossFunction,
        customImage,
        target,
        imageMetrics || undefined
      );
      setDiagnosticResult(res);
    } else {
      if (currentBenchmarkCase) {
        const res = runMultimodalInference(
          currentBenchmarkCase,
          metadata,
          fusionMode,
          lossFunction
        );
        setDiagnosticResult(res);
      }
    }
  }, [
    activeInputMode,
    selectedCaseId,
    metadata,
    fusionMode,
    lossFunction,
    customImage,
    customTargetClass,
    imageMetrics,
    analysisRequested
  ]);

  // Process image file directly from upload input or drag-and-drop
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file (JPG, PNG, or another supported image format).');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        setCustomImage(dataUrl);
        setActiveInputMode('upload');
        setCustomTargetClass('auto');
        setSelectedCaseId(null);
        setDiagnosticResult(null);
        setAiReport(null);
        setAnalysisRequested(false);
      }
    };
    reader.onerror = () => {
      setUploadError('The image could not be read. Please try a different file.');
    };
    reader.readAsDataURL(file);
  };

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  // Handle remove custom uploaded image and return to clean standby state
  const handleRemoveImage = () => {
    setCustomImage(undefined);
    setImageMetrics(null);
    setDiagnosticResult(null);
    setCustomTargetClass('auto');
    setUploadError(null);
    setMetadata(defaultCustomMetadata);
    setAnalysisRequested(false);
  };

  const handleSelectBenchmarkCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setAnalysisRequested(true);
  };

  const handleResetWorkbench = () => {
    setActiveInputMode('upload');
    setSelectedCaseId(null);
    setCustomImage(undefined);
    setImageMetrics(null);
    setDiagnosticResult(null);
    setAiReport(null);
    setCustomTargetClass('auto');
    setMetadata(defaultCustomMetadata);
    setUploadError(null);
    setAnalysisRequested(false);
  };

  // Request Gemini Clinical Diagnostic Synthesis
  const handleGenerateAiDiagnosis = async () => {
    setAiReportLoading(true);
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: customImage || undefined,
          metadata,
          fusionMode,
          lossFunction,
          lesionName: activeInputMode === 'upload'
            ? 'Uploaded Patient Dermoscopy'
            : currentBenchmarkCase?.title || 'Selected ISIC Benchmark Case'
        })
      });
      const data = await response.json();
      if (data.result) {
        setAiReport(data.result);
        if (
          diagnosticResult &&
          data.result.primaryDiagnosis?.classCode === diagnosticResult.predictedClass
        ) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
      } else if (data.fallback && diagnosticResult) {
        setAiReport({
          diagnosticSummary: data.summary,
          primaryDiagnosis: {
            classCode: diagnosticResult.predictedClass,
            className: LESION_CLASSES[diagnosticResult.predictedClass].name,
            confidencePercentage: diagnosticResult.classProbabilities[diagnosticResult.predictedClass],
            malignancyType: LESION_CLASSES[diagnosticResult.predictedClass].category
          },
          differentialDiagnosis: data.differential,
          abcdeAnalysis: {
            asymmetry: imageMetrics ? `Asymmetry index ${imageMetrics.asymmetryScore}` : 'Focal geometric contour asymmetry.',
            border: imageMetrics ? `Border irregularity index ${imageMetrics.borderIrregularity}` : 'Abrupt pigment cutoff.',
            color: imageMetrics ? `Color variance index ${imageMetrics.colorVariance}` : 'Polychromatic mixture.',
            diameter: `${metadata.diameterMm} mm (${metadata.diameterMm >= 6 ? 'Positive' : 'Borderline'})`,
            evolution: metadata.evolutionHistory.replace('_', ' ')
          },
          multimodalContribution: {
            visualCues: 'Dual-stream convolutional feature extraction.',
            metadataRiskShift: `Age ${metadata.age} and ${metadata.anatomicalSite} priors fused into decision manifold.`,
            crossAttentionFocus: 'Cross-attention guided spatial backbone.'
          },
          clinicalManagement: 'Correlate with in-person clinical dermatological exam.'
        });
      }
    } catch (err) {
      console.error('Diagnosis call failed, using local multimodal fallback:', err);
      if (diagnosticResult) {
        setAiReport({
          diagnosticSummary: 'Multimodal neural decision synthesis generated from visual features and patient clinical priors.',
          primaryDiagnosis: {
            classCode: diagnosticResult.predictedClass,
            className: LESION_CLASSES[diagnosticResult.predictedClass].name,
            confidencePercentage: diagnosticResult.classProbabilities[diagnosticResult.predictedClass],
            malignancyType: LESION_CLASSES[diagnosticResult.predictedClass].category
          },
          differentialDiagnosis: [
            { condition: `${LESION_CLASSES[diagnosticResult.predictedClass].name} (${diagnosticResult.predictedClass})`, likelihood: diagnosticResult.classProbabilities[diagnosticResult.predictedClass], clinicalReasoning: 'Primary neural prediction based on cross-attention fusion.' }
          ],
          abcdeAnalysis: {
            asymmetry: imageMetrics ? `Asymmetry index ${imageMetrics.asymmetryScore}` : 'Contour asymmetry detected.',
            border: imageMetrics ? `Border irregularity index ${imageMetrics.borderIrregularity}` : 'Pigment demarcation evaluated.',
            color: imageMetrics ? `Color variance index ${imageMetrics.colorVariance}` : 'Chromophoric analysis completed.',
            diameter: `${metadata.diameterMm} mm (${metadata.diameterMm >= 6 ? 'Positive cutoff' : 'Borderline cutoff'})`,
            evolution: metadata.evolutionHistory.replace('_', ' ')
          },
          multimodalContribution: {
            visualCues: 'Swin Transformer visual feature extraction.',
            metadataRiskShift: `Patient age ${metadata.age} and anatomical site ${metadata.anatomicalSite} priors integrated.`,
            crossAttentionFocus: 'Cross-attention guided spatial decision.'
          },
          clinicalManagement: 'Correlate with formal clinical dermatological evaluation and biopsy.'
        });
      }
    } finally {
      setAiReportLoading(false);
    }
  };

  const hasActiveResult = Boolean(diagnosticResult);
  const topClass = diagnosticResult?.predictedClass || 'NV';
  const topClassInfo = LESION_CLASSES[topClass];
  const isMalignant = topClassInfo.category === 'Malignant';
  const isPremalignant = topClassInfo.category === 'Premalignant';
  const isPositive = hasActiveResult ? (isMalignant || isPremalignant) : false;

  const activeScreeningStatus: 'POSITIVE' | 'NEGATIVE' | 'STANDBY' = !hasActiveResult
    ? 'STANDBY'
    : isPositive
    ? 'POSITIVE'
    : 'NEGATIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Banner / Framework Paradigm Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>

          <div
            role={datasetStatus.status === 'error' ? 'alert' : 'status'}
            className={`px-3 py-2 rounded-xl border text-xs font-mono ${
              datasetStatus.status === 'ready'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : datasetStatus.status === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {datasetStatus.status === 'ready'
              ? `HAM10000 preprocessed dataset ready: ${datasetStatus.sampleCount?.toLocaleString()} samples`
              : datasetStatus.status === 'error'
                ? `Dataset error: ${datasetStatus.message}`
                : 'Checking HAM10000 preprocessed dataset...'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Multimodal Dual-Stream Diagnostic Workbench
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                DEMO / MOCK INFERENCE
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Integrates dermoscopic visual feature maps with patient clinical priors using cross-attention & class-balanced loss weighting.
            </p>
          </div>
        </div>

        {/* Dynamic Paradigm Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Fusion Paradigm Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>Fusion Paradigm:</span>
            </span>
            <select
              value={fusionMode}
              onChange={(e) => setFusionMode(e.target.value as FusionMode)}
              className="bg-slate-50 dark:bg-black text-cyan-800 dark:text-cyan-300 text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="cross_attention">Cross-Attention Multimodal (Proposed)</option>
              <option value="gated_multimodal">Gated Multimodal Unit (GMU)</option>
              <option value="early_concat">Early Concatenation</option>
              <option value="late_ensemble">Late Decision Ensemble</option>
              <option value="image_only">Image-Only (Swin-T Baseline)</option>
              <option value="tabular_only">Metadata-Only (FT-Transformer)</option>
            </select>
          </div>

          {/* Loss Function Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Optimization Loss:</span>
            </span>
            <select
              value={lossFunction}
              onChange={(e) => setLossFunction(e.target.value as LossFunction)}
              className="bg-slate-50 dark:bg-black text-amber-800 dark:text-amber-300 text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              <option value="cb_focal">Class-Balanced Focal (β=0.9999)</option>
              <option value="ldam_drw">LDAM + Deferred Re-Weighting</option>
              <option value="focal_loss">Standard Focal Loss (γ=2)</option>
              <option value="standard_ce">Standard Cross-Entropy (Imbalance Flaw)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Case & Vision), Middle (Metadata & Fusion), Right (Diagnosis & AI Report) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1 (4 Cols): Case Selector + Dermoscopy Canvas + GradCAM */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Primary Mode Tabs: Upload vs Benchmark */}
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Diagnostic Input Source</span>
              </span>
              <button
                type="button"
                onClick={handleResetWorkbench}
                className="text-[10px] font-mono px-2 py-1 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white hover:bg-slate-100 text-slate-700 dark:bg-black dark:hover:bg-neutral-900 dark:text-white cursor-pointer transition-colors flex items-center gap-1"
                title="Clear image, result, benchmark selection, and patient metadata"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset Workbench</span>
              </button>
            </div>

            {/* Mode Switcher Buttons - In Light Mode White/Slate, In Dark Mode Black */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleSelectUploadMode}
                className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeInputMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300 dark:bg-black dark:text-white dark:border-2 dark:border-white dark:shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:bg-black/60 dark:text-neutral-400 dark:hover:text-white border border-transparent'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Test Image Upload</span>
              </button>

              <button
                type="button"
                onClick={handleSelectBenchmarkMode}
                className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeInputMode === 'benchmark'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300 dark:bg-black dark:text-white dark:border-2 dark:border-white dark:shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:bg-black/60 dark:text-neutral-400 dark:hover:text-white border border-transparent'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ISIC Benchmark</span>
              </button>
            </div>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload patient lesion image"
            />
            {uploadError && (
              <p role="alert" className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-2.5 py-2">
                {uploadError}
              </p>
            )}

            {/* Upload Mode Content */}
            {activeInputMode === 'upload' ? (
              <div className="flex flex-col gap-3">
                {customImage ? (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40">
                          {hasActiveResult ? (isPositive ? 'POS (+)' : 'NEG (-)') : 'READY'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Uploaded Lesion Photo</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors cursor-pointer"
                          title="Remove uploaded image"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Remove</span>
                        </button>
                        <label className="cursor-pointer flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-black text-cyan-700 dark:text-white border border-slate-300 dark:border-neutral-800 hover:bg-slate-200 dark:hover:border-white/50">
                          <Upload className="w-3 h-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAnalysisRequested(true)}
                      disabled={analysisRequested && Boolean(diagnosticResult)}
                      className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer disabled:cursor-default"
                    >
                      {diagnosticResult ? 'Analysis Complete' : 'Analyze Image'}
                    </button>

                    {/* Real Extracted Image Metrics Chip */}
                    {imageMetrics && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-1.5">
                        <div>Asymmetry (A): <strong className="text-cyan-700 dark:text-cyan-400">{imageMetrics.asymmetryScore}</strong></div>
                        <div>Color Variance (C): <strong className="text-cyan-700 dark:text-cyan-400">{imageMetrics.colorVariance}</strong></div>
                        <div>Border Jaggedness (B): <strong className="text-cyan-700 dark:text-cyan-400">{imageMetrics.borderIrregularity}</strong></div>
                        <div>Melanin Darkness: <strong className="text-cyan-700 dark:text-cyan-400">{imageMetrics.darknessScore}</strong></div>
                        <div>Estimated Diameter: <strong className="text-cyan-700 dark:text-cyan-400">{imageMetrics.estimatedDiameterMm.toFixed(1)} mm</strong></div>
                        <div>Estimated Skin Type: <strong className="text-cyan-700 dark:text-cyan-400">Type {imageMetrics.estimatedFitzpatrickSkinType}</strong></div>
                        <div className="col-span-2 text-[9px] text-slate-500 dark:text-slate-500">
                          Demo estimates from image pixels; verify with calibrated clinical measurements.
                        </div>
                      </div>
                    )}

                    {/* Suspected target profile override if desired */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-neutral-800">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Class Target Mode:</span>
                      <select
                        value={customTargetClass}
                        onChange={(e) => setCustomTargetClass(e.target.value as any)}
                        className="bg-white dark:bg-black text-slate-800 dark:text-white text-xs font-mono rounded px-2 py-1.5 border border-slate-300 dark:border-neutral-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="auto">⚡ Auto (Calculated from Image Pixel Metrics + Priors)</option>
                        <option value="NV">🔴 Benign Melanocytic Nevus / Mole (NV)</option>
                        <option value="BKL">🔴 Benign Seborrheic Keratosis (BKL)</option>
                        <option value="DF">🔴 Benign Dermatofibroma (DF)</option>
                        <option value="VASC">🔴 Benign Vascular Angioma (VASC)</option>
                        <option value="MEL">🔴 Malignant Melanoma (MEL)</option>
                        <option value="BCC">🔴 Basal Cell Carcinoma (BCC)</option>
                        <option value="SCC">🔴 Squamous Cell Carcinoma (SCC)</option>
                        <option value="AKIEC">🔴 Premalignant Actinic Keratosis (AKIEC)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-black border border-dashed border-slate-300 dark:border-neutral-800 flex flex-col items-center justify-center text-center gap-2.5">
                    <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">No Image Uploaded Yet</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Upload a dermoscopic image to preview it before analysis.
                      </p>
                    </div>
                    <label className="cursor-pointer mt-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              /* Benchmark Mode Content */
              <div className="grid grid-cols-1 gap-1.5">
                {BENCHMARK_CASES.map((c) => {
                  const isSelected = selectedCaseId === c.id;
                  const classDef = LESION_CLASSES[c.groundTruthClass];
                  const caseIsPositive = classDef.category === 'Malignant' || classDef.category === 'Premalignant';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectBenchmarkCase(c.id)}
                      className={`p-2 rounded-xl text-left transition-all text-xs flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-black border-cyan-400 dark:border-white text-cyan-900 dark:text-white font-semibold shadow-sm dark:shadow-[0_0_10px_rgba(255,255,255,0.4)] dark:animate-white-glow'
                          : 'bg-white hover:bg-slate-100 dark:bg-black dark:hover:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40">
                          {caseIsPositive ? 'POS (+)' : 'NEG (-)'}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${classDef.bgBadge} ${classDef.borderBadge}`}>
                          {c.groundTruthClass}
                        </span>
                        <span className="truncate max-w-[135px]">{c.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                        {c.metadata.age}y {c.metadata.sex[0].toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dermoscopy Canvas with Grad-CAM */}
          <DermoscopyCanvas
            currentCase={activeInputMode === 'benchmark' ? currentBenchmarkCase : null}
            customImage={activeInputMode === 'upload' ? customImage : undefined}
            heatmapOpacity={heatmapOpacity}
            showGradcam={showGradcam}
            colormap={colormap}
            showContour={showContour}
            screeningStatus={activeScreeningStatus}
            onFileUpload={handleFileUpload}
            onFileDrop={processImageFile}
            onRemoveCustomImage={handleRemoveImage}
            onHeatmapOpacityChange={setHeatmapOpacity}
            onColormapChange={setColormap}
            onToggleGradcam={setShowGradcam}
            onToggleContour={setShowContour}
          />
        </div>

        {/* COLUMN 2 (4 Cols): Tabular Metadata Stream & Fusion Control */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-xs font-bold text-slate-900 dark:text-white flex items-start gap-1.5">
                <User className="w-4 h-4 text-cyan-600 dark:text-white" />
                <span className="break-words">Patient Metadata Stream (FT-Transformer)</span>
              </span>
              <button
                type="button"
                id="reset-priors-btn"
                onClick={() => setMetadata(activeInputMode === 'benchmark' && currentBenchmarkCase ? currentBenchmarkCase.metadata : defaultCustomMetadata)}
                className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-300 dark:border-neutral-700 bg-white hover:bg-slate-100 text-slate-700 dark:bg-black dark:hover:bg-neutral-900 dark:text-white cursor-pointer transition-all flex items-center gap-1 shadow-xs hover:border-slate-400 dark:hover:border-neutral-500"
                title="Reset clinical priors to defaults"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset Metadata</span>
              </button>
            </div>

            {/* Anatomical Site 3D Body Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">Anatomical Lesion Location:</span>
              <AnatomicalBodySelector
                selectedSite={metadata.anatomicalSite}
                onChangeSite={(site) => setMetadata((prev) => ({ ...prev, anatomicalSite: site }))}
                onSelectSite={(site) => setMetadata((prev) => ({ ...prev, anatomicalSite: site }))}
              />
            </div>

            {/* Patient Demographics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Age Slider with -5 / +5 Step Buttons */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-neutral-300 font-medium">Age:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{metadata.age} yrs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={95}
                  value={metadata.age}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, age: Number(e.target.value) }))}
                  className="accent-cyan-600 dark:accent-white h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer w-full"
                />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setMetadata((prev) => ({ ...prev, age: Math.max(1, prev.age - 5) }))}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:border-neutral-600 transition-colors cursor-pointer"
                  >
                    -5 yrs
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadata((prev) => ({ ...prev, age: Math.min(95, prev.age + 5) }))}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:border-neutral-600 transition-colors cursor-pointer"
                  >
                    +5 yrs
                  </button>
                </div>
              </div>

              {/* Sex Selector with Clickable Buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Biological Sex:</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['male', 'female', 'other'] as const).map((s) => {
                    const isCurrent = metadata.sex === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMetadata((prev) => ({ ...prev, sex: s }))}
                        className={`py-1.5 px-1 rounded-lg text-xs font-mono font-medium capitalize transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-sm dark:bg-black dark:text-white dark:border-2 dark:border-white dark:shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 dark:bg-black/90 dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-black dark:hover:border-neutral-600 dark:hover:text-white'
                        }`}
                      >
                        {s === 'other' ? 'Other' : s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lesion Physical Size & Step Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Diameter Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-neutral-300 font-medium">Diameter:</span>
                  <span className={`font-mono font-bold ${metadata.diameterMm >= 6.0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {metadata.diameterMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={25.0}
                  step={0.5}
                  value={metadata.diameterMm}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, diameterMm: Number(e.target.value) }))}
                  className="accent-cyan-600 dark:accent-white h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg cursor-pointer w-full"
                />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setMetadata((prev) => ({ ...prev, diameterMm: Math.max(1.0, +(prev.diameterMm - 1.0).toFixed(1)) }))}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:border-neutral-600 transition-colors cursor-pointer"
                  >
                    -1 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadata((prev) => ({ ...prev, diameterMm: 6.0 }))}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 dark:bg-red-950/80 dark:hover:bg-red-900 dark:text-red-400 dark:border-red-700 transition-colors cursor-pointer font-bold"
                    title="Set to standard ABCD 6mm cutoff"
                  >
                    6mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadata((prev) => ({ ...prev, diameterMm: Math.min(25.0, +(prev.diameterMm + 1.0).toFixed(1)) }))}
                    className="flex-1 py-1 text-[10px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:border-neutral-600 transition-colors cursor-pointer"
                  >
                    +1 mm
                  </button>
                </div>
              </div>

              {/* Fitzpatrick Skin Type with Quick Buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Fitzpatrick Skin Type:</span>
                <div className="grid grid-cols-6 gap-1">
                  {(['I', 'II', 'III', 'IV', 'V', 'VI'] as FitzpatrickType[]).map((ft) => {
                    const isCur = metadata.fitzpatrickSkinType === ft;
                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setMetadata((prev) => ({ ...prev, fitzpatrickSkinType: ft }))}
                        className={`py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          isCur
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm dark:bg-black dark:text-white dark:border-2 dark:border-white dark:shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 dark:bg-black/90 dark:text-neutral-400 dark:border-neutral-800 dark:hover:bg-black dark:hover:border-neutral-600 dark:hover:text-white'
                        }`}
                        title={`Fitzpatrick Type ${ft}`}
                      >
                        {ft}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1">
                  {metadata.fitzpatrickSkinType === 'I' && 'Type I: Pale white, always burns'}
                  {metadata.fitzpatrickSkinType === 'II' && 'Type II: Fair, burns easily'}
                  {metadata.fitzpatrickSkinType === 'III' && 'Type III: Medium, sometimes burns'}
                  {metadata.fitzpatrickSkinType === 'IV' && 'Type IV: Olive, rarely burns'}
                  {metadata.fitzpatrickSkinType === 'V' && 'Type V: Brown, very rarely burns'}
                  {metadata.fitzpatrickSkinType === 'VI' && 'Type VI: Deeply pigmented dark skin'}
                </span>
              </div>
            </div>

            {/* Evolution / History Criteria */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Lesion Evolution / Symptoms:</span>
              <select
                value={metadata.evolutionHistory}
                onChange={(e) => setMetadata((prev) => ({ ...prev, evolutionHistory: e.target.value as EvolutionHistory }))}
                className="bg-slate-50 text-slate-900 dark:bg-black dark:text-white text-xs font-mono rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-neutral-800 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
              >
                <option value="stable">Stable / No noticeable changes (Low risk)</option>
                <option value="slow_enlarging">Slowly enlarging over 6-12 months</option>
                <option value="color_change">Noticeable color darkening or irregularity</option>
                <option value="bleeding_itching">Pruritus / Bleeding / Ulceration (High risk)</option>
                <option value="new_rapid">Newly appeared and rapidly growing (High risk)</option>
              </select>
            </div>

            {/* Oncological Risk Factors - Clickable Toggle Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">Oncological Risk Factors:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  id="toggle-personal-melanoma"
                  onClick={() => setMetadata((prev) => ({ ...prev, personalMelanomaHistory: !prev.personalMelanomaHistory }))}
                  className={`p-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                    metadata.personalMelanomaHistory
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:border-red-500 dark:text-red-400 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-black dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs">Personal Melanoma</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    metadata.personalMelanomaHistory
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 font-bold'
                      : 'bg-white text-slate-500 border-slate-300 dark:bg-black dark:text-neutral-500 dark:border-neutral-800'
                  }`}>
                    {metadata.personalMelanomaHistory ? 'YES' : 'NO'}
                  </span>
                </button>

                <button
                  type="button"
                  id="toggle-family-melanoma"
                  onClick={() => setMetadata((prev) => ({ ...prev, familyMelanomaHistory: !prev.familyMelanomaHistory }))}
                  className={`p-2 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                    metadata.familyMelanomaHistory
                      ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:border-red-500 dark:text-red-400 font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-black dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs">Family History</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    metadata.familyMelanomaHistory
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 font-bold'
                      : 'bg-white text-slate-500 border-slate-300 dark:bg-black dark:text-neutral-500 dark:border-neutral-800'
                  }`}>
                    {metadata.familyMelanomaHistory ? 'YES' : 'NO'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Fusion Mechanism Visualizer */}
          {diagnosticResult && (
            <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Cross-Stream Attention Routing</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  Mode: {fusionMode}
                </span>
              </div>

              {/* Visual vs Metadata Contribution Bar */}
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Visual Dermoscopy Stream: {(100 - diagnosticResult.streamActivations.gatingAlpha * 100).toFixed(0)}%</span>
                  <span>Patient Priors: {(diagnosticResult.streamActivations.gatingAlpha * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${100 - diagnosticResult.streamActivations.gatingAlpha * 100}%` }}
                    className="bg-cyan-500 transition-all duration-300"
                  ></div>
                  <div
                    style={{ width: `${diagnosticResult.streamActivations.gatingAlpha * 100}%` }}
                    className="bg-indigo-500 transition-all duration-300"
                  ></div>
                </div>
              </div>

              {/* Gating Factor α Info */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="font-mono text-slate-500 dark:text-slate-400">GMU Gating Factor α:</span>
                <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                  {diagnosticResult.streamActivations.gatingAlpha.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3 (4 Cols): Diagnostic Calibrated Probabilities & AI Reasoning */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Primary Diagnostic Verdict Card */}
          {hasActiveResult && diagnosticResult ? (
            <div className={`p-4 rounded-2xl border shadow-sm dark:shadow-xl flex flex-col gap-3.5 transition-all ${
              isPositive
                ? 'bg-rose-50/60 dark:bg-black border-rose-200 dark:border-rose-500/50 shadow-rose-900/10 dark:shadow-rose-950/30'
                : 'bg-emerald-50/60 dark:bg-black border-emerald-200 dark:border-emerald-500/50 shadow-emerald-900/10 dark:shadow-emerald-950/30'
            }`}>
              {/* Prominent POSITIVE / NEGATIVE Screening Outcome Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isPositive
                  ? 'bg-rose-100/70 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-100/70 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${
                    isPositive
                      ? 'bg-rose-200/60 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-400'
                      : 'bg-emerald-200/60 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isPositive ? (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                      Screening Status
                    </div>
                    <div className={`text-base font-black tracking-tight ${
                      isPositive ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {isPositive ? 'POSITIVE (+)' : 'NEGATIVE (-)'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black font-mono tracking-wide text-white shadow-sm ${
                    isPositive ? 'bg-red-600' : 'bg-emerald-600'
                  }`}>
                    {isPositive ? 'MALIGNANCY DETECTED' : 'BENIGN (NO CANCER)'}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {isPositive ? 'Action: Biopsy Recommended' : 'Action: Routine Surveillance'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-neutral-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Primary Histopathology Target
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${topClassInfo.bgBadge} ${topClassInfo.borderBadge}`}>
                  {topClassInfo.category}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {topClassInfo.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    [{topClass}] {topClassInfo.fullName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-black text-cyan-600 dark:text-cyan-400">
                    {diagnosticResult.classProbabilities[topClass]}%
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Confidence</p>
                </div>
              </div>

              {/* Malignancy Risk Meter */}
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Overall Malignancy Risk:</span>
                  <span className={`font-mono font-bold ${
                    diagnosticResult.malignancyRisk > 50 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {diagnosticResult.malignancyRisk}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${diagnosticResult.malignancyRisk}%` }}
                    className={`h-full transition-all duration-300 ${
                      diagnosticResult.malignancyRisk > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  ></div>
                </div>
              </div>

              {/* Clinical Sensitivity Metric */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <span>Sens @ 95% Spec:</span>
                <span className="text-cyan-700 dark:text-cyan-300 font-bold">{diagnosticResult.sensitivityAt95Spec}%</span>
              </div>
            </div>
          ) : (
            /* Standby State Card when awaiting image */
            <div className="p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-xl flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black border border-cyan-500/20 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Screening Status</div>
                    <div className="text-sm font-bold text-cyan-700 dark:text-white">STANDBY (Awaiting Upload)</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-black text-slate-700 dark:text-white text-[11px] font-mono font-bold border border-slate-300 dark:border-neutral-800">
                  Ready to Test
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                  Upload a dermoscopic image to begin analysis.
                </p>
                <p className="text-[11px] text-slate-500">
                  The model will extract visual asymmetry, color polychromatism, and border sharpness to calculate cancer screening status.
                </p>
              </div>
            </div>
          )}

          {/* Calibrated 8-Class Posterior Probabilities */}
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>8-Class Posterior Probabilities</span>
              </span>
              <button
                type="button"
                id="view-isic-graph-shortcut-btn"
                onClick={() => {
                  setExpandedSection('isic_graph');
                  const el = document.getElementById('isic-benchmark-analysis-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-black dark:hover:bg-neutral-900 text-cyan-900 dark:text-white border border-cyan-200 dark:border-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Inspect full ISIC Long-Tail distribution graph below"
              >
                <span>ISIC Graph Below</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {(Object.keys(LESION_CLASSES) as SkinLesionClass[]).map((c) => {
                const prob = diagnosticResult ? diagnosticResult.classProbabilities[c] : 0;
                const def = LESION_CLASSES[c];
                const isTop = hasActiveResult && c === topClass;
                return (
                  <div key={c} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className={isTop ? 'font-bold text-cyan-700 dark:text-white' : 'text-slate-600 dark:text-neutral-400'}>
                        {c} - {def.name}
                      </span>
                      <span className={isTop ? 'font-bold text-cyan-700 dark:text-white' : 'text-slate-600 dark:text-neutral-400'}>
                        {hasActiveResult ? `${prob.toFixed(1)}%` : '--'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${prob}%`,
                          backgroundColor: def.color
                        }}
                        className="h-full transition-all duration-200"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Oncologist Report Button & Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-black border border-indigo-200 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-white" />
                <span>Clinical Report & Onco-Notes</span>
              </span>
              <button
                type="button"
                onClick={handleGenerateAiDiagnosis}
                disabled={aiReportLoading || !hasActiveResult}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 dark:bg-black dark:hover:bg-neutral-900 dark:text-white dark:border-neutral-700 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {aiReportLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-white" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-white" />
                    <span>Generate Clinical Note</span>
                  </>
                )}
              </button>
            </div>

            {aiReport ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-indigo-100 dark:border-neutral-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-2.5">
                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiReport.diagnosticSummary}
                </p>

                {/* Differential Diagnosis Table */}
                {aiReport.differentialDiagnosis && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">Differential Likelihoods:</span>
                    {aiReport.differentialDiagnosis.map((d: any, i: number) => (
                      <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1">
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">•</span>
                        <span>
                          <strong className="text-slate-800 dark:text-slate-200">{d.condition || d.name}</strong> ({d.likelihood || d.confidence}%): {d.clinicalReasoning || d.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clinical Management Recommendation */}
                {aiReport.clinicalManagement && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Recommended Clinical Action: </span>
                      <span>{aiReport.clinicalManagement}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                {hasActiveResult
                  ? 'Click "Generate Clinical Note" to synthesize multimodal dermoscopy with patient history priors.'
                  : 'Upload an image or select a benchmark case to generate clinical oncology synthesis.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Analysis Tabs: ISIC Benchmark Long-Tail Class Imbalance, SHAP Waterfall, Cross-Attention, and ABCDE */}
      <div id="isic-benchmark-analysis-section" className="p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setExpandedSection('isic_graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              expandedSection === 'isic_graph'
                ? 'bg-cyan-50 dark:bg-black text-cyan-900 dark:text-white border border-cyan-300 dark:border-white shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-50 dark:bg-transparent border border-transparent dark:hover:border-white/30'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>ISIC Benchmark Long-Tail Graph</span>
            {diagnosticResult && (
              <span className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-white animate-white-beacon shadow-[0_0_8px_#ffffff]"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('shap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              expandedSection === 'shap'
                ? 'bg-cyan-50 dark:bg-black text-cyan-900 dark:text-white border border-cyan-300 dark:border-white shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-50 dark:bg-transparent border border-transparent dark:hover:border-white/30'
            }`}
          >
            SHAP Feature Attributions
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('dual_stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              expandedSection === 'dual_stream'
                ? 'bg-cyan-50 dark:bg-black text-cyan-900 dark:text-white border border-cyan-300 dark:border-white shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-50 dark:bg-transparent border border-transparent dark:hover:border-white/30'
            }`}
          >
            Cross-Attention Matrix
          </button>
          <button
            type="button"
            onClick={() => setExpandedSection('abcde')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              expandedSection === 'abcde'
                ? 'bg-cyan-50 dark:bg-black text-cyan-900 dark:text-white border border-cyan-300 dark:border-white shadow-sm dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-50 dark:bg-transparent border border-transparent dark:hover:border-white/30'
            }`}
          >
            ABCDE Dermatological Checklist
          </button>
        </div>

        {/* ISIC Benchmark Long-Tail Graph View */}
        {expandedSection === 'isic_graph' && (
          <div className="flex flex-col gap-3">
            <ISICLongTailGraph
              diagnosticResult={diagnosticResult}
              uploadedImage={customImage}
              onImageDrop={processImageFile}
              onRemoveImage={handleRemoveImage}
            />
          </div>
        )}

        {/* SHAP Waterfall View */}
        {expandedSection === 'shap' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Quantifies how patient demographic and clinical history attributes shift log-odds prediction away from the population baseline:
            </p>
            {diagnosticResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diagnosticResult.shapAttributions.map((attr, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                      attr.isRiskIncreasing
                        ? 'bg-rose-50/70 dark:bg-black border-rose-200 dark:border-red-500/40'
                        : 'bg-emerald-50/70 dark:bg-black border-emerald-200 dark:border-red-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{attr.feature}</span>
                      <span className={`font-mono font-bold ${
                        attr.isRiskIncreasing ? 'text-rose-700 dark:text-red-400' : 'text-emerald-700 dark:text-red-400'
                      }`}>
                        {attr.impactScore > 0 ? `+${attr.impactScore}` : attr.impactScore} log-odds
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-mono text-slate-700 dark:text-slate-300">Observed: {attr.rawValue}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {attr.clinicalRationale}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black text-center text-xs text-slate-500 font-mono border border-slate-200 dark:border-neutral-800">
                Awaiting lesion image or benchmark case selection to compute SHAP attributions.
              </div>
            )}
          </div>
        )}

        {/* Cross-Attention Matrix View */}
        {expandedSection === 'dual_stream' && (
          <div>
            {diagnosticResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Top Vision Stream Activations (Swin-T 768-D):
                  </span>
                  <div className="flex flex-col gap-2">
                    {diagnosticResult.streamActivations.imageStreamTopFeatures.map((f, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span>{f.name}</span>
                          <span className="text-cyan-700 dark:text-cyan-400 font-bold">{f.activation.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${f.activation * 100}%` }}
                            className="h-full bg-cyan-500"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Top Tabular Prior Activations (FT-Transformer 64-D):
                  </span>
                  <div className="flex flex-col gap-2">
                    {diagnosticResult.streamActivations.tabularStreamTopFeatures.map((f, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span>{f.name}</span>
                          <span className="text-indigo-700 dark:text-indigo-400 font-bold">{f.activation.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${f.activation * 100}%` }}
                            className="h-full bg-indigo-500"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black text-center text-xs text-slate-500 font-mono border border-slate-200 dark:border-neutral-800">
                Awaiting lesion image or benchmark case selection to compute cross-attention tokens.
              </div>
            )}
          </div>
        )}

        {/* ABCDE Rule Checklist */}
        {expandedSection === 'abcde' && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-sm">A - Asymmetry</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {imageMetrics
                  ? `Calculated Index: ${imageMetrics.asymmetryScore}`
                  : hasActiveResult && topClass === 'MEL'
                  ? 'High 2-axis asymmetry'
                  : 'Bilateral symmetry'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-sm">B - Border</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {imageMetrics
                  ? `Edge Roughness: ${imageMetrics.borderIrregularity}`
                  : hasActiveResult && topClass === 'MEL'
                  ? 'Scalloped, notched margin'
                  : 'Smooth well-demarcated edge'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-sm">C - Color</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {imageMetrics
                  ? `Polychromatism: ${imageMetrics.colorVariance}`
                  : hasActiveResult && topClass === 'MEL'
                  ? 'Variegated dark/blue veil'
                  : 'Monochromatic brown/tan'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-sm">D - Diameter</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                {metadata.diameterMm} mm ({metadata.diameterMm >= 6 ? '≥ 6mm Alert' : '< 6mm Low risk'})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 font-mono text-sm">E - Evolution</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 capitalize">
                {metadata.evolutionHistory.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
