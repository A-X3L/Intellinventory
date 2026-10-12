/**
 * @file Header.tsx
 * @description Barre d'en-tête principale avec actions d'inventaire et indicateur de sécurité
 */

import React from 'react';
import { 
  Cpu, 
  Bot, 
  Plus, 
  Download,
  Camera,
  Printer,
  QrCode,
  Smartphone
} from 'lucide-react';
import { AiStatusResponse } from '../services/ai.service';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenScannerModal?: () => void;
  onOpenMobileModal: () => void;
  onOpenAiModal: () => void;
  onOpenExportImportModal: () => void;
  onResetData: () => void;
  aiStatus: AiStatusResponse | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenMobileModal,
  onOpenAiModal,
  onOpenExportImportModal,
  aiStatus
}) => {
  return (
    <header className="bg-slate-800/95 backdrop-blur border-b border-slate-700 shadow-md sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
        {/* Titre & Logo */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20 text-white flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Inventaire Composants Électroniques
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                IndexedDB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestion d'atelier, localisation en casiers &amp; assistant technique
            </p>
          </div>
        </div>

        {/* Boutons d'actions - Alignés sur une seule ligne */}
        <div className="flex items-center gap-2 flex-nowrap flex-shrink-0">
          {/* Bouton Ajouter Manuellement (Couleur vert pomme) */}
          <button
            id="btn-open-add"
            type="button"
            onClick={onOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
            title="Ajouter un nouveau composant à l'atelier"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>

          {/* Bouton Terminal Mobile (/capture) - Ouvre la modale QR Code */}
          <button
            id="btn-open-mobile-capture"
            type="button"
            onClick={onOpenMobileModal}
            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/25 border border-amber-500/30"
            title="Connexion smartphone / tablette par QR Code (sans nouvel onglet)"
          >
            <QrCode className="w-4 h-4 text-amber-200" />
            <span>Terminal Mobile</span>
          </button>

          {/* Bouton Assistant IA avec indicateur */}
          <button
            id="btn-open-ai"
            type="button"
            onClick={onOpenAiModal}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-purple-600/25"
          >
            <Bot className="w-4 h-4" />
            <span>Assistant IA</span>
            {aiStatus?.configured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Serveur Gemini Opérationnel" />
            )}
          </button>

          {/* Bouton Import / Export */}
          <button
            id="btn-open-io"
            type="button"
            onClick={onOpenExportImportModal}
            className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 border border-slate-600"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sauvegarde &amp; Export</span>
          </button>

          {/* Bouton Impression Atelier */}
          <button
            id="btn-print-inventory"
            type="button"
            onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 border border-slate-600"
            title="Imprimer l'inventaire ou la fiche atelier (format papier clair et contrasté)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
