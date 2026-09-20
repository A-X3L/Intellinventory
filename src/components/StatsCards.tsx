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
  Tags, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { StockMetrics } from '../core/domain/types';

interface StatsCardsProps {
  metrics: StockMetrics;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ metrics }) => {
  const hasLowStock = metrics.lowStockCount > 0;

  return (
    <div className="space-y-3.5 mb-6">
      {/* 1. Grille des 4 compteurs purement informatifs et non cliquables */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Références & Quantité globale */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Références</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">{metrics.totalReferences}</p>
              <span className="text-xs text-slate-400 font-mono">({metrics.totalQuantity} pcs)</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Composants CMS / SMD */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Boîtiers CMS / SMD</p>
            <p className="text-2xl font-extrabold text-blue-400 font-mono mt-0.5">{metrics.cmsCount}</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Traversants & Modules */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">DIP &amp; Modules</p>
            <p className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">{metrics.dipCount + (metrics.moduleCount || 0)}</p>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Catégories répertoriées */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-center justify-between select-none">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Catégories</p>
            <p className="text-2xl font-extrabold text-purple-400 font-mono mt-0.5">{metrics.categoriesCount}</p>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Tags className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Indicateur d'alerte critique strictement dissocié et non cliquable */}
      <div 
        className={`rounded-xl px-4 py-2.5 border flex items-center justify-between select-none transition-colors ${
          hasLowStock 
            ? 'bg-rose-950/30 border-rose-800/60 text-rose-300' 
            : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {hasLowStock ? (
            <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div className="text-xs">
            {hasLowStock ? (
              <span>
                <strong className="font-semibold text-rose-200">Alerte Stock Critique :</strong>{' '}
                <span className="font-mono font-bold text-rose-300">{metrics.lowStockCount}</span> référence(s) sous le seuil d'approvisionnement minimal d'atelier.
              </span>
            ) : (
              <span>
                <strong className="font-semibold text-slate-300">État du stock nominal :</strong> Aucun composant sous le seuil critique d'approvisionnement.
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          {hasLowStock ? 'Filtrage disponible via la barre d\'outils ci-dessous' : 'Atelier opérationnel'}
        </div>
      </div>
    </div>
  );
};

