/**
 * @file ResetModal.tsx
 * @description Modale sécurisée de gestion et réinitialisation de l'inventaire local
 */

import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => Promise<void>;
  onRestoreBackup: () => Promise<void>;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onClearAll,
  onRestoreBackup
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Réinitialisation de l'Atelier</h3>
              <p className="text-xs text-slate-400">Gestion de la persistance locale IndexedDB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <p className="flex items-start gap-2 text-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Choisissez le niveau de réinitialisation souhaité pour votre établi :
            </span>
          </p>
          <p className="text-slate-400 leading-relaxed pl-6">
            Par défaut, les modifications et suppressions sont sauvegardées directement sur votre machine. Le fichier CSV initial ne sera jamais réinjecté contre votre gré.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Option 1 : Vider proprement (Reset usine sans rechargement seed) */}
          <button
            type="button"
            onClick={async () => {
              await onClearAll();
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-600/50 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-rose-300">
                Vider intégralement l'atelier (Reset propre)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Efface tous les composants de la base IndexedDB. Repartez d'une base vierge prête pour vos propres pièces (le seed ne sera pas rechargé).
              </div>
            </div>
          </button>

          {/* Option 2 : Restaurer le backup technique d'origine */}
          <button
            type="button"
            onClick={async () => {
              await onRestoreBackup();
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600/50 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white group-hover:text-amber-300">
                Restaurer le backup CSV d'origine (Secours)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Recharge les 59 composants de référence techniques du fichier initial de l'atelier.
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-700/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
