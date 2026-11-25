import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  Eye,
  GitBranch,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';

interface ModuleDetail {
  id: string;
  title: string;
  category: 'Vision Stream' | 'Tabular Stream' | 'Multimodal Fusion' | 'Class-Balanced Head';
  inputShape: string;
  outputShape: string;
  parameters: string;
  mathematicalEquation: string;
  description: string;
  designJustification: string;
}

const MODULE_DETAILS: Record<string, ModuleDetail> = {
  dull_razor: {
    id: 'dull_razor',
    title: 'DullRazor Hair Removal & Color Normalization',
    category: 'Vision Stream',
    inputShape: '[B, 3, 512, 512] (Raw RGB)',
    outputShape: '[B, 3, 384, 384] (Standardized)',
    parameters: 'Non-parametric morphological top-hat filter',
    mathematicalEquation: 'I_{clean} = I_{raw} \\circ B - I_{raw}, \\quad \\text{Inpainting: Bilinear}',
    description: 'Eliminates occluding hair shafts, air bubbles from immersion oil, and compensates for inter-dermatoscopy illumination temperature shifts.',
    designJustification: 'Prevents the neural network from learning spurious hair patterns or dermatoscope rim artifacts as false cancer markers.'
  },
  swin_transformer: {
    id: 'swin_transformer',
    title: 'Hierarchical Vision Backbone (Swin-T)',
    category: 'Vision Stream',
    inputShape: '[B, 3, 384, 384]',
    outputShape: 'F_{img} \\in \\mathbb{R}^{B \\times 12 \\times 12 \\times 768}, \\quad f_{img} \\in \\mathbb{R}^{B \\times 768}',
    parameters: '28.3M Parameters (ImageNet-22k pretrained)',
    mathematicalEquation: '\\text{W-MSA} + \\text{SW-MSA}, \\quad \\text{Attention}(Q, K, V) = \\text{Softmax}\\left(\\frac{QK^T}{\\sqrt{d}} + B\\right)V',
    description: 'Hierarchical shifted-window self-attention. Captures micro-patterns (dots/globules) in shallow layers and global border asymmetry in deeper stages.',
    designJustification: 'Superior to standard CNNs for dermatological lesions because shifted windows model long-range asymmetrical border interactions.'
  },
  entity_embeddings: {
    id: 'entity_embeddings',
    title: 'Tabular Entity Embeddings & FT-Transformer',
    category: 'Tabular Stream',
    inputShape: '[B, 8] (Age, Site, Sex, Diameter, History, Phototype)',
    outputShape: 'f_{tab} \\in \\mathbb{R}^{B \\times 64}',
    parameters: '145K Parameters (Lightweight MLP/Transformer)',
    mathematicalEquation: 'e_{site} = E_{site}[x_{site}], \\quad f_{tab} = \\text{LayerNorm}(\\text{GELU}(W_t [e_{cat} \\parallel x_{num}] + b_t))',
    description: 'Converts categorical clinical variables into continuous geometric latent spaces (e.g. captures semantic proximity of head vs neck vs scalp).',
    designJustification: 'One-hot encoding fails to capture continuous risk gradients. Entity embeddings map demographic priors to a dense 64-D manifold.'
  },
  cross_attention: {
    id: 'cross_attention',
    title: 'Tabular-Guided Spatial Cross-Attention Module',
    category: 'Multimodal Fusion',
    inputShape: 'Query: f_{tab} (64-D), \\quad Key/Value: F_{img} (144 \\times 768-D)',
    outputShape: 'F_{cross} \\in \\mathbb{R}^{B \\times 768}',
    parameters: '590K Parameters (Multi-Head Cross-Attention)',
    mathematicalEquation: 'Q = f_{tab} W_Q, \\quad K = F_{img} W_K, \\quad V = F_{img} W_V, \\quad \\text{Attn} = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V',
    description: 'Allows patient demographic context (age, history) to dynamically steer visual spatial attention towards relevant morphological regions.',
    designJustification: 'Solves dimensional imbalance. Tabular data directly queries image tokens rather than competing in a static concatenated vector.'
  },
  gmu_unit: {
    id: 'gmu_unit',
    title: 'Gated Multimodal Unit (GMU Adaptive Blending)',
    category: 'Multimodal Fusion',
    inputShape: '[f_{img}, f_{tab}] \\in \\mathbb{R}^{B \\times (768 + 64)}',
    outputShape: 'h_{fused} \\in \\mathbb{R}^{B \\times 512}',
    parameters: '425K Parameters',
    mathematicalEquation: '\\alpha = \\sigma(W_g [f_{img} \\parallel f_{tab}] + b_g), \\quad h_{fused} = \\alpha \\odot \\tanh(W_v f_{img}) + (1-\\alpha) \\odot \\tanh(W_t f_{tab})',
    description: 'Learns a sample-specific gating scalar \\alpha \\in [0, 1] that controls the information flow from each modality.',
    designJustification: 'Provides automatic fallback: if metadata is incomplete or noisy, \\alpha \\to 1 (pure vision); if image is blurry, metadata risk prior takes over.'
  },
  cb_focal_head: {
    id: 'cb_focal_head',
    title: 'Class-Balanced Margin Classification Head',
    category: 'Class-Balanced Head',
    inputShape: 'h_{fused} \\in \\mathbb{R}^{B \\times 512}',
    outputShape: '\\hat{y} \\in \\mathbb{R}^{B \\times 8} (Class Probabilities)',
    parameters: '4.1K Parameters',
    mathematicalEquation: '\\mathcal{L}_{\\text{CB-Focal}} = -\\frac{1-\\beta}{1-\\beta^{n_y}} (1-p_t)^\\gamma \\log(p_t), \\quad \\beta = 0.9999',
    description: 'Final 8-class classification layer weighted by the effective volume of representation across classes.',
    designJustification: 'Prevents dominant benign Nevus class from drowning out gradients for lethal melanomas and rare dermatofibromas.'
  }
};

export const ArchitectureStudio: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('cross_attention');
  const activeModule = MODULE_DETAILS[selectedModuleId] || MODULE_DETAILS.cross_attention;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Dual-Stream Multimodal Architecture Studio
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                Dataflow Pipeline
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Interactive architectural breakdown of Vision Stream, Tabular Stream, Cross-Attention Gating, and Class-Balanced Head.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visual Pipeline Diagram */}
      <div className="p-6 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Interactive Dataflow Architecture (Click any node to inspect layers & equations)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Total Params: ~29.5M</span>
        </div>

        {/* Dual Stream Flow Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* STAGE 1: Dual Inputs (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Input 1: Dermoscopy Image */}
            <button
              type="button"
              onClick={() => setSelectedModuleId('dull_razor')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'dull_razor'
                  ? 'bg-cyan-50 dark:bg-black border-cyan-500 dark:border-white text-cyan-900 dark:text-white shadow-md ring-1 ring-cyan-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Dermoscopy Image</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">512×512×3</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">DullRazor Filter + Color Norm</p>
            </button>

            {/* Input 2: Patient Metadata */}
            <button
              type="button"
              onClick={() => setSelectedModuleId('entity_embeddings')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'entity_embeddings'
                  ? 'bg-indigo-50 dark:bg-black border-indigo-500 dark:border-white text-indigo-900 dark:text-white shadow-md ring-1 ring-indigo-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Patient Metadata</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">8 Features</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Age, Site, Sex, History, Diameter</p>
            </button>
          </div>

          {/* ARROW 1 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* STAGE 2: Specialized Feature Streams (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Vision Backbone */}
            <button
              type="button"
              onClick={() => setSelectedModuleId('swin_transformer')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'swin_transformer'
                  ? 'bg-cyan-50 dark:bg-black border-cyan-500 dark:border-white text-cyan-900 dark:text-white shadow-md ring-1 ring-cyan-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Swin-T Vision Backbone</span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">768-D</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Hierarchical Shifted-Window Attention</p>
            </button>

            {/* Tabular MLP / FT-Transformer */}
            <button
              type="button"
              onClick={() => setSelectedModuleId('entity_embeddings')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'entity_embeddings'
                  ? 'bg-indigo-50 dark:bg-black border-indigo-500 dark:border-white text-indigo-900 dark:text-white shadow-md ring-1 ring-indigo-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">FT-Transformer Stream</span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">64-D</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Learned Demographic Embeddings</p>
            </button>
          </div>

          {/* ARROW 2 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* STAGE 3: Multimodal Fusion & Gating (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSelectedModuleId('cross_attention')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'cross_attention'
                  ? 'bg-cyan-50 dark:bg-black border-cyan-500 dark:border-white text-cyan-900 dark:text-white shadow-md ring-1 ring-cyan-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Cross-Attn</span>
                <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400">Q=Tab, K=Img</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Spatial Attention</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModuleId('gmu_unit')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedModuleId === 'gmu_unit'
                  ? 'bg-indigo-50 dark:bg-black border-indigo-500 dark:border-white text-indigo-900 dark:text-white shadow-md ring-1 ring-indigo-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">GMU Gate</span>
                <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400">α ∈ [0, 1]</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Adaptive Blending</p>
            </button>
          </div>

          {/* ARROW 3 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* STAGE 4: Class-Balanced Head (1 Col) */}
          <div className="lg:col-span-1 flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedModuleId('cb_focal_head')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedModuleId === 'cb_focal_head'
                  ? 'bg-amber-50 dark:bg-black border-amber-500 dark:border-white text-amber-900 dark:text-white shadow-md ring-1 ring-amber-400/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)] dark:animate-white-glow'
                  : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-700 shadow-sm'
              }`}
            >
              <span className="text-xs font-bold block mb-1 text-slate-900 dark:text-slate-100">CB Loss</span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block">8 Classes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Module Technical Inspector Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {activeModule.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeModule.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-black text-slate-700 dark:text-white border border-slate-200 dark:border-neutral-800">
              {activeModule.parameters}
            </span>
          </div>
        </div>

        {/* Tensor Shapes & Mathematical Equation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Tensor Dimension Transformations:</span>
            <div className="text-slate-800 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500">Input:  </span>{activeModule.inputShape}
            </div>
            <div className="text-cyan-700 dark:text-cyan-300">
              <span className="text-slate-400 dark:text-slate-500">Output: </span>{activeModule.outputShape}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-cyan-200 dark:border-cyan-500/20 shadow-sm flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-cyan-700 dark:text-cyan-400 text-[10px] uppercase font-bold">Mathematical Formulation:</span>
            <div className="text-cyan-800 dark:text-cyan-200 overflow-x-auto">
              {activeModule.mathematicalEquation}
            </div>
          </div>
        </div>

        {/* Deep Description & Justification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="font-bold text-slate-800 dark:text-slate-300">Operational Mechanism:</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{activeModule.description}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col gap-1">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">Clinical & Architectural Justification:</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{activeModule.designJustification}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
