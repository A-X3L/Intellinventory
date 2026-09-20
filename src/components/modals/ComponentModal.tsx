/**
 * @file ComponentModal.tsx
 * @description Boîte de dialogue d'ajout et modification de composants électroniques
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Layers, MapPin, Hash, Link as LinkIcon, Camera, Trash2, Upload, Printer } from 'lucide-react';
import { ElectronicComponent, PackageFormat, CATEGORIES_LIST } from '../../core/domain/types';
import { processAndCompressImage } from '../../utils/image-processor';

interface ComponentModalProps {
  isOpen: boolean;
  componentToEdit: ElectronicComponent | null;
  onClose: () => void;
  onSave: (data: Partial<ElectronicComponent>) => Promise<void>;
}

export const ComponentModal: React.FC<ComponentModalProps> = ({
  isOpen,
  componentToEdit,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<ElectronicComponent>>({
    ref: '',
    family: '',
    type: '',
    pins: '',
    footprint: 'SOIC-8',
    category: 'Logique',
    package: 'CMS/SMD',
    functionDesc: '',
    description: '',
    quantity: 10,
    minQuantity: 3,
    location: 'Casier A-01',
    datasheetUrl: '',
    imageUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (componentToEdit) {
      setFormData({ ...componentToEdit });
    } else {
      setFormData({
        ref: '',
        family: '',
        type: '',
        pins: '',
        footprint: 'SOIC-8',
        category: 'Logique',
        package: 'CMS/SMD',
        functionDesc: '',
        description: '',
        quantity: 10,
        minQuantity: 3,
        location: 'Casier A-01',
        datasheetUrl: '',
        imageUrl: ''
      });
    }
    setErrorMsg(null);
  }, [componentToEdit, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processAndCompressImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: processed.dataUrl }));
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ref?.trim()) {
      setErrorMsg('La référence marquée est obligatoire.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'enregistrement du composant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              {componentToEdit ? 'Modifier la fiche composant' : 'Ajouter un nouveau composant'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-900/30 border border-rose-700 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Ligne 1 : Référence & Famille */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Référence Marquée <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ref || ''}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                placeholder="ex: 74HC595, NE555, LM358"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Famille / Identité Exacte
              </label>
              <input
                type="text"
                value={formData.family || ''}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                placeholder="ex: 74xx595, Série 555, LDO"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Ligne 2 : Type fonctionnel & Broches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Type de Composant
              </label>
              <input
                type="text"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="ex: Registre à décalage (SIPO)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nombre de Broches
              </label>
              <input
                type="text"
                value={formData.pins || ''}
                onChange={(e) => setFormData({ ...formData, pins: e.target.value })}
                placeholder="ex: 16, 8, 3, Module"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Ligne 3 : Boîtier (Footprint) & Format de montage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Boîtier / Footprint normalisé
              </label>
              <input
                type="text"
                value={formData.footprint || ''}
                onChange={(e) => setFormData({ ...formData, footprint: e.target.value })}
                placeholder="ex: SOIC-16, DIP-8, TO-220, SOT-23, 0805"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Format de Montage
              </label>
              <select
                value={formData.package || 'CMS/SMD'}
                onChange={(e) => setFormData({ ...formData, package: e.target.value as PackageFormat })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="CMS/SMD">CMS / SMD</option>
                <option value="Traversant/DIP">Traversant / DIP</option>
                <option value="Récupération">Récupération</option>
                <option value="Module">Module PCB</option>
              </select>
            </div>
          </div>

          {/* Ligne 4 : Catégorie & Emplacement Atelier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="ex: Logique, Alimentation, Discrets"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <datalist id="category-suggestions">
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Emplacement physique en atelier
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="ex: Casier B-02, Tiroir CMS-4, Bac 12"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Ligne 5 : Quantité en Stock & Seuil d'Alerte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Quantité en stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity ?? 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Seuil d'alerte réapprovisionnement
              </label>
              <input
                type="number"
                min="0"
                value={formData.minQuantity ?? 0}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Ligne 6 : Lien Datasheet */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> Lien Documentation / Datasheet (URL)
            </label>
            <input
              type="url"
              value={formData.datasheetUrl || ''}
              onChange={(e) => setFormData({ ...formData, datasheetUrl: e.target.value })}
              placeholder="https://www.ti.com/lit/ds/symlink/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          {/* Ligne 7 : Fonction principale */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Fonction principale
            </label>
            <input
              type="text"
              value={formData.functionDesc || ''}
              onChange={(e) => setFormData({ ...formData, functionDesc: e.target.value })}
              placeholder="ex: Entrée série / Sorties parallèles, régulation LDO 3.3V"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Ligne 8 : Description / Application */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Description &amp; Notes d'application
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ex: Multiplicateur de sorties pour microcontrôleur Arduino/ESP32, découplage 100nF recommandé."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Ligne 9 : Photo du composant */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-400" /> Photo du composant
            </label>
            {formData.imageUrl ? (
              <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <img
                  src={formData.imageUrl}
                  alt="Aperçu composant"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-600 shadow"
                />
                <div className="flex-1 text-xs text-slate-400">
                  <p className="font-semibold text-slate-200">Image attachée</p>
                  <p className="text-[11px] text-slate-500">Enregistrée dans la base IndexedDB locale</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                  title="Supprimer la photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-slate-900/60 border border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Associer ou importer une photo (JPG, PNG, WebP)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700">
            <div>
              {Boolean(formData.ref) && (
                <button
                  type="button"
                  id="btn-print-datasheet"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-600 transition-colors"
                  title="Imprimer la fiche technique d'atelier de ce composant"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer fiche atelier</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la fiche'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
