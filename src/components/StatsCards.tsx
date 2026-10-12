/**
 * @file StatsCards.tsx
 * @description Blocs d'affichage des métriques de stock et indicateur dissocié d'alerte critique
 * Compteurs purement informatifs et non cliquables conformément aux spécifications d'atelier.
 */

import React from 'react';
import { 
  Boxes, 
  Layers, 
  Cpu, 
  Tags 
} from 'lucide-react';
import { StockMetrics } from '../core/domain/types';

interface StatsCardsProps {
  metrics: StockMetrics;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ metrics }) => {
  return (
    <div className="mb-6">
      {/* Grille des 4 compteurs purement informatifs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stock Total & Références */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Stock Total Pièces</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                {metrics.totalQuantity.toLocaleString('fr-FR')} <span className="text-sm font-semibold">pcs</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">({metrics.totalReferences} réf. répertoriées)</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Composants CMS / SMD */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Boîtiers CMS / SMD</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-blue-400 font-mono">
                {metrics.cmsCount.toLocaleString('fr-FR')} <span className="text-sm font-semibold">pcs</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">({metrics.cmsRefsCount} réf. CMS)</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Traversants & Modules */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">DIP &amp; Modules</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-amber-400 font-mono">
                {(metrics.dipCount + (metrics.moduleCount || 0)).toLocaleString('fr-FR')} <span className="text-sm font-semibold">pcs</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ({metrics.dipRefsCount + (metrics.moduleRefsCount || 0)} réf.
              {metrics.moduleRefsCount > 0 ? ` : ${metrics.dipRefsCount} DIP, ${metrics.moduleRefsCount} mod.` : ' DIP'})
            </p>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Catégories répertoriées */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Catégories</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-purple-400 font-mono">{metrics.categoriesCount}</p>
              <span className="text-xs text-slate-400">familles</span>
            </div>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Tags className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

