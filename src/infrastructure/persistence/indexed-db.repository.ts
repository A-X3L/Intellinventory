/**
 * @file indexed-db.repository.ts
 * @description Adaptateur de persistance IndexedDB asynchrone robuste avec fallback mémoire/localStorage et seeding idempotent
 */

import { ElectronicComponent, DEFAULT_COMPONENTS_SEEDS } from '../../core/domain/types';
import { IComponentRepository } from '../../core/ports/repository.port';

const DB_NAME = 'ElecInventoryDB_v2';
const STORE_NAME = 'electronic_components';
const DB_VERSION = 1;
const SEED_FLAG_KEY = 'app_db_initialized_v1';
const FALLBACK_STORAGE_KEY = 'elec_inventory_indexeddb_fallback';

export class IndexedDbComponentRepository implements IComponentRepository {
  private db: IDBDatabase | null = null;
  private isFallbackMode = false;
  private memoryCache: ElectronicComponent[] = [];
  private isInitialized = false;

  constructor() {
    // Initialise le cache mémoire avec les composants d'usine par défaut
    this.memoryCache = this.generateDefaultSeeds();
  }

  /**
   * Initialisation robuste et non-bloquante de la base de données
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 1. Initialiser le cache mémoire à partir du stockage local si disponible
    const cachedLocal = this.getFromLocalStorage();
    if (cachedLocal.length > 0) {
      this.memoryCache = cachedLocal;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isFallbackMode = true;
      this.checkAndSeedFallback();
      this.isInitialized = true;
      return;
    }

    try {
      // Ouverture avec timeout de 1500ms pour ne jamais bloquer l'UI
      this.db = await this.openDatabaseWithTimeout(1500);

      // Vérification du seeding idempotent via la clé localStorage
      const hasSeeded = localStorage.getItem(SEED_FLAG_KEY) === 'true';

      if (!hasSeeded) {
        // Premier lancement : vérifier si la base est vide
        const count = await this.countSafe();
        if (count === 0) {
          const defaults = this.generateDefaultSeeds();
          await this.putBatchToStore(defaults);
          this.memoryCache = defaults;
          this.saveToLocalStorage(defaults);
        }
        localStorage.setItem(SEED_FLAG_KEY, 'true');
      } else {
        // Déjà initialisé : si pour une raison quelconque la base est vide, réparer avec les seeds
        const count = await this.countSafe();
        if (count === 0) {
          const defaults = this.generateDefaultSeeds();
          await this.putBatchToStore(defaults);
          this.memoryCache = defaults;
          this.saveToLocalStorage(defaults);
        }
      }
    } catch (err) {
      console.warn('[IndexedDB] Ouverture impossible ou expirée, bascule en mode mémoire/localStorage :', err);
      this.isFallbackMode = true;
      this.checkAndSeedFallback();
    } finally {
      this.isInitialized = true;
    }
  }

  private checkAndSeedFallback(): void {
    const hasSeeded = localStorage.getItem(SEED_FLAG_KEY) === 'true';
    if (!hasSeeded || this.memoryCache.length === 0) {
      const defaults = this.generateDefaultSeeds();
      this.memoryCache = defaults;
      this.saveToLocalStorage(defaults);
      localStorage.setItem(SEED_FLAG_KEY, 'true');
    }
  }

  /**
   * Ouvre la base IndexedDB avec une limite de temps stricte
   */
  private openDatabaseWithTimeout(timeoutMs: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let isSettled = false;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`Délai d'attente d'ouverture IndexedDB dépassé (${timeoutMs}ms)`));
        }
      }, timeoutMs);

      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onblocked = () => {
          console.warn('[IndexedDB] Requête d\'ouverture bloquée par une autre connexion.');
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            reject(new Error('IndexedDB blocked'));
          }
        };

        req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('ref', 'ref', { unique: false });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('package', 'package', { unique: false });
            store.createIndex('location', 'location', { unique: false });
            store.createIndex('quantity', 'quantity', { unique: false });
          }
        };

        req.onsuccess = () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(req.result);
          }
        };

        req.onerror = () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            reject(req.error || new Error('Erreur d\'ouverture IndexedDB'));
          }
        };
      } catch (err) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    });
  }

  /**
   * Compte sécurisé des composants
   */
  public async count(): Promise<number> {
    return this.countSafe();
  }

  private async countSafe(): Promise<number> {
    if (this.isFallbackMode || !this.db) {
      return this.memoryCache.length;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();

        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(this.memoryCache.length);
      } catch {
        resolve(this.memoryCache.length);
      }
    });
  }

  /**
   * Vide intégralement le magasin de données
   */
  public async clear(): Promise<void> {
    this.memoryCache = [];
    this.saveToLocalStorage([]);

    if (this.isFallbackMode || !this.db) {
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Recherche par référence
   */
  public async getByRef(ref: string): Promise<ElectronicComponent | null> {
    const cleanRef = ref.trim().toLowerCase();
    if (!cleanRef) return null;

    const all = await this.getAll();
    return all.find((c) => c.ref.trim().toLowerCase() === cleanRef) || null;
  }

  /**
   * Récupère tous les composants de façon résiliente
   */
  public async getAll(): Promise<ElectronicComponent[]> {
    if (this.isFallbackMode || !this.db) {
      return [...this.memoryCache];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = req.result || [];
          if (list.length > 0) {
            this.memoryCache = list;
            this.saveToLocalStorage(list);
            resolve(list);
          } else if (this.memoryCache.length > 0) {
            resolve([...this.memoryCache]);
          } else {
            const defaults = this.generateDefaultSeeds();
            this.memoryCache = defaults;
            resolve(defaults);
          }
        };

        req.onerror = () => {
          resolve([...this.memoryCache]);
        };
      } catch {
        resolve([...this.memoryCache]);
      }
    });
  }

  public async getById(id: string): Promise<ElectronicComponent | null> {
    const all = await this.getAll();
    return all.find((c) => c.id === id) || null;
  }

  public async save(component: ElectronicComponent): Promise<void> {
    let finalId = component.id;

    // Éviter les doublons par référence
    if (!finalId && component.ref) {
      const existing = await this.getByRef(component.ref);
      if (existing) {
        finalId = existing.id;
      }
    }

    const enriched: ElectronicComponent = {
      ...component,
      id: finalId || crypto.randomUUID(),
      ref: component.ref.trim(),
      updatedAt: Date.now()
    };

    // 1. Mettre à jour le cache mémoire et localStorage
    const idx = this.memoryCache.findIndex(
      (c) => c.id === enriched.id || c.ref.trim().toLowerCase() === enriched.ref.toLowerCase()
    );
    if (idx >= 0) {
      this.memoryCache[idx] = enriched;
    } else {
      this.memoryCache.push(enriched);
    }
    this.saveToLocalStorage(this.memoryCache);

    if (this.isFallbackMode || !this.db) {
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(enriched);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async saveBatch(components: ElectronicComponent[], preventDuplicates = true): Promise<void> {
    if (components.length === 0) return;

    // 1. Déduplication en mémoire
    const map = new Map<string, ElectronicComponent>();
    for (const item of this.memoryCache) {
      const key = preventDuplicates ? item.ref.trim().toLowerCase() : item.id;
      map.set(key, item);
    }
    for (const item of components) {
      const key = preventDuplicates ? item.ref.trim().toLowerCase() : item.id;
      map.set(key, item);
    }
    this.memoryCache = Array.from(map.values());
    this.saveToLocalStorage(this.memoryCache);

    if (this.isFallbackMode || !this.db) {
      return;
    }

    await this.putBatchToStore(components);
  }

  private async putBatchToStore(components: ElectronicComponent[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const item of components) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async delete(id: string): Promise<void> {
    this.memoryCache = this.memoryCache.filter((c) => c.id !== id);
    this.saveToLocalStorage(this.memoryCache);

    if (this.isFallbackMode || !this.db) {
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Réinitialisation totale : vide et réinsère les 20 références initiales uniques
   */
  public async resetToDefault(): Promise<ElectronicComponent[]> {
    // 1. Vidage total
    await this.clear();

    // 2. Génération des 20 références d'usine certifiées
    const defaults = this.generateDefaultSeeds();
    this.memoryCache = defaults;
    this.saveToLocalStorage(defaults);

    if (this.db) {
      await this.putBatchToStore(defaults);
    }

    localStorage.setItem(SEED_FLAG_KEY, 'true');
    return defaults;
  }

  public async exportAll(): Promise<ElectronicComponent[]> {
    return this.getAll();
  }

  public async importBatch(imported: ElectronicComponent[], overwrite = false): Promise<number> {
    if (!Array.isArray(imported)) {
      throw new Error("Format d'import invalide : attend un tableau JSON.");
    }

    const validated: ElectronicComponent[] = imported.map((item, index) => {
      if (!item.ref || typeof item.ref !== 'string') {
        throw new Error(`Composant à l'indice ${index} sans référence valide.`);
      }
      return {
        id: item.id || crypto.randomUUID(),
        ref: item.ref.trim(),
        family: (item.family || '').trim(),
        type: (item.type || '').trim(),
        pins: (item.pins || 'N/A').toString().trim(),
        footprint: (item.footprint || 'N/A').trim(),
        category: (item.category || 'Divers').trim(),
        package: (item.package || 'CMS/SMD') as any,
        functionDesc: (item.functionDesc || (item as any).function || '').trim(),
        description: (item.description || (item as any).desc || '').trim(),
        quantity: Math.max(0, parseInt(String(item.quantity ?? 1), 10) || 0),
        minQuantity: Math.max(0, parseInt(String(item.minQuantity ?? 1), 10) || 0),
        location: (item.location || 'Atelier').trim(),
        datasheetUrl: item.datasheetUrl,
        imageUrl: item.imageUrl,
        updatedAt: item.updatedAt || Date.now()
      };
    });

    if (overwrite) {
      await this.clear();
      await this.saveBatch(validated, true);
    } else {
      await this.saveBatch(validated, true);
    }

    return validated.length;
  }

  /**
   * Génère les 20 références uniques par défaut avec des IDs déterministes
   */
  private generateDefaultSeeds(): ElectronicComponent[] {
    const now = Date.now();
    return DEFAULT_COMPONENTS_SEEDS.map((seed) => {
      const deterministicId = `seed-${seed.ref.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      return {
        ...seed,
        id: deterministicId,
        updatedAt: now
      };
    });
  }

  private getFromLocalStorage(): ElectronicComponent[] {
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(items: ElectronicComponent[]): void {
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[LocalStorage] Erreur d\'écriture :', e);
    }
  }
}

export const componentRepository = new IndexedDbComponentRepository();
