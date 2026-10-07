export interface ModelAblationResult {
  id: string;
  name: string;
  category: 'Fusion Paradigm' | 'Loss Formulation' | 'Baseline Single Modality';
  fusionMode: string;
  lossFunction: string;
  balancedAccuracy: number; // e.g. 89.4%
  macroF1: number;          // e.g. 86.8%
  melanomaSensitivity95Spec: number; // e.g. 91.2%
  rareClassRecallDF: number; // e.g. 94.1% vs 12.5% for CE
  pAUC: number;             // partial AUC > 80% sensitivity
  inferenceLatencyMs: number;
  description: string;
  keyAdvantage: string;
  keyLimitation: string;
}

export const ABLATION_STUDY_DATA: ModelAblationResult[] = [
  {
    id: 'ours-full',
    name: 'Proposed: Cross-Attention + CB-Focal Loss',
    category: 'Fusion Paradigm',
    fusionMode: 'Cross-Attention Multimodal',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 91.8,
    macroF1: 89.4,
    melanomaSensitivity95Spec: 93.6,
    rareClassRecallDF: 95.2,
    pAUC: 0.942,
    inferenceLatencyMs: 24.5,
    description: 'Tabular metadata queries spatial visual feature maps via learned cross-attention, weighted by effective number of samples.',
    keyAdvantage: 'Highest diagnostic sensitivity on lethal melanomas without suffering from image/tabular dimensional dominance.',
    keyLimitation: 'Slightly higher compute overhead during cross-attention matrix multiplication.'
  },
  {
    id: 'ours-ldam',
    name: 'Variant: Cross-Attention + LDAM-DRW',
    category: 'Loss Formulation',
    fusionMode: 'Cross-Attention Multimodal',
    lossFunction: 'LDAM + Deferred Re-Weighting',
    balancedAccuracy: 90.6,
    macroF1: 88.2,
    melanomaSensitivity95Spec: 92.1,
    rareClassRecallDF: 96.0,
    pAUC: 0.935,
    inferenceLatencyMs: 24.6,
    description: 'Enforces label-distribution-aware margins Δ_j = C / (n_j)^0.25 on minority class hyperplanes.',
    keyAdvantage: 'Superior boundary separation on extreme rare classes (DF and VASC).',
    keyLimitation: 'Requires two-stage training schedule (DRW switch point at epoch 60).'
  },
  {
    id: 'gmu-cbfocal',
    name: 'Gated Multimodal Unit (GMU) + CB-Focal',
    category: 'Fusion Paradigm',
    fusionMode: 'Gated Multimodal Unit (GMU)',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 88.7,
    macroF1: 86.1,
    melanomaSensitivity95Spec: 89.4,
    rareClassRecallDF: 91.8,
    pAUC: 0.918,
    inferenceLatencyMs: 21.0,
    description: 'Uses a learned sigmoid gate α to balance image vs tabular vectors dynamically.',
    keyAdvantage: 'Adaptive gating suppresses noisy metadata or blurred images.',
    keyLimitation: 'Lacks spatial localization compared to patch-level cross-attention.'
  },
  {
    id: 'early-concat-cbfocal',
    name: 'Early Fusion (Concat) + CB-Focal',
    category: 'Fusion Paradigm',
    fusionMode: 'Early Feature Concatenation',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 84.9,
    macroF1: 81.3,
    melanomaSensitivity95Spec: 85.0,
    rareClassRecallDF: 87.4,
    pAUC: 0.884,
    inferenceLatencyMs: 18.2,
    description: 'Direct concatenation of 768-dim image vector with 64-dim metadata embedding.',
    keyAdvantage: 'Simple single-stage linear classification head.',
    keyLimitation: 'Image representation vector heavily overpowers tabular vector (768:64 dimension skew).'
  },
  {
    id: 'late-ensemble-cbfocal',
    name: 'Late Fusion (Decision Ensemble) + CB-Focal',
    category: 'Fusion Paradigm',
    fusionMode: 'Late Decision Pooling',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 83.2,
    macroF1: 79.8,
    melanomaSensitivity95Spec: 83.4,
    rareClassRecallDF: 82.0,
    pAUC: 0.871,
    inferenceLatencyMs: 27.8,
    description: 'Trains two independent models (Swin-T and FT-Transformer) and blends output softmax probabilities.',
    keyAdvantage: 'Modality independence protects against single-stream failure.',
    keyLimitation: 'Zero cross-modal feature interaction during intermediate representation learning.'
  },
  {
    id: 'image-only-cbfocal',
    name: 'Image Only (Swin Transformer) + CB-Focal',
    category: 'Baseline Single Modality',
    fusionMode: 'Vision Backbone Only',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 81.6,
    macroF1: 78.4,
    melanomaSensitivity95Spec: 81.2,
    rareClassRecallDF: 76.5,
    pAUC: 0.852,
    inferenceLatencyMs: 16.4,
    description: 'Swin-T vision backbone without patient age, sex, or anatomical risk priors.',
    keyAdvantage: 'Zero dependence on clinical metadata availability.',
    keyLimitation: 'Confuses benign dysplastic nevi with early melanoma due to absence of age/evolution priors.'
  },
  {
    id: 'tabular-only',
    name: 'Metadata Only (FT-Transformer Tabular)',
    category: 'Baseline Single Modality',
    fusionMode: 'Tabular MLP / FT-Transformer',
    lossFunction: 'Class-Balanced Focal (β=0.9999)',
    balancedAccuracy: 64.3,
    macroF1: 58.7,
    melanomaSensitivity95Spec: 62.0,
    rareClassRecallDF: 48.0,
    pAUC: 0.690,
    inferenceLatencyMs: 4.2,
    description: 'Only patient age, anatomical site, diameter, and personal/family history.',
    keyAdvantage: 'Extremely lightweight (<5ms latency).',
    keyLimitation: 'Cannot differentiate morphology without dermoscopic visualization.'
  },
  {
    id: 'cross-attn-standard-ce',
    name: 'Cross-Attention + Standard Cross-Entropy (Ablation)',
    category: 'Loss Formulation',
    fusionMode: 'Cross-Attention Multimodal',
    lossFunction: 'Standard Cross-Entropy (No Class Balancing)',
    balancedAccuracy: 72.4,
    macroF1: 67.2,
    melanomaSensitivity95Spec: 71.5,
    rareClassRecallDF: 18.2,
    pAUC: 0.774,
    inferenceLatencyMs: 24.4,
    description: 'Multimodal cross-attention trained with unweighted cross-entropy loss.',
    keyAdvantage: 'High overall sample accuracy on the majority class (NV: 98.4%).',
    keyLimitation: 'Catastrophic failure on minority classes (DF recall drops to 18%, Melanoma sensitivity drops 22%).'
  }
];

export const ROC_CURVE_DATA = [
  { fpr: 0.00, ourProposed: 0.00, earlyConcat: 0.00, lateFusion: 0.00, imageOnly: 0.00, standardCE: 0.00 },
  { fpr: 0.02, ourProposed: 0.82, earlyConcat: 0.68, lateFusion: 0.62, imageOnly: 0.58, standardCE: 0.45 },
  { fpr: 0.05, ourProposed: 0.936, earlyConcat: 0.850, lateFusion: 0.834, imageOnly: 0.812, standardCE: 0.715 }, // 95% specificity marker
  { fpr: 0.10, ourProposed: 0.965, earlyConcat: 0.910, lateFusion: 0.895, imageOnly: 0.875, standardCE: 0.820 },
  { fpr: 0.15, ourProposed: 0.980, earlyConcat: 0.942, lateFusion: 0.928, imageOnly: 0.912, standardCE: 0.870 },
  { fpr: 0.20, ourProposed: 0.988, earlyConcat: 0.961, lateFusion: 0.948, imageOnly: 0.936, standardCE: 0.902 },
  { fpr: 0.30, ourProposed: 0.994, earlyConcat: 0.980, lateFusion: 0.971, imageOnly: 0.962, standardCE: 0.941 },
  { fpr: 0.50, ourProposed: 0.999, earlyConcat: 0.993, lateFusion: 0.989, imageOnly: 0.984, standardCE: 0.975 },
  { fpr: 1.00, ourProposed: 1.00, earlyConcat: 1.00, lateFusion: 1.00, imageOnly: 1.00, standardCE: 1.00 }
];

export const CONFUSION_MATRIX_OURS = {
  classes: ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC', 'SCC'],
  matrix: [
    [1041,   38,   12,    4,   14,    2,    0,    2], // MEL (True)
    [  42, 6590,   18,   10,   36,    5,    2,    2], // NV (True)
    [  10,   14,  482,    5,    2,    0,    0,    1], // BCC (True)
    [   6,    8,    9,  298,    4,    0,    0,    2], // AKIEC (True)
    [  15,   28,    3,    6, 1042,    4,    1,    0], // BKL (True)
    [   1,    3,    0,    0,    1,  109,    1,    0], // DF (True)
    [   0,    2,    0,    0,    0,    1,   95,    0], // VASC (True)
    [   2,    1,    1,    3,    0,    0,    0,   55], // SCC (True)
  ]
};

export const CONFUSION_MATRIX_STANDARD_CE = {
  classes: ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC', 'SCC'],
  matrix: [
    [ 795,  280,   18,    4,   12,    0,    0,    4], // MEL (Standard CE severely misclassifies MEL into NV)
    [  12, 6680,    4,    2,    5,    1,    1,    0], // NV (NV absorbs everything)
    [  18,  110,  375,    8,    3,    0,    0,    0], // BCC (True)
    [   8,   85,   15,  215,    3,    0,    0,    1], // AKIEC (True)
    [  24,  210,    8,   12,  842,    2,    1,    0], // BKL (True)
    [   4,   88,    1,    0,    1,   21,    0,    0], // DF (88 out of 115 misclassified as NV!)
    [   1,   72,    0,    0,    0,    0,   25,    0], // VASC (True)
    [   3,   32,    2,    8,    0,    0,    0,   17], // SCC (True)
  ]
};
