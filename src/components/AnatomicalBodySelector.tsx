import React from 'react';
import { AnatomicalSite } from '../types';
import { MapPin } from 'lucide-react';

export interface AnatomicalBodySelectorProps {
  selectedSite: AnatomicalSite;
  onChangeSite?: (site: AnatomicalSite) => void;
  onSelectSite?: (site: AnatomicalSite) => void;
}

export const AnatomicalBodySelector: React.FC<AnatomicalBodySelectorProps> = ({
  selectedSite,
  onChangeSite,
  onSelectSite,
}) => {
  const handleSelect = (site: AnatomicalSite) => {
    if (onSelectSite) {
      onSelectSite(site);
    }
    if (onChangeSite) {
      onChangeSite(site);
    }
  };

  const sites: Array<{
    id: AnatomicalSite;
    label: string;
    sublabel: string;
    riskCategory: 'High BCC/AK Risk' | 'High Melanoma Risk' | 'Moderate Risk' | 'Special Site';
  }> = [
    {
      id: 'torso',
      label: 'Torso / Trunk',
      sublabel: 'Back, Chest, Abdomen',
      riskCategory: 'High Melanoma Risk',
    },
    {
      id: 'head_neck',
      label: 'Head & Neck',
      sublabel: 'Face, Scalp, Ears, Neck',
      riskCategory: 'High BCC/AK Risk',
    },
    {
      id: 'upper_extremity',
      label: 'Upper Extremity',
      sublabel: 'Arms, Forearms, Shoulders',
      riskCategory: 'Moderate Risk',
    },
    {
      id: 'lower_extremity',
      label: 'Lower Extremity',
      sublabel: 'Thighs, Legs, Calves',
      riskCategory: 'High Melanoma Risk',
    },
    {
      id: 'palms_soles',
      label: 'Palms & Soles (Acral)',
      sublabel: 'Glabrous Skin, Subungual',
      riskCategory: 'Special Site',
    },
    {
      id: 'oral_genital',
      label: 'Oral & Mucosal',
      sublabel: 'Lips, Mucosa',
      riskCategory: 'Special Site',
    }
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Anatomical Lesion Site</span>
        </label>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Embedding Tokenizer</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sites.map((site) => {
          const isSelected = selectedSite === site.id;
          return (
            <button
              key={site.id}
              type="button"
              id={`anatomical-site-${site.id}`}
              onClick={() => handleSelect(site.id)}
              className={`p-2.5 rounded-xl text-left transition-all duration-150 relative border cursor-pointer ${
                isSelected
                  ? 'bg-cyan-50 dark:bg-black border-2 border-cyan-500 dark:border-white text-cyan-950 dark:text-white shadow-sm ring-1 ring-cyan-500/40 dark:ring-0 dark:shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 dark:bg-black dark:border-neutral-800 dark:hover:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-950 dark:text-white font-bold' : 'text-slate-800 dark:text-neutral-200'}`}>
                  {site.label}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-white shadow-[0_0_8px_#ffffff]"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 line-clamp-1 mb-1.5">
                {site.sublabel}
              </p>
              <span className="inline-block max-w-full break-words text-center leading-tight text-[9px] font-mono px-1.5 py-0.5 rounded border bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold">
                {site.riskCategory}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
