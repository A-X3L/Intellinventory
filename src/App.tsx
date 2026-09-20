/**
 * @file App.tsx
 * @description Composant racine de l'application de gestion d'inventaire de composants électroniques
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ElectronicComponent, 
  InventoryFilter, 
  StockMetrics,
  DEFAULT_COMPONENTS_SEEDS
} from './core/domain/types';
import { componentRepository } from './infrastructure/persistence/indexed-db.repository';
import { AiService, AiStatusResponse } from './services/ai.service';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { ComponentTable } from './components/ComponentTable';
import { 
  ComponentModal, 
  ScannerModal, 
  AIModal, 
  ExportImportModal 
} from './components/modals';

export default function App() {
  const [components, setComponents] = useState<ElectronicComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  // État des filtres
  const [filter, setFilter] = useState<InventoryFilter>({
    search: '',
    category: 'ALL',
    packageType: 'ALL',
    lowStockOnly: false,
    sortBy: 'ref',
    sortDirection: 'asc'
  });

  // États des boîtes de dialogue modales
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<ElectronicComponent | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);

  // Initialisation du stockage IndexedDB et du statut de l'IA
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await componentRepository.init();
        const loaded = await componentRepository.getAll();
        if (isMounted) {
          if (loaded && loaded.length > 0) {
            setComponents(loaded);
          } else {
            const fallbackDefaults = DEFAULT_COMPONENTS_SEEDS.map((s) => ({
              ...s,
              id: `seed-${s.ref.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              updatedAt: Date.now()
            }));
            setComponents(fallbackDefaults);
          }
        }
      } catch (err) {
        console.error('Erreur d\'initialisation IndexedDB :', err);
        if (isMounted) {
          const fallbackDefaults = DEFAULT_COMPONENTS_SEEDS.map((s) => ({
            ...s,
            id: `seed-${s.ref.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            updatedAt: Date.now()
          }));
          setComponents(fallbackDefaults);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      // Vérifier le statut de l'IA serveur
      try {
        const status = await AiService.getStatus();
        if (isMounted) setAiStatus(status);
      } catch (e) {
        console.warn('Statut IA non disponible :', e);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Catégories distinctes existantes
  const availableCategories = useMemo(() => {
    const set = new Set(components.map((c) => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [components]);

  // Calcul des métriques KPI de l'atelier
  const metrics: StockMetrics = useMemo(() => {
    const totalReferences = components.length;
    let totalQuantity = 0;
    let cmsCount = 0;
    let dipCount = 0;
    let moduleCount = 0;
    let lowStockCount = 0;

    for (const c of components) {
      totalQuantity += c.quantity || 0;
      if (c.package === 'CMS/SMD') cmsCount++;
      else if (c.package === 'Traversant/DIP') dipCount++;
      else if (c.package === 'Module' || c.package === 'Récupération') moduleCount++;

      if (c.quantity <= c.minQuantity) {
        lowStockCount++;
      }
    }

    return {
      totalReferences,
      totalQuantity,
      cmsCount,
      dipCount,
      moduleCount,
      categoriesCount: availableCategories.length,
      lowStockCount
    };
  }, [components, availableCategories]);

  // Filtrage et tri réactifs
  const filteredComponents = useMemo(() => {
    const s = filter.search.toLowerCase().trim();

    return components
      .filter((item) => {
        // Recherche multi-champs
        const matchSearch = !s || (
          item.ref.toLowerCase().includes(s) ||
          item.family.toLowerCase().includes(s) ||
          item.type.toLowerCase().includes(s) ||
          item.footprint.toLowerCase().includes(s) ||
          item.pins.toLowerCase().includes(s) ||
          item.location.toLowerCase().includes(s) ||
          item.functionDesc.toLowerCase().includes(s) ||
          item.description.toLowerCase().includes(s) ||
          item.category.toLowerCase().includes(s)
        );

        const matchCat = filter.category === 'ALL' || item.category === filter.category;
        const matchPkg = filter.packageType === 'ALL' || item.package === filter.packageType;
        const matchLow = !filter.lowStockOnly || (item.quantity <= item.minQuantity);

        return matchSearch && matchCat && matchPkg && matchLow;
      })
      .sort((a, b) => {
        let valA: any = a[filter.sortBy] ?? '';
        let valB: any = b[filter.sortBy] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return filter.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return filter.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [components, filter]);

  // Gestionnaires d'événements
  const handleSort = (column: InventoryFilter['sortBy']) => {
    setFilter((prev) => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleOpenAddModal = () => {
    setComponentToEdit(null);
    setIsComponentModalOpen(true);
  };

  const handleOpenEditModal = (component: ElectronicComponent) => {
    setComponentToEdit(component);
    setIsComponentModalOpen(true);
  };

  const handleSaveComponent = async (data: Partial<ElectronicComponent>) => {
    const isNew = !data.id;
    const itemToSave: ElectronicComponent = {
      id: data.id || crypto.randomUUID(),
      ref: data.ref?.trim() || 'SANS_REF',
      family: data.family?.trim() || '',
      type: data.type?.trim() || '',
      pins: data.pins?.trim() || 'N/A',
      footprint: data.footprint?.trim() || 'N/A',
      category: data.category?.trim() || 'Divers',
      package: data.package || 'CMS/SMD',
      functionDesc: data.functionDesc?.trim() || '',
      description: data.description?.trim() || '',
      quantity: Math.max(0, parseInt(String(data.quantity), 10) || 0),
      minQuantity: Math.max(0, parseInt(String(data.minQuantity), 10) || 0),
      location: data.location?.trim() || 'Casier A-01',
      datasheetUrl: data.datasheetUrl?.trim(),
      updatedAt: Date.now()
    };

    await componentRepository.save(itemToSave);

    setComponents((prev) => {
      if (isNew) {
        return [itemToSave, ...prev];
      }
      return prev.map((c) => (c.id === itemToSave.id ? itemToSave : c));
    });
  };

  const handleDeleteComponent = async (id: string, ref: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le composant "${ref}" de votre stock ?`)) {
      await componentRepository.delete(id);
      setComponents((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleQuickAdjustQuantity = async (id: string, delta: number) => {
    const target = components.find((c) => c.id === id);
    if (!target) return;

    const newQty = Math.max(0, target.quantity + delta);
    const updated: ElectronicComponent = {
      ...target,
      quantity: newQty,
      updatedAt: Date.now()
    };

    await componentRepository.save(updated);
    setComponents((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleResetFactoryData = async () => {
    const confirmed = window.confirm(
      "Attention : Voulez-vous réinitialiser l'inventaire avec la bibliothèque d'usine d'atelier ? Vos ajouts personnalisés seront remplacés."
    );
    if (confirmed) {
      setIsLoading(true);
      try {
        const resetList = await componentRepository.resetToDefault();
        setComponents(resetList);
        setFilter((prev) => ({ ...prev, search: '', category: 'ALL', packageType: 'ALL', lowStockOnly: false }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImportBatch = async (importedList: ElectronicComponent[], overwrite: boolean) => {
    await componentRepository.importBatch(importedList, overwrite);
    const refreshed = await componentRepository.getAll();
    setComponents(refreshed);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* En-tête */}
      <Header
        onOpenAddModal={handleOpenAddModal}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenExportImportModal={() => setIsExportImportModalOpen(true)}
        onResetData={handleResetFactoryData}
        aiStatus={aiStatus}
      />

      {/* Corps principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-grow w-full print:p-0 print:max-w-full">
        {/* En-tête d'impression spécifique atelier (@media print) */}
        <div className="hidden print:block mb-4 pb-3 border-b-2 border-black text-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">
                Intellinventory • Fiche d'Inventaire Atelier
              </h1>
              <p className="text-xs text-gray-700">
                Gestion des stocks de composants électroniques &amp; localisation en casiers
              </p>
            </div>
            <div className="text-right text-xs text-gray-700 font-mono">
              <p>Édité le : <strong>{new Date().toLocaleDateString('fr-FR')}</strong> à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="font-bold mt-0.5">{filteredComponents.length} référence(s) répertoriée(s)</p>
            </div>
          </div>
          {(filter.search || filter.category !== 'ALL' || filter.packageType !== 'ALL' || filter.lowStockOnly) && (
            <div className="mt-2 text-xs bg-gray-100 p-2 border border-gray-300 font-mono">
              <span className="font-semibold">Filtres appliqués : </span>
              {filter.search && <span>Recherche : &laquo; {filter.search} &raquo; • </span>}
              {filter.category !== 'ALL' && <span>Catégorie : {filter.category} • </span>}
              {filter.packageType !== 'ALL' && <span>Format : {filter.packageType} • </span>}
              {filter.lowStockOnly && <span className="font-bold text-rose-700">Alertes Stock Faible • </span>}
            </div>
          )}
        </div>

        {/* Cartes d'indicateurs de stock informatives */}
        <div className="print:hidden">
          <StatsCards metrics={metrics} />
        </div>

        {/* Barre de recherche et filtres d'atelier */}
        <FilterBar
          filter={filter}
          categories={availableCategories}
          onFilterChange={(newFields) => setFilter((prev) => ({ ...prev, ...newFields }))}
          onResetFilter={() => setFilter((prev) => ({ ...prev, search: '', category: 'ALL', packageType: 'ALL', lowStockOnly: false }))}
          onResetFactoryData={handleResetFactoryData}
          totalFiltered={filteredComponents.length}
        />

        {/* Tableau de données ou état de chargement */}
        {isLoading ? (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center shadow-md text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Chargement de la base de données de composants...</p>
          </div>
        ) : (
          <ComponentTable
            components={filteredComponents}
            filter={filter}
            onSort={handleSort}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteComponent}
            onQuickAdjustQuantity={handleQuickAdjustQuantity}
          />
        )}
      </main>

      {/* Pied de page */}
      <footer className="bg-slate-950 border-t border-slate-800 text-center py-4 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Inventaire Électronique Industriel • Persistance Locale IndexedDB Transactionnelle</span>
          <span className="text-slate-400">
            Proxy IA Backend Sécurisé • Clé Protégée
          </span>
        </div>
      </footer>

      {/* Boîtes modales */}
      <ComponentModal
        isOpen={isComponentModalOpen}
        componentToEdit={componentToEdit}
        onClose={() => setIsComponentModalOpen(false)}
        onSave={handleSaveComponent}
      />

      <ScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSaveComponent={handleSaveComponent}
      />

      <AIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        inventory={components}
      />

      <ExportImportModal
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        inventory={components}
        onImport={handleImportBatch}
      />
    </div>
  );
}
