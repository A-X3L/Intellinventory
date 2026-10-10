/**
 * @file ExportImportModal.tsx
 * @description Boîte de dialogue pour l'exportation (JSON/CSV) et l'importation sécurisée avec validation
 */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  FolderArchive
} from 'lucide-react';
import { ElectronicComponent } from '../../core/domain/types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: ElectronicComponent[];
  onImport: (components: ElectronicComponent[], overwrite: boolean) => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onImport
}) => {
  const [importedPreview, setImportedPreview] = useState<ElectronicComponent[] | null>(null);
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Exportation JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `inventaire_electronique_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatusMessage("Export JSON téléchargé avec succès.");
  };

  // 2. Exportation CSV (compatible Excel & LibreOffice)
  const handleExportCsv = () => {
    const headers = [
      'Reference',
      'Famille',
      'Type',
      'Broches',
      'Boitier',
      'Categorie',
      'Format',
      'Quantite',
      'Seuil_Min',
      'Emplacement',
      'Fonction',
      'Description',
      'Datasheet'
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = inventory.map((c) => [
      escapeCsv(c.ref),
      escapeCsv(c.family),
      escapeCsv(c.type),
      escapeCsv(c.pins),
      escapeCsv(c.footprint),
      escapeCsv(c.category),
      escapeCsv(c.package),
      c.quantity,
      c.minQuantity,
      escapeCsv(c.location),
      escapeCsv(c.functionDesc),
      escapeCsv(c.description),
      escapeCsv(c.datasheetUrl)
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const a = document.createElement('a');
    a.href = csvContent;
    a.download = `inventaire_electronique_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatusMessage("Export CSV tableur téléchargé avec succès.");
  };

  // 3. Importation de fichier JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (!Array.isArray(raw)) {
          throw new Error("Le fichier ne contient pas un tableau JSON valide.");
        }
        if (raw.length === 0) {
          throw new Error("Le fichier est vide.");
        }
        setImportedPreview(raw);
      } catch (err: any) {
        setErrorMessage("Format de fichier JSON invalide : " + err.message);
        setImportedPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // 4. Confirmer l'importation
  const handleConfirmImport = async () => {
    if (!importedPreview) return;
    try {
      await onImport(importedPreview, overwriteMode);
      setStatusMessage(`${importedPreview.length} composant(s) importé(s) avec succès.`);
      setImportedPreview(null);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Sauvegarde &amp; Échange de Données</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm">
          {statusMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-700/60 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1 : Export */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              1. Exporter l'inventaire ({inventory.length} pièces)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Fichier JSON</p>
                    <p className="text-[10px] text-slate-500">Sauvegarde structurée intégrale</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Fichier CSV</p>
                    <p className="text-[10px] text-slate-500">Tableur (Excel / Calc / ERP)</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
              </button>

              <a
                href="/inventaire_source.csv"
                download="inventaire_source.csv"
                className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-700/50 hover:border-emerald-500 text-slate-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <div className="text-left">
                    <p className="font-semibold text-xs text-emerald-300">Fichier Source de Vérité (CSV Original)</p>
                    <p className="text-[10px] text-slate-400">Télécharger le fichier de référence source (59 composants certifiés)</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
              </a>
            </div>
          </div>

          {/* Section 2 : Import */}
          <div className="space-y-3 border-t border-slate-700 pt-5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              2. Importer une sauvegarde JSON
            </h4>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-5 bg-slate-900/50 cursor-pointer transition-colors group">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-300">
                Sélectionnez ou glissez votre fichier .json
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Formats de sauvegarde automatique et exports pris en charge
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Aperçu avant import */}
            {importedPreview && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs">
                    {importedPreview.length} composant(s) détecté(s)
                  </span>
                  <span className="text-[11px] text-slate-400">Prêt pour injection</span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!overwriteMode}
                      onChange={() => setOverwriteMode(false)}
                      className="accent-emerald-500"
                    />
                    <span>Fusionner avec le stock existant (met à jour sans effacer)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-rose-300">
                    <input
                      type="radio"
                      name="importMode"
                      checked={overwriteMode}
                      onChange={() => setOverwriteMode(true)}
                      className="accent-rose-500"
                    />
                    <span>Écraser et remplacer intégralement l'inventaire actuel</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportedPreview(null)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                  >
                    Annuler sélection
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                  >
                    Valider l'importation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
