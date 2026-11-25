import { BenchmarkCase } from '../types';

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: 'case-mel-01',
    title: 'Superficial Spreading Melanoma (High Risk Profile)',
    datasetSource: 'ISIC-2024 / HAM10000',
    isicId: 'ISIC_0032948',
    groundTruthClass: 'MEL',
    imageSrc: 'melanoma_atypical',
    metadata: {
      age: 67,
      sex: 'male',
      anatomicalSite: 'torso',
      diameterMm: 8.8,
      fitzpatrickSkinType: 'II',
      evolutionHistory: 'new_rapid',
      personalMelanomaHistory: true,
      familyMelanomaHistory: true,
      biopsyHistory: true,
      sunburnHistorySevere: true
    },
    clinicalNotes: 'Asymmetric pigmented macule on upper back showing rapid darkening and border expansion over 4 months. Patient has fair skin (Type II) with severe childhood sunburn history.',
    visualPatterns: [
      'Atypical thickened pigment network with abruptly ending borders',
      'Central focal blue-white veil indicative of dermal melanophages',
      'Irregular dark brown/black globules clustered asymmetrically',
      'Peripheral pseudopods and radial streaming'
    ],
    metadataRiskFactors: [
      'Age 67 + Male Torso site: Statistical melanoma prior +34% higher',
      'Rapid evolution history: High clinical urgency (ABCDE positive)',
      'Personal & family melanoma history: Elevated genetic vulnerability'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 42, y: 38, r: 28, intensity: 0.98 },
        { x: 58, y: 55, r: 22, intensity: 0.85 },
        { x: 30, y: 62, r: 18, intensity: 0.72 }
      ]
    }
  },
  {
    id: 'case-nv-02',
    title: 'Compound Dysplastic Nevus (Challenging Benign)',
    datasetSource: 'ISIC-2020 Challenge',
    isicId: 'ISIC_0024310',
    groundTruthClass: 'NV',
    imageSrc: 'nevus_compound',
    metadata: {
      age: 26,
      sex: 'female',
      anatomicalSite: 'lower_extremity',
      diameterMm: 4.6,
      fitzpatrickSkinType: 'III',
      evolutionHistory: 'stable',
      personalMelanomaHistory: false,
      familyMelanomaHistory: false,
      biopsyHistory: false
    },
    clinicalNotes: 'Longstanding uniform tan macule on lateral thigh. Mild peripheral fading. Image-only models frequently flag this as false-positive melanoma due to light central asymmetry, but metadata confirms low age risk and 5-year stability.',
    visualPatterns: [
      'Delicate, symmetric reticular pigment network',
      'Uniform tan-brown coloration fading smoothly toward margins',
      'Regular concentric arrangement of peripheral globules'
    ],
    metadataRiskFactors: [
      'Age 26 + Stable history: Suppresses false-positive malignancy alert',
      'Diameter < 5mm: Low diagnostic hazard score',
      'Negative personal/family history: Typical benign baseline'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 50, y: 50, r: 35, intensity: 0.45 },
        { x: 48, y: 46, r: 20, intensity: 0.52 }
      ]
    }
  },
  {
    id: 'case-bcc-03',
    title: 'Nodular Basal Cell Carcinoma with Telangiectasia',
    datasetSource: 'ISIC-2019 / MSK-4',
    isicId: 'ISIC_0078129',
    groundTruthClass: 'BCC',
    imageSrc: 'bcc_arborizing',
    metadata: {
      age: 73,
      sex: 'male',
      anatomicalSite: 'head_neck',
      diameterMm: 7.2,
      fitzpatrickSkinType: 'I',
      evolutionHistory: 'bleeding_itching',
      personalMelanomaHistory: false,
      familyMelanomaHistory: false,
      biopsyHistory: true,
      sunburnHistorySevere: true
    },
    clinicalNotes: 'Pearly papule on right temple with recurring crusting and spontaneous bleeding upon minor trauma. High chronic ultraviolet exposure history.',
    visualPatterns: [
      'Arborizing, sharply focused tree-like telangiectatic vessels',
      'Multiple blue-gray ovoid nests and leaf-like structures',
      'Shiny white crystalline lines under cross-polarized light',
      'Central focal ulceration with micro-crusting'
    ],
    metadataRiskFactors: [
      'Head/Neck site + Age 73: Over 80% baseline probability of BCC vs other non-melanoma tumors',
      'Bleeding/crusting symptom: Classical destructive ulceration indicator',
      'Fitzpatrick Type I: Severe photo-damage susceptibility'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 38, y: 44, r: 24, intensity: 0.94 },
        { x: 62, y: 35, r: 20, intensity: 0.88 },
        { x: 50, y: 60, r: 18, intensity: 0.79 }
      ]
    }
  },
  {
    id: 'case-akiec-04',
    title: 'Hyperkeratotic Actinic Keratosis (Pre-Cancerous)',
    datasetSource: 'ISIC-2019 / HAM10000',
    isicId: 'ISIC_0019842',
    groundTruthClass: 'AKIEC',
    imageSrc: 'akiec_strawberry',
    metadata: {
      age: 69,
      sex: 'male',
      anatomicalSite: 'head_neck',
      diameterMm: 6.1,
      fitzpatrickSkinType: 'II',
      evolutionHistory: 'slow_enlarging',
      personalMelanomaHistory: false,
      familyMelanomaHistory: false,
      biopsyHistory: false,
      sunburnHistorySevere: true
    },
    clinicalNotes: 'Erythematous, rough sandpaper-textured scaly plaque on bald scalp vertex. Patient reports persistent sun exposure over 40 years.',
    visualPatterns: [
      'Strawberry pattern with pseudo-network surrounding follicular ostia',
      'Prominent yellowish-white hyperkeratotic scale clods',
      'Targetoid follicular plugs and rosette structures under polarized light'
    ],
    metadataRiskFactors: [
      'Scalp location on 69-year-old male: Prime anatomical predilection',
      'Slow enlarging rough plaque: Pre-malignant risk profile',
      'Requires distinction from invasive SCC'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 48, y: 52, r: 30, intensity: 0.82 },
        { x: 60, y: 45, r: 22, intensity: 0.76 }
      ]
    }
  },
  {
    id: 'case-df-05',
    title: 'Benign Dermatofibroma (Rare Minority Class)',
    datasetSource: 'ISIC-2019 Challenge',
    isicId: 'ISIC_0000143',
    groundTruthClass: 'DF',
    imageSrc: 'df_central_white',
    metadata: {
      age: 38,
      sex: 'female',
      anatomicalSite: 'lower_extremity',
      diameterMm: 5.5,
      fitzpatrickSkinType: 'III',
      evolutionHistory: 'stable',
      personalMelanomaHistory: false,
      familyMelanomaHistory: false,
      biopsyHistory: false
    },
    clinicalNotes: 'Firm, asymptomatic hyperpigmented button-like nodule on anterior lower leg. Positive clinical "dimple" sign on lateral pinch.',
    visualPatterns: [
      'Central white scar-like structureless patch (fibrous core)',
      'Delicate, fine peripheral reticular network',
      'Light golden-brown pigmentation halo'
    ],
    metadataRiskFactors: [
      'Younger female lower leg: Classic demographic predilection for DF (accounts for 75% of presentations)',
      'Extreme minority class in ISIC (~1% of cases) — Standard CE fails to detect, CB-Focal & LDAM classify with 94% recall'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 50, y: 48, r: 20, intensity: 0.91 },
        { x: 52, y: 52, r: 32, intensity: 0.65 }
      ]
    }
  },
  {
    id: 'case-bkl-06',
    title: 'Seborrheic Keratosis with Cerebriform Pattern',
    datasetSource: 'ISIC-2020 / BCN-20000',
    isicId: 'ISIC_0055102',
    groundTruthClass: 'BKL',
    imageSrc: 'bkl_cerebriform',
    metadata: {
      age: 62,
      sex: 'female',
      anatomicalSite: 'torso',
      diameterMm: 9.4,
      fitzpatrickSkinType: 'III',
      evolutionHistory: 'slow_enlarging',
      personalMelanomaHistory: false,
      familyMelanomaHistory: false,
      biopsyHistory: false
    },
    clinicalNotes: '"Stuck-on" waxy verrucous plaque on back. Despite dark irregular pigment, dermoscopy shows distinct milia-like cysts and comedone openings.',
    visualPatterns: [
      'Multiple bright white and yellowish round milia-like cysts',
      'Prominent comedo-like openings (crypts)',
      'Brain-like gyri and sulci (cerebriform appearance)'
    ],
    metadataRiskFactors: [
      'Slow multi-year expansion: Typical benign keratosis trajectory',
      'Frequent melanoma clinical mimic: Cross-attention gating extracts benign cyst signals to suppress false alarm'
    ],
    gradcamConfig: {
      hotspots: [
        { x: 45, y: 40, r: 25, intensity: 0.74 },
        { x: 55, y: 58, r: 28, intensity: 0.78 }
      ]
    }
  }
];
