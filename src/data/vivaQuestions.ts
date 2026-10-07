import { VivaQuestion } from '../types';

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    id: 'viva-01',
    category: 'Multimodal Architecture',
    difficulty: 'Advanced',
    question: 'Why does intermediate Cross-Attention fusion outperform simple early feature concatenation when combining high-resolution dermoscopy with patient metadata?',
    hint: 'Think about dimensional asymmetry (768 vs 64 dims) and how tabular context guides visual spatial attention.',
    idealKeypoints: [
      'Dimensional Asymmetry: High-dimensional visual embeddings (768-D) overpower low-dimensional tabular embeddings (16-64D) during early concatenation, causing gradient vanishing for tabular weights.',
      'Dynamic Spatial Guidance: In Cross-Attention, the tabular embedding acts as Query (Q) to attend over spatial visual Key-Value (K, V) patch tokens, forcing the model to scan for specific patterns (e.g. irregular borders in elderly patients).',
      'Non-linear Modality Interaction: Captures non-linear cross-modal synergies rather than simple static linear combinations.'
    ]
  },
  {
    id: 'viva-02',
    category: 'Class Imbalance & Loss',
    difficulty: 'Examiner Trap',
    question: 'Explain the mathematical formulation of Class-Balanced (CB) Focal Loss. What is the physical interpretation of the beta (β) hyperparameter?',
    hint: 'Formulate effective volume E_n = (1 - β^n)/(1 - β) and explain why standard inverse frequency 1/N over-penalizes frequent classes.',
    idealKeypoints: [
      'Effective Number of Samples: As sample count n grows, new samples add diminishing novel information due to data overlap in feature space. Effective volume is E_n = (1 - β^n)/(1 - β).',
      'Hyperparameter β ∈ [0, 1): When β=0, no re-weighting occurs; as β → 1, it approaches inverse frequency weighting. Typically β = 0.9999 for fine-grained lesion datasets.',
      'Synergy with Focal Loss: CB weight modulates the loss landscape across classes, while the focal term (1 - p_t)^γ down-weights easy majority examples (e.g. typical benign nevi).'
    ]
  },
  {
    id: 'viva-03',
    category: 'Mathematical Formulations',
    difficulty: 'Advanced',
    question: 'How does Label-Distribution-Aware Margin (LDAM) loss with Deferred Re-Weighting (DRW) prevent generalization error on minority classes like Dermatofibroma?',
    hint: 'Explain theoretical margin Δ_j = C / (n_j)^1/4 and why two-stage DRW schedule preserves initial feature representation.',
    idealKeypoints: [
      'Class-Dependent Margin: LDAM enforces a larger margin Δ_j = C / (n_j)^0.25 for minority classes in the logit space, pushing the decision boundary further into majority territory.',
      'Deferred Re-Weighting (DRW): During early training epochs, unweighted optimization learns high-quality universal visual representations. In the second stage (after epoch 60), re-weighted loss aligns the decision boundary without distorting the latent geometry.',
      'Empirical Gain: Prevents rare classes like DF and VASC from being absorbed by the dominant NV class.'
    ]
  },
  {
    id: 'viva-04',
    category: 'Clinical Translation',
    difficulty: 'Foundation',
    question: 'How does the framework handle missing or noisy metadata (e.g., unreported patient age or unknown anatomical site) in clinical deployment?',
    hint: 'Mention learnable missing tokens, FT-Transformer mask embeddings, and the Gated Multimodal Unit fallback.',
    idealKeypoints: [
      'Learnable Mask Embeddings: Categorical and numerical missing values are replaced by dedicated learned missing-token vectors rather than arbitrary zeros or mean imputation.',
      'Adaptive GMU Gating: When metadata is ambiguous or missing, the Gated Multimodal Unit (GMU) automatically decreases the tabular gating coefficient α → 0, smoothly falling back to pure visual inference.',
      'Robustness: Ensures zero crashing or ungrounded probability spikes in real-world outpatient clinics.'
    ]
  },
  {
    id: 'viva-05',
    category: 'Ablation & Metrics',
    difficulty: 'Advanced',
    question: 'Why is overall accuracy a dangerously misleading metric for skin cancer detection benchmarks? What metric should be prioritized instead?',
    hint: 'Mention majority class bias (NV accounts for 67% of ISIC) and partial AUC at high clinical sensitivity.',
    idealKeypoints: [
      'Majority Class Illusion: A trivial model predicting 100% Benign Nevus (NV) achieves >67% standard accuracy while missing 100% of lethal melanomas (0% sensitivity).',
      'Balanced Multi-Class Accuracy & Macro F1: Averages recall equally across all classes regardless of sample prevalence.',
      'Melanoma Sensitivity @ 95% Specificity & pAUC: Clinical oncology standard requiring that the system catches ≥90% of malignant melanomas while maintaining high specificity to prevent unnecessary biopsies.'
    ]
  }
];
