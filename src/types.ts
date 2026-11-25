/**
 * DermaFusion AI - Core Domain Types
 * Multimodal Deep Learning Framework with Class-Balanced Learning for Skin Cancer Detection
 */

export type SkinLesionClass =
  | 'MEL'    // Melanoma (Malignant)
  | 'NV'     // Melanocytic Nevus (Benign)
  | 'BCC'    // Basal Cell Carcinoma (Malignant)
  | 'AKIEC'  // Actinic Keratosis / Intraepithelial Carcinoma (Pre-malignant)
  | 'BKL'    // Benign Keratosis (Benign)
  | 'DF'     // Dermatofibroma (Benign)
  | 'VASC'   // Vascular Lesion (Benign)
  | 'SCC';   // Squamous Cell Carcinoma (Malignant)

export type TabType =
  | 'home'
  | 'workbench'
  | 'architecture'
  | 'class_balance'
  | 'ablation';

export type UserRole = 'clinician' | 'guest';

export interface UserPreferences {
  defaultSensitivityTarget: number; // e.g. 94.2
  heatmapPalette: 'jet' | 'turbo' | 'inferno' | 'viridis' | 'thermal';
  autoGenerateSaliency: boolean;
  autoFillPriorRisks: boolean;
  highRiskAlertThreshold: number; // e.g. 80
  reportHeaderClinic: string;
  reportDoctorSignature: string;
  enableAudioNotifications: boolean;
  themePreference: 'dark' | 'clinical' | 'midnight';
}

export interface UserStats {
  casesEvaluated: number;
  malignanciesFlagged: number;
  reportsExported: number;
  calibrationsPerformed: number;
  averageConfidence: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  institution: string;
  department: string;
  specialty?: string;
  phone?: string;
  officeLocation?: string;
  licenseNumber?: string;
  npiNumber?: string;
  bio?: string;
  joinedDate?: string;
  twoFactorEnabled?: boolean;
  lastLogin: string;
  preferences?: Partial<UserPreferences>;
  stats?: Partial<UserStats>;
  permissions: {
    canRunDiagnostics: boolean;
    canExportReports: boolean;
    canTuneLossParameters: boolean;
    canRecalibrateThresholds: boolean;
    canManageUsers: boolean;
    canViewAuditLogs: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: 'inference' | 'calibration' | 'auth' | 'system';
  details: string;
  status: 'success' | 'warning' | 'info';
}

export interface ClassDefinition {
  code: SkinLesionClass;
  name: string;
  fullName: string;
  category: 'Malignant' | 'Benign' | 'Premalignant';
  color: string;
  bgBadge: string;
  borderBadge: string;
  isicFrequency: number; // typical frequency in ISIC-10K (shows extreme imbalance)
  clinicalDescription: string;
  dermoscopyMarkers: string[];
}

export type AnatomicalSite =
  | 'torso'
  | 'head_neck'
  | 'upper_extremity'
  | 'lower_extremity'
  | 'palms_soles'
  | 'oral_genital';

export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type EvolutionHistory =
  | 'new_rapid'
  | 'slow_enlarging'
  | 'color_change'
  | 'bleeding_itching'
  | 'stable';

export interface PatientMetadata {
  age: number;
  sex: 'male' | 'female' | 'other';
  anatomicalSite: AnatomicalSite;
  diameterMm: number;
  fitzpatrickSkinType: FitzpatrickType;
  evolutionHistory: EvolutionHistory;
  personalMelanomaHistory: boolean;
  familyMelanomaHistory: boolean;
  biopsyHistory: boolean;
  sunburnHistorySevere?: boolean;
}

export interface BenchmarkCase {
  id: string;
  title: string;
  datasetSource: string;
  isicId: string;
  groundTruthClass: SkinLesionClass;
  imageSrc: string; // SVG or data URL
  metadata: PatientMetadata;
  clinicalNotes: string;
  visualPatterns: string[];
  metadataRiskFactors: string[];
  gradcamConfig: {
    hotspots: Array<{ x: number; y: number; r: number; intensity: number }>;
    contourSvgPath?: string;
  };
}

export type FusionMode =
  | 'cross_attention'
  | 'gated_multimodal'
  | 'early_concat'
  | 'late_ensemble'
  | 'image_only'
  | 'tabular_only';

export type LossFunction =
  | 'cb_focal'
  | 'ldam_drw'
  | 'focal_loss'
  | 'weighted_ce'
  | 'standard_ce';

export interface ShapAttribution {
  feature: string;
  rawValue: string;
  impactScore: number; // log-odds shift (-1.0 to +1.0)
  isRiskIncreasing: boolean;
  clinicalRationale: string;
}

export interface DualStreamActivation {
  imageStreamTopFeatures: Array<{ name: string; activation: number }>;
  tabularStreamTopFeatures: Array<{ name: string; activation: number }>;
  crossAttentionWeights: number[][]; // 4x4 matrix representation
  gatingAlpha: number; // 0 (100% image) to 1 (100% metadata), 0.5 balanced
  effectiveWeightsPerClass: Record<SkinLesionClass, number>;
}

export interface AIClinicalReport {
  diagnosticSummary: string;
  primaryDiagnosis: {
    classCode: SkinLesionClass;
    className: string;
    confidencePercentage: number;
    malignancyType: string;
  };
  differentialDiagnosis: Array<{
    condition: string;
    likelihood: number;
    clinicalReasoning: string;
  }>;
  abcdeAnalysis: {
    asymmetry: string;
    border: string;
    color: string;
    diameter: string;
    evolution: string;
  };
  multimodalContribution: {
    visualCues: string;
    metadataRiskShift: string;
    crossAttentionFocus: string;
  };
  clinicalManagement: string;
}

export interface DiagnosticResult {
  predictedClass: SkinLesionClass;
  isCorrectVsGroundTruth?: boolean;
  classProbabilities: Record<SkinLesionClass, number>;
  malignancyRisk: number; // 0 - 100%
  sensitivityAt95Spec: number;
  modalityContribution: {
    imageWeight: number;
    tabularWeight: number;
    synergyScore: number;
  };
  shapAttributions: ShapAttribution[];
  streamActivations: DualStreamActivation;
  aiReport?: AIClinicalReport;
  timestamp: string;
}

export interface VivaQuestion {
  id: string;
  category: 'Mathematical Formulations' | 'Multimodal Architecture' | 'Class Imbalance & Loss' | 'Clinical Translation' | 'Ablation & Metrics';
  difficulty: 'Foundation' | 'Advanced' | 'Examiner Trap';
  question: string;
  hint: string;
  idealKeypoints: string[];
}
