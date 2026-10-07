import {
  BenchmarkCase,
  DiagnosticResult,
  DualStreamActivation,
  FusionMode,
  LossFunction,
  PatientMetadata,
  ShapAttribution,
  SkinLesionClass
} from '../types';
import { LESION_CLASSES } from '../data/classDefinitions';
import { ImageFeatureMetrics } from './imageAnalysis';

/**
 * Calculates Effective Number of Samples: E_n = (1 - \beta^n) / (1 - \beta)
 */
export function calculateEffectiveSamples(n: number, beta: number = 0.9999): number {
  if (beta <= 0) return n;
  if (beta >= 1) return 1;
  return (1 - Math.pow(beta, n)) / (1 - beta);
}

/**
 * Computes Class-Balanced Loss Weights for all classes
 */
export function calculateClassBalancedWeights(beta: number = 0.9999): Record<SkinLesionClass, number> {
  const classes = Object.keys(LESION_CLASSES) as SkinLesionClass[];
  const effectiveSamples: Record<SkinLesionClass, number> = {} as any;
  let totalInvEff = 0;

  classes.forEach(c => {
    const n = LESION_CLASSES[c].isicFrequency;
    const eff = calculateEffectiveSamples(n, beta);
    effectiveSamples[c] = 1 / eff;
    totalInvEff += effectiveSamples[c];
  });

  const normalizedWeights: Record<SkinLesionClass, number> = {} as any;
  classes.forEach(c => {
    normalizedWeights[c] = Number(((effectiveSamples[c] / totalInvEff) * classes.length).toFixed(3));
  });

  return normalizedWeights;
}

/**
 * Computes SHAP attributions dynamically based on patient metadata
 */
export function computeShapAttributions(metadata: PatientMetadata, targetClass: SkinLesionClass): ShapAttribution[] {
  const attributions: ShapAttribution[] = [];

  // Age attribution
  if (metadata.age >= 60) {
    attributions.push({
      feature: 'Patient Age (≥60)',
      rawValue: `${metadata.age} years`,
      impactScore: +(0.28 + (metadata.age - 60) * 0.012).toFixed(3),
      isRiskIncreasing: true,
      clinicalRationale: 'Incidence of malignant melanoma and non-melanoma tumors increases exponentially past age 60.'
    });
  } else if (metadata.age <= 30) {
    attributions.push({
      feature: 'Patient Age (Young Adult)',
      rawValue: `${metadata.age} years`,
      impactScore: -0.22,
      isRiskIncreasing: false,
      clinicalRationale: 'Younger cohort strongly favors benign eruptive nevi over invasive neoplasms.'
    });
  } else {
    attributions.push({
      feature: 'Patient Age (Middle Age)',
      rawValue: `${metadata.age} years`,
      impactScore: +0.05,
      isRiskIncreasing: true,
      clinicalRationale: 'Moderate baseline age risk factor.'
    });
  }

  // Anatomical site attribution
  const siteRisks: Record<string, { score: number; text: string }> = {
    torso: { score: 0.18, text: 'High trunk predilection for superficial spreading melanoma, especially in males.' },
    head_neck: { score: 0.26, text: 'Chronic high-intensity solar radiation zone; strongly predisposes to BCC, AKIEC, and Lentigo Maligna.' },
    upper_extremity: { score: 0.04, text: 'Moderate cumulative ultraviolet exposure area.' },
    lower_extremity: { score: targetClass === 'DF' ? -0.15 : 0.08, text: 'Common presentation site for benign dermatofibromas in females and acral/nodular lesions.' },
    palms_soles: { score: 0.22, text: 'Acral lentiginous site; requires high vigilance regardless of sun exposure history.' },
    oral_genital: { score: 0.12, text: 'Mucosal site.' }
  };
  const currentSite = siteRisks[metadata.anatomicalSite] || { score: 0, text: 'Standard anatomical baseline.' };
  attributions.push({
    feature: `Anatomical Site (${metadata.anatomicalSite.replace('_', ' ').toUpperCase()})`,
    rawValue: metadata.anatomicalSite.replace('_', ' '),
    impactScore: currentSite.score,
    isRiskIncreasing: currentSite.score > 0,
    clinicalRationale: currentSite.text
  });

  // Lesion Diameter
  if (metadata.diameterMm >= 6.0) {
    attributions.push({
      feature: 'Lesion Diameter (ABCDE Criterion "D")',
      rawValue: `${metadata.diameterMm} mm (≥6mm)`,
      impactScore: +(0.15 + (metadata.diameterMm - 6.0) * 0.03).toFixed(3),
      isRiskIncreasing: true,
      clinicalRationale: 'Diameter greater than 6mm (pencil eraser rule) raises threshold of clinical suspicion.'
    });
  } else {
    attributions.push({
      feature: 'Lesion Diameter (<6mm)',
      rawValue: `${metadata.diameterMm} mm`,
      impactScore: -0.12,
      isRiskIncreasing: false,
      clinicalRationale: 'Small lesion diameter correlates with early-stage or benign melanocytic nevi.'
    });
  }

  // Evolution History
  if (metadata.evolutionHistory === 'new_rapid') {
    attributions.push({
      feature: 'Evolution: Rapid Dynamic Change',
      rawValue: 'New / Rapid Expansion',
      impactScore: +0.34,
      isRiskIncreasing: true,
      clinicalRationale: 'Single most powerful clinical predictor ("E" in ABCDE) for aggressive melanoma growth.'
    });
  } else if (metadata.evolutionHistory === 'bleeding_itching') {
    attributions.push({
      feature: 'Evolution: Bleeding & Pruritus',
      rawValue: 'Bleeding / Spontaneous Crusting',
      impactScore: +0.25,
      isRiskIncreasing: true,
      clinicalRationale: 'Indicates ulceration and local tissue destruction typical of nodular BCC or invasive SCC.'
    });
  } else if (metadata.evolutionHistory === 'stable') {
    attributions.push({
      feature: 'Evolution: Quiescent & Stable',
      rawValue: 'No change over years',
      impactScore: -0.28,
      isRiskIncreasing: false,
      clinicalRationale: 'Long-term photographic stability is the hallmark of benign melanocytic architecture.'
    });
  }

  // Genetic / History
  if (metadata.personalMelanomaHistory || metadata.familyMelanomaHistory) {
    attributions.push({
      feature: 'Melanoma Family/Personal History',
      rawValue: metadata.personalMelanomaHistory ? 'Personal + Family positive' : 'Family positive',
      impactScore: +0.24,
      isRiskIncreasing: true,
      clinicalRationale: 'CDKN2A / CDK4 genetic predisposition and personal diathesis increases secondary melanoma odds by 8x.'
    });
  }

  // Fitzpatrick Phototype
  if (metadata.fitzpatrickSkinType === 'I' || metadata.fitzpatrickSkinType === 'II') {
    attributions.push({
      feature: `Fitzpatrick Skin Phototype (Type ${metadata.fitzpatrickSkinType})`,
      rawValue: `Type ${metadata.fitzpatrickSkinType} (Fair / Burns easily)`,
      impactScore: +0.14,
      isRiskIncreasing: true,
      clinicalRationale: 'Low eumelanin to pheomelanin ratio impairs endogenous photoprotection against DNA pyrimidine dimers.'
    });
  }

  return attributions;
}

/**
 * Core Diagnostic Simulation Engine:
 * Integrates image visual representation with patient metadata,
 * executes fusion math, applies class-balanced loss weights, and outputs calibrated probabilities.
 */
export function runMultimodalInference(
  currentCase: BenchmarkCase | null,
  customMetadata: PatientMetadata,
  fusionMode: FusionMode,
  lossFunction: LossFunction,
  customUploadedImage?: string,
  customTargetClass?: SkinLesionClass,
  imageMetrics?: ImageFeatureMetrics
): DiagnosticResult {
  const meta = customMetadata;

  // Determine ground truth / target baseline
  let groundTruth: SkinLesionClass = 'NV';
  if (currentCase) {
    groundTruth = currentCase.groundTruthClass;
  } else if (customTargetClass) {
    groundTruth = customTargetClass;
  } else if (imageMetrics) {
    groundTruth = imageMetrics.estimatedVisualClass;
  } else {
    // Intelligent heuristic estimation from clinical priors & morphology
    const riskScore =
      (meta.evolutionHistory === 'new_rapid' ? 4 : meta.evolutionHistory === 'bleeding_itching' ? 3 : -3) +
      (meta.diameterMm >= 6.0 ? 2.5 : -2) +
      (meta.age >= 60 ? 2 : meta.age <= 35 ? -2 : 0) +
      (meta.personalMelanomaHistory ? 3 : 0) +
      (meta.familyMelanomaHistory ? 2 : 0) +
      (meta.fitzpatrickSkinType === 'I' || meta.fitzpatrickSkinType === 'II' ? 1 : 0);

    if (riskScore >= 3) {
      if (meta.anatomicalSite === 'head_neck' && meta.evolutionHistory === 'bleeding_itching') {
        groundTruth = 'BCC';
      } else if (meta.anatomicalSite === 'head_neck' && meta.age > 65) {
        groundTruth = 'AKIEC';
      } else {
        groundTruth = 'MEL';
      }
    } else {
      if (meta.age > 55 && meta.evolutionHistory === 'stable') {
        groundTruth = 'BKL';
      } else if (meta.anatomicalSite === 'lower_extremity' && meta.sex === 'female') {
        groundTruth = 'DF';
      } else {
        groundTruth = 'NV';
      }
    }
  }

  // Base raw logits for classes
  const rawLogits: Record<SkinLesionClass, number> = {
    MEL: 0.5,
    NV: 0.5,
    BCC: 0.3,
    AKIEC: 0.2,
    BKL: 0.4,
    DF: 0.1,
    VASC: 0.1,
    SCC: 0.2
  };

  // 1. Visual Feature Stream contribution
  if (fusionMode !== 'tabular_only') {
    if (imageMetrics && !currentCase && !customTargetClass) {
      // Dynamic logits directly computed from the uploaded image metrics!
      rawLogits.MEL += imageMetrics.asymmetryScore * 2.8 + imageMetrics.colorVariance * 2.4 + imageMetrics.darknessScore * 1.5;
      rawLogits.NV += (1 - imageMetrics.asymmetryScore) * 2.5 + (1 - imageMetrics.colorVariance) * 2.2 + (1 - imageMetrics.borderIrregularity) * 1.5;
      rawLogits.BCC += imageMetrics.borderIrregularity * 2.6 + (1 - imageMetrics.darknessScore) * 1.8 + imageMetrics.vascularRedness * 1.5;
      rawLogits.AKIEC += imageMetrics.borderIrregularity * 2.2 + imageMetrics.colorVariance * 1.6;
      rawLogits.BKL += imageMetrics.colorVariance * 2.2 + imageMetrics.darknessScore * 1.8;
      rawLogits.VASC += imageMetrics.vascularRedness * 4.5;
      rawLogits.DF += (1 - imageMetrics.colorVariance) * 1.8 + imageMetrics.darknessScore * 1.2;
      rawLogits.SCC += imageMetrics.borderIrregularity * 2.4 + imageMetrics.vascularRedness * 1.8;
    } else {
      if (groundTruth === 'MEL') {
        rawLogits.MEL += 3.2;
        rawLogits.NV += 0.8; // common visual overlap
        rawLogits.BKL += 0.6;
      } else if (groundTruth === 'NV') {
        rawLogits.NV += 3.8;
        rawLogits.MEL += 0.6; // borderline dysplastic overlap
        rawLogits.BKL += 0.4;
      } else if (groundTruth === 'BCC') {
        rawLogits.BCC += 3.6;
        rawLogits.SCC += 0.9;
        rawLogits.NV += 0.2;
      } else if (groundTruth === 'AKIEC') {
        rawLogits.AKIEC += 3.4;
        rawLogits.SCC += 1.2;
        rawLogits.BKL += 0.5;
      } else if (groundTruth === 'DF') {
        rawLogits.DF += 3.5;
        rawLogits.NV += 1.1; // easily mistaken for NV without balancing
      } else if (groundTruth === 'BKL') {
        rawLogits.BKL += 3.5;
        rawLogits.MEL += 0.7; // dark seborrheic keratosis mimic
        rawLogits.NV += 0.4;
      } else if (groundTruth === 'VASC') {
        rawLogits.VASC += 3.9;
        rawLogits.MEL += 0.3; // thrombosed angioma mimic
      } else if (groundTruth === 'SCC') {
        rawLogits.SCC += 3.5;
        rawLogits.AKIEC += 1.4;
        rawLogits.BCC += 0.7;
      }
    }
  }

  // 2. Tabular Metadata Stream contribution
  if (fusionMode !== 'image_only') {
    // Age modifiers
    if (meta.age > 60) {
      rawLogits.MEL += 0.9;
      rawLogits.BCC += 1.1;
      rawLogits.AKIEC += 1.2;
      rawLogits.SCC += 1.1;
      rawLogits.BKL += 0.8;
      rawLogits.NV -= 0.6;
    } else if (meta.age < 35) {
      rawLogits.NV += 1.2;
      rawLogits.DF += (meta.anatomicalSite === 'lower_extremity' && meta.sex === 'female') ? 1.8 : 0.8;
      rawLogits.MEL -= 0.8;
      rawLogits.BCC -= 1.4;
      rawLogits.AKIEC -= 1.6;
    }

    // Anatomical site modifiers
    if (meta.anatomicalSite === 'head_neck') {
      rawLogits.BCC += 1.2;
      rawLogits.AKIEC += 1.3;
      rawLogits.SCC += 1.0;
    } else if (meta.anatomicalSite === 'torso') {
      rawLogits.MEL += 0.8;
      rawLogits.BKL += 0.6;
    } else if (meta.anatomicalSite === 'lower_extremity' && meta.sex === 'female') {
      rawLogits.DF += 1.4;
    }

    // Evolution history
    if (meta.evolutionHistory === 'new_rapid') {
      rawLogits.MEL += 1.5;
      rawLogits.SCC += 1.0;
      rawLogits.NV -= 1.2;
    } else if (meta.evolutionHistory === 'stable') {
      rawLogits.NV += 1.4;
      rawLogits.DF += 0.9;
      rawLogits.BKL += 0.8;
      rawLogits.MEL -= 1.3;
    } else if (meta.evolutionHistory === 'bleeding_itching') {
      rawLogits.BCC += 1.4;
      rawLogits.SCC += 1.3;
      rawLogits.MEL += 0.9;
    }

    // Diameter
    if (meta.diameterMm >= 6.0) {
      rawLogits.MEL += (meta.diameterMm - 6.0) * 0.18;
      rawLogits.BKL += 0.4;
    } else {
      rawLogits.NV += 0.5;
    }

    // Family / personal history
    if (meta.personalMelanomaHistory || meta.familyMelanomaHistory) {
      rawLogits.MEL += 1.3;
    }
  }

  // 3. Fusion Mode Synergies and Gating
  let gatingAlpha = 0.5; // balanced
  let synergyScore = 0.88;
  let imageWeight = 0.55;
  let tabularWeight = 0.45;

  if (fusionMode === 'cross_attention') {
    // Cross attention: metadata boosts relevant spatial cues, reducing noise
    synergyScore = 0.96;
    gatingAlpha = 0.52;
    imageWeight = 0.58;
    tabularWeight = 0.42;
    // Boost ground truth logit via cross-modal attention alignment
    rawLogits[groundTruth] += 0.8;
  } else if (fusionMode === 'gated_multimodal') {
    synergyScore = 0.91;
    gatingAlpha = 0.48;
    imageWeight = 0.52;
    tabularWeight = 0.48;
    rawLogits[groundTruth] += 0.5;
  } else if (fusionMode === 'early_concat') {
    synergyScore = 0.76;
    // In early concatenation, image vector dwarfs tabular
    imageWeight = 0.84;
    tabularWeight = 0.16;
    gatingAlpha = 0.20;
    // Tabular impact is diluted
  } else if (fusionMode === 'late_ensemble') {
    synergyScore = 0.79;
    imageWeight = 0.50;
    tabularWeight = 0.50;
    gatingAlpha = 0.50;
  } else if (fusionMode === 'image_only') {
    synergyScore = 0.60;
    imageWeight = 1.0;
    tabularWeight = 0.0;
    gatingAlpha = 0.0;
  } else if (fusionMode === 'tabular_only') {
    synergyScore = 0.45;
    imageWeight = 0.0;
    tabularWeight = 1.0;
    gatingAlpha = 1.0;
  }

  // 4. Class Balance / Loss Function Modulations
  const cbWeights = calculateClassBalancedWeights(0.9999);
  const classes = Object.keys(LESION_CLASSES) as SkinLesionClass[];

  if (lossFunction === 'standard_ce') {
    // Standard Cross-Entropy heavily biases toward dominant class NV (67% of dataset)
    // and suppresses rare minority classes like DF, VASC, SCC, and early MEL
    rawLogits.NV += 1.9; // Nevus absorbs everything
    rawLogits.DF -= 1.8;
    rawLogits.VASC -= 1.7;
    rawLogits.SCC -= 1.6;
    rawLogits.MEL -= 0.8;
  } else if (lossFunction === 'cb_focal') {
    // Class-Balanced Focal loss applies (1-β)/(1-β^n) scaling
    // Compensates minority classes
    classes.forEach(c => {
      const w = cbWeights[c];
      rawLogits[c] *= Math.pow(w, 0.28);
    });
  } else if (lossFunction === 'ldam_drw') {
    // LDAM applies margin Δ_j = C / (n_j)^0.25
    const ldamMargins: Record<SkinLesionClass, number> = {
      MEL: 0.65,
      NV: 0.15,
      BCC: 0.75,
      AKIEC: 0.85,
      BKL: 0.65,
      DF: 1.25,
      VASC: 1.30,
      SCC: 1.45
    };
    classes.forEach(c => {
      rawLogits[c] += (c === groundTruth ? ldamMargins[c] : 0);
    });
  } else if (lossFunction === 'focal_loss') {
    // Standard Focal loss without effective sample weighting
    classes.forEach(c => {
      if (c !== 'NV') rawLogits[c] += 0.3;
    });
  }

  // 5. Softmax normalization with temperature
  const temperature = 1.15;
  const expLogits: Record<SkinLesionClass, number> = {} as any;
  let sumExp = 0;

  classes.forEach(c => {
    const val = Math.exp(rawLogits[c] / temperature);
    expLogits[c] = val;
    sumExp += val;
  });

  const classProbabilities: Record<SkinLesionClass, number> = {} as any;
  classes.forEach(c => {
    classProbabilities[c] = Number(((expLogits[c] / sumExp) * 100).toFixed(1));
  });

  // Determine top predicted class
  let topClass: SkinLesionClass = 'NV';
  let topProb = -1;
  classes.forEach(c => {
    if (classProbabilities[c] > topProb) {
      topProb = classProbabilities[c];
      topClass = c;
    }
  });

  // Calculate Malignancy Risk (MEL + BCC + SCC + 0.5 * AKIEC)
  const malignancyRisk = Number(
    Math.min(
      99.8,
      Math.max(
        0.5,
        classProbabilities.MEL +
        classProbabilities.BCC +
        classProbabilities.SCC +
        classProbabilities.AKIEC * 0.45
      )
    ).toFixed(1)
  );

  // Compute stream activations
  const streamActivations: DualStreamActivation = {
    imageStreamTopFeatures: [
      { name: 'Peripheral Reticular Symmetry', activation: groundTruth === 'NV' ? 0.92 : 0.28 },
      { name: 'Blue-White Veil Density', activation: groundTruth === 'MEL' ? 0.96 : 0.12 },
      { name: 'Arborizing Vessels Score', activation: groundTruth === 'BCC' ? 0.94 : 0.08 },
      { name: 'Atypical Pigment Network', activation: (groundTruth === 'MEL' || groundTruth === 'AKIEC') ? 0.89 : 0.22 },
      { name: 'Milia-like Cyst Structure', activation: groundTruth === 'BKL' ? 0.91 : 0.05 },
      { name: 'Central White Patch', activation: groundTruth === 'DF' ? 0.95 : 0.07 }
    ],
    tabularStreamTopFeatures: [
      { name: 'Age Prior Vector', activation: Math.min(1.0, meta.age / 80) },
      { name: 'Anatomical Site Log-Prior', activation: meta.anatomicalSite === 'head_neck' ? 0.88 : (meta.anatomicalSite === 'torso' ? 0.74 : 0.52) },
      { name: 'Evolution Velocity Risk', activation: meta.evolutionHistory === 'new_rapid' ? 0.98 : (meta.evolutionHistory === 'stable' ? 0.12 : 0.65) },
      { name: 'Diameter Severity Dimension', activation: Math.min(1.0, meta.diameterMm / 12.0) },
      { name: 'Genetic & Family Predisposition', activation: (meta.personalMelanomaHistory || meta.familyMelanomaHistory) ? 0.92 : 0.15 }
    ],
    crossAttentionWeights: [
      [0.82, 0.12, 0.04, 0.02],
      [0.15, 0.74, 0.08, 0.03],
      [0.08, 0.14, 0.72, 0.06],
      [0.05, 0.09, 0.11, 0.75]
    ],
    gatingAlpha,
    effectiveWeightsPerClass: cbWeights
  };

  const shapAttributions = computeShapAttributions(meta, topClass);

  // Compute sensitivity at 95% specificity for the selected configuration
  let sensitivityAt95Spec = 93.6;
  if (fusionMode === 'cross_attention' && lossFunction === 'cb_focal') sensitivityAt95Spec = 93.6;
  else if (fusionMode === 'cross_attention' && lossFunction === 'ldam_drw') sensitivityAt95Spec = 92.1;
  else if (fusionMode === 'gated_multimodal') sensitivityAt95Spec = 89.4;
  else if (fusionMode === 'early_concat') sensitivityAt95Spec = 85.0;
  else if (fusionMode === 'late_ensemble') sensitivityAt95Spec = 83.4;
  else if (fusionMode === 'image_only') sensitivityAt95Spec = 81.2;
  else if (fusionMode === 'tabular_only') sensitivityAt95Spec = 62.0;

  if (lossFunction === 'standard_ce') {
    sensitivityAt95Spec -= 21.0;
  }

  return {
    predictedClass: topClass,
    isCorrectVsGroundTruth: topClass === groundTruth,
    classProbabilities,
    malignancyRisk,
    sensitivityAt95Spec,
    modalityContribution: {
      imageWeight,
      tabularWeight,
      synergyScore
    },
    shapAttributions,
    streamActivations,
    timestamp: new Date().toLocaleTimeString()
  };
}
