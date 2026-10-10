/**
 * @file FilterBar.tsx
 * @description Barre de recherche, filtres par catégorie, format et alertes de stock
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  RotateCcw, 
  AlertCircle,
  Mic,
  MicOff,
  Radio
} from 'lucide-react';
import { InventoryFilter } from '../core/domain/types';

interface FilterBarProps {
  filter: InventoryFilter;
  categories: string[];
  onFilterChange: (newFilter: Partial<InventoryFilter>) => void;
  onResetFilter: () => void;
  onResetFactoryData: () => void;
  totalFiltered: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  categories,
  onFilterChange,
  onResetFilter,
  onResetFactoryData,
  totalFiltered
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' && 
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleVoiceSearch = () => {
    if (!isSpeechSupported) {
      setSpeechError("Reconnaissance vocale non prise en charge par ce navigateur.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript.trim();
          if (transcript) {
            onFilterChange({ search: transcript });
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('[Dictée vocale] Notification :', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Erreur vocale : ${event.error}`);
          setTimeout(() => setSpeechError(null), 3500);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Dictée vocale] Erreur d\'initialisation :', err);
      setIsListening(false);
      setSpeechError("Impossible d'accéder au microphone.");
      setTimeout(() => setSpeechError(null), 3500);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const hasActiveFilters = Boolean(
    filter.search.trim() ||
    filter.category !== 'ALL' ||
    filter.packageType !== 'ALL' ||
    filter.lowStockOnly
  );

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-6 shadow-sm space-y-3.5 print:hidden">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Champ de recherche avec Dictée Vocale intégrée */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-input"
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Rechercher par réf, boîtier, casier, fonction..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-16 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {filter.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ search: '' })}
                className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                title="Effacer le texte de recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Bouton Microphone Dictée Vocale Locale */}
            <button
              id="btn-voice-dictation"
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40'
                  : isSpeechSupported
                  ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                  : 'text-slate-600 opacity-50 cursor-not-allowed'
              }`}
              title={
                !isSpeechSupported
                  ? 'Dictée vocale Web Speech API non supportée sur ce navigateur'
                  : isListening
                  ? 'Dictée en cours d\'écoute... Cliquez pour stopper'
                  : 'Dicter vocalement la recherche (Web Speech API locale, sans coût)'
              }
              aria-label="Dictée vocale atelier"
            >
              {isListening ? (
                <Radio className="w-4 h-4 animate-spin text-white" />
              ) : isSpeechSupported ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Indicateur d'écoute vocale atelier */}
        {isListening && (
          <div className="w-full flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
            <span className="font-medium">Dictée active : Parlez distinctement (ex: &laquo; NE555 &raquo;, &laquo; condensateur &raquo;, &laquo; Casier B2 &raquo;)...</span>
          </div>
        )}
        {speechError && (
          <div className="w-full text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl px-3 py-1">
            {speechError}
          </div>
        )}

        {/* Sélecteurs de filtres */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filtre Catégorie */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Catégorie :</span>
            <select
              id="filter-category"
              value={filter.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Toutes ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Format */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Format :</span>
            <select
              id="filter-package"
              value={filter.packageType}
              onChange={(e) => onFilterChange({ packageType: e.target.value })}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tous les formats</option>
              <option value="CMS/SMD" className="bg-slate-900">CMS / SMD</option>
              <option value="Traversant/DIP" className="bg-slate-900">Traversant / DIP</option>
              <option value="Module" className="bg-slate-900">Modules</option>
            </select>
          </div>

          {/* Bouton Toggle Stock Faible */}
          <button
            type="button"
            id="filter-low-stock-btn"
            onClick={() => onFilterChange({ lowStockOnly: !filter.lowStockOnly })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              filter.lowStockOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Stock Faible</span>
          </button>

          {/* Effacer les filtres */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilter}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 underline"
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* Résumé des résultats et bouton réinitialiser les données d'usine */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/50">
        <div>
          <span>{totalFiltered} référence(s) trouvée(s)</span>
          {hasActiveFilters && <span className="ml-1 text-emerald-400 font-medium">(filtré)</span>}
        </div>

        <button
          type="button"
          onClick={onResetFactoryData}
          className="text-rose-400/80 hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors"
          title="Réinitialise l'inventaire avec la base de données standard de composants"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Réinitialiser bibliothèque d'usine</span>
        </button>
      </div>
    </div>
  );
};
