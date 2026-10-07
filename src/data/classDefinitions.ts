import { ClassDefinition, SkinLesionClass } from '../types';

export const LESION_CLASSES: Record<SkinLesionClass, ClassDefinition> = {
  MEL: {
    code: 'MEL',
    name: 'Melanoma',
    fullName: 'Malignant Melanoma (Cutaneous)',
    category: 'Malignant',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 1113, // HAM10000 preprocessed metadata
    clinicalDescription: 'High-mortality malignant neoplasm of melanocytes. Requires prompt wide local surgical excision.',
    dermoscopyMarkers: [
      'Atypical pigment network (thickened, branched lines)',
      'Blue-white veil with irregular regression zones',
      'Asymmetric irregular brown/black globules & dots',
      'Peripheral streaks & pseudopods'
    ]
  },
  NV: {
    code: 'NV',
    name: 'Melanocytic Nevus',
    fullName: 'Benign Melanocytic Nevus (Mole)',
    category: 'Benign',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 6705, // HAM10000 preprocessed metadata
    clinicalDescription: 'Common benign proliferation of melanocytes. Uniform coloration and symmetric borders.',
    dermoscopyMarkers: [
      'Delicate, symmetric reticular pigment network',
      'Regular peripheral brown globules with central fading',
      'Uniform homogeneous pigment distribution'
    ]
  },
  BCC: {
    code: 'BCC',
    name: 'Basal Cell Carcinoma',
    fullName: 'Basal Cell Carcinoma',
    category: 'Malignant',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 514, // HAM10000 preprocessed metadata
    clinicalDescription: 'Most common non-melanoma skin cancer. Locally invasive with low metastatic risk, high cure rate.',
    dermoscopyMarkers: [
      'Arborizing (tree-branching) telangiectasias',
      'Ulceration with shiny white crystalline structures',
      'Blue-gray ovoid nests and spoke-wheel globules'
    ]
  },
  AKIEC: {
    code: 'AKIEC',
    name: 'Actinic Keratosis',
    fullName: 'Actinic Keratosis / Intraepithelial Carcinoma',
    category: 'Premalignant',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 327, // HAM10000 preprocessed metadata
    clinicalDescription: 'Pre-cancerous scaly sun-damaged lesion with potential progression to invasive Squamous Cell Carcinoma.',
    dermoscopyMarkers: [
      'Strawberry pattern (pseudo-network of erythema around follicular openings)',
      'Keratotic follicular plugs with rosettes under polarized light',
      'Yellow-white scaling scales on erythematous background'
    ]
  },
  BKL: {
    code: 'BKL',
    name: 'Benign Keratosis',
    fullName: 'Seborrheic Keratosis / Solar Lentigo / Lichenoid',
    category: 'Benign',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 1099, // HAM10000 preprocessed metadata
    clinicalDescription: 'Harmless epidermal tumor common in older adults. Often mimics melanoma clinically.',
    dermoscopyMarkers: [
      'Milia-like cysts (bright round white/yellow clods)',
      'Comedone-like openings (crypts)',
      'Brain-like gyri and sulci (cerebriform pattern)'
    ]
  },
  DF: {
    code: 'DF',
    name: 'Dermatofibroma',
    fullName: 'Benign Dermatofibroma',
    category: 'Benign',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 115, // HAM10000 preprocessed metadata
    clinicalDescription: 'Firm benign cutaneous nodule commonly found on lower extremities.',
    dermoscopyMarkers: [
      'Central white scar-like patch',
      'Delicate, faint peripheral pigment network',
      'Positive "pinch sign" (dimple sign)'
    ]
  },
  VASC: {
    code: 'VASC',
    name: 'Vascular Lesion',
    fullName: 'Vascular Lesion (Angioma, Pyogenic Granuloma)',
    category: 'Benign',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 142, // HAM10000 preprocessed metadata
    clinicalDescription: 'Vascular anomalies composed of blood vessels. Readily identified by red-purple lacunae.',
    dermoscopyMarkers: [
      'Red, purple, or dark blue round lacunae (lagunes)',
      'Fibrous septa partitioning the vascular spaces',
      'Absence of melanocytic pigment networks'
    ]
  },
  SCC: {
    code: 'SCC',
    name: 'Squamous Carcinoma',
    fullName: 'Invasive Squamous Cell Carcinoma',
    category: 'Malignant',
    color: '#ef4444',
    bgBadge: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    borderBadge: 'border-red-500/50',
    isicFrequency: 62, // HAM10000 preprocessed metadata
    clinicalDescription: 'Second most common skin cancer with capacity for nodal metastasis. Arises from epidermal keratinocytes.',
    dermoscopyMarkers: [
      'Targetoid hairpin vessels with white keratotic halo',
      'Central crateriform ulceration filled with keratin crust',
      'White structureless areas & targetoid follicular clods'
    ]
  }
};

export const TOTAL_BENCHMARK_SAMPLES = Object.values(LESION_CLASSES).reduce((acc, c) => acc + c.isicFrequency, 0);
