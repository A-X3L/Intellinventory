/**
 * @file repository.port.ts
 * @description Contrat d'interface (Port) pour la persistance de l'inventaire
 */

import { ElectronicComponent } from '../domain/types';

export interface IComponentRepository {
  /**
   * Initialise le support de stockage sous-jacent.
   */
  init(): Promise<void>;

  /**
   * Récupère la totalité des composants en base.
   */
  getAll(): Promise<ElectronicComponent[]>;

  /**
   * Recherche un composant par son identifiant immuable.
   */
  getById(id: string): Promise<ElectronicComponent | null>;

  /**
   * Enregistre ou met à jour un composant (Upsert).
   */
  save(component: ElectronicComponent): Promise<void>;

  /**
   * Enregistre un lot complet de composants en transaction.
   */
  saveBatch(components: ElectronicComponent[]): Promise<void>;

  /**
   * Supprime un composant par son identifiant unique.
   */
  delete(id: string): Promise<void>;

  /**
   * Compte le nombre total de composants stockés.
   */
  count(): Promise<number>;

  /**
   * Vide intégralement le magasin de données.
   */
  clear(): Promise<void>;

  /**
   * Efface toutes les données sans réinjecter les données d'usine.
   */
  clearAll(): Promise<void>;

  /**
   * Restaure le backup technique de secours (59 composants CSV d'origine).
   */
  restoreSeedBackup(): Promise<ElectronicComponent[]>;

  /**
   * Recherche un composant par sa référence sérigraphiée.
   */
  getByRef(ref: string): Promise<ElectronicComponent | null>;

  /**
   * Réinitialise le stock avec les données d'usine (alias de restoreSeedBackup).
   */
  resetToDefault(): Promise<ElectronicComponent[]>;

  /**
   * Exporte les données au format brut sérialisé.
   */
  exportAll(): Promise<ElectronicComponent[]>;

  /**
   * Importe et valide un lot avec option de fusion ou écrasement.
   */
  importBatch(components: ElectronicComponent[], overwrite?: boolean): Promise<number>;
}
