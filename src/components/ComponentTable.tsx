/**
 * @file ComponentTable.tsx
 * @description Tableau industriel de gestion du stock de composants
 * Élimination du débordement textuel, largeurs de colonnes contenues et mode édition directe au clic.
 */

import React from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  FileText, 
  MapPin, 
  Plus, 
  Minus, 
  AlertTriangle,
  PackageOpen,
  Cpu,
  Recycle
} from 'lucide-react';
import { ElectronicComponent, InventoryFilter, normalizePackageFormat } from '../core/domain/types';

interface ComponentTableProps {
  components: ElectronicComponent[];
  filter: InventoryFilter;
  onSort: (column: InventoryFilter['sortBy']) => void;
  onEdit: (component: ElectronicComponent) => void;
  onDelete: (id: string, ref: string) => void;
  onQuickAdjustQuantity: (id: string, delta: number) => void;
}

export const ComponentTable: React.FC<ComponentTableProps> = ({
  components,
  filter,
  onSort,
  onEdit,
  onDelete,
  onQuickAdjustQuantity
}) => {
  const renderSortIcon = (column: InventoryFilter['sortBy']) => {
    if (filter.sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 ml-1 inline" />;
    }
    return filter.sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-400 ml-1 inline" />
    );
  };

  const getBadgeFormat = (pkg: string) => {
    switch (pkg) {
      case 'CMS/SMD':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/60';
      case 'Traversant/DIP':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      case 'Module':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (components.length === 0) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center shadow-md">
        <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-200">Aucun composant correspondant</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Aucune référence ne correspond à vos critères de recherche ou de filtre actifs.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-md overflow-hidden">
      {/* Conteneur fluide sécurisé */}
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed text-left text-xs sm:text-sm text-slate-300">
          <thead className="bg-slate-900/95 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700 select-none">
            <tr>
              <th className="py-3 px-2 text-center w-10 text-slate-500 font-mono">#</th>
              
              <th 
                className="py-3 px-3 w-[18%] cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('ref')}
              >
                <div className="truncate" title="Trier par référence marquée">
                  Réf. Marquée {renderSortIcon('ref')}
                </div>
              </th>

              <th 
                className="py-3 px-3 w-[17%] cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('family')}
              >
                <div className="truncate" title="Trier par identité & famille">
                  Identité / Boîtier {renderSortIcon('family')}
                </div>
              </th>

              <th 
                className="py-3 px-2 text-center w-[12%] cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('quantity')}
              >
                <div className="truncate" title="Trier par niveau de stock">
                  Stock {renderSortIcon('quantity')}
                </div>
              </th>

              <th 
                className="py-3 px-3 w-[12%] cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('location')}
              >
                <div className="truncate" title="Trier par emplacement d'atelier">
                  Emplacement {renderSortIcon('location')}
                </div>
              </th>

              <th className="py-3 px-3 w-[21%]">
                <div className="truncate" title="Fonction et notes techniques">
                  Fonction &amp; Application
                </div>
              </th>

              <th className="py-3 px-2 text-center w-[11%]">
                <div className="truncate" title="Format de montage physique">
                  Format
                </div>
              </th>

              <th className="py-3 px-2 text-center w-[9%] print:hidden">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50">
            {components.map((item, index) => {
              const isLowStock = item.quantity <= item.minQuantity;
              const isRecycled = item.source === 'Récupération';
              const displayPackage = normalizePackageFormat(item.package, item.footprint);

              return (
                <tr 
                  key={item.id} 
                  onClick={() => onEdit(item)}
                  className="hover:bg-slate-700/50 transition-colors group cursor-pointer select-none"
                  title="Cliquer pour modifier la fiche de ce composant"
                >
                  {/* Numéro séquentiel */}
                  <td className="py-3 px-2 text-center text-xs text-slate-500 font-mono">
                    {index + 1}
                  </td>

                  {/* Référence, photo et datasheet */}
                  <td className="py-3 px-3 overflow-hidden">
                    <div className="flex items-center gap-2">
                      {item.imageUrl ? (
                        <div 
                          className="relative group/photo flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.ref}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-600 shadow-sm"
                          />
                          <div className="hidden group-hover/photo:block absolute left-9 top-0 z-40 w-44 h-44 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-slate-900 pointer-events-none">
                            <img
                              src={item.imageUrl}
                              alt={item.ref}
                              className="w-full h-full object-contain bg-slate-950 p-1"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 py-0.5 text-center text-[10px] text-emerald-400 font-mono">
                              Photo haute résolution
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span 
                            className="font-bold text-emerald-400 font-mono text-xs sm:text-sm truncate block" 
                            title={item.ref}
                          >
                            {item.ref}
                          </span>
                          {item.datasheetUrl && (
                            <a
                              href={item.datasheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-blue-400 p-0.5 flex-shrink-0 transition-colors"
                              title="Consulter la documentation technique (Datasheet)"
                            >
                              <FileText className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {item.family && (
                          <span className="text-[10px] text-slate-400 font-mono truncate block" title={item.family}>
                            {item.family}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Identité, Type fonctionnel & Footprint */}
                  <td className="py-3 px-3 overflow-hidden">
                    <div className="text-slate-200 font-medium text-xs truncate" title={item.type || '-'}>
                      {item.type || '-'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="px-1.5 py-0.2 rounded bg-slate-900/80 border border-slate-700 text-slate-300 truncate" title={item.footprint}>
                        {item.footprint || 'N/A'}
                      </span>
                      <span className="text-slate-500 flex-shrink-0">({item.pins || '?'}p)</span>
                    </div>
                  </td>

                  {/* Quantité & Ajustement Rapide avec protection stopPropagation */}
                  <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdjustQuantity(item.id, -1);
                        }}
                        disabled={item.quantity <= 0}
                        className="w-5 h-5 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs transition-colors print:hidden"
                        title="Consommer 1 pièce (-1)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="min-w-[36px] text-center">
                        <span className={`font-mono font-bold text-xs sm:text-sm ${
                          isLowStock ? 'text-rose-400' : 'text-slate-100'
                        }`}>
                          {item.quantity}
                        </span>
                        {isLowStock && (
                          <div className="flex items-center justify-center text-[9px] text-rose-400/90 font-semibold gap-0.5" title={`Stock critique (min: ${item.minQuantity})`}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>min:{item.minQuantity}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdjustQuantity(item.id, 1);
                        }}
                        className="w-5 h-5 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-emerald-400 flex items-center justify-center text-xs transition-colors print:hidden"
                        title="Ajouter 1 pièce en stock (+1)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Emplacement atelier */}
                  <td className="py-3 px-3 overflow-hidden">
                    <div className="flex items-center gap-1 text-xs text-slate-300 font-mono truncate" title={item.location}>
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.location || 'Non défini'}</span>
                    </div>
                  </td>

                  {/* Fonction & Description avec infobulle native */}
                  <td className="py-3 px-3 overflow-hidden">
                    <div className="text-xs text-slate-300 truncate font-normal" title={item.functionDesc || '-'}>
                      {item.functionDesc || '-'}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5" title={item.description}>
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* Format physique & Origine d'acquisition dissociée */}
                  <td className="py-3 px-2 text-center overflow-hidden">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded-md font-semibold border truncate max-w-full ${getBadgeFormat(displayPackage)}`}>
                        {displayPackage || 'Autre'}
                      </span>
                      {isRecycled && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] rounded font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50" title="Mode d'acquisition : Récupération / Démontage">
                          <Recycle className="w-2.5 h-2.5" />
                          <span>Récup</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions unitaires avec stopPropagation */}
                  <td className="py-3 px-2 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        className="text-slate-400 hover:text-blue-400 p-1 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Modifier cette fiche"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id, item.ref);
                        }}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Supprimer cette référence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

