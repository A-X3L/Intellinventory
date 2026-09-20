/**
 * @file ai.service.ts
 * @description Service client communiquant de façon sécurisée avec l'API backend sans exposer la clé API
 */

import { ElectronicComponent } from '../core/domain/types';

export interface AiStatusResponse {
  configured: boolean;
  model: string;
  protection: string;
}

export interface ScannedComponentData {
  reference: string;
  family: string;
  type: string;
  category: string;
  format: 'CMS/SMD' | 'Traversant/DIP' | 'Récupération' | 'Module';
  footprint: string;
  pins: string;
  functionDesc: string;
  description: string;
}

export const AiService = {
  /**
   * Vérifie la disponibilité et le modèle de l'IA côté serveur.
   */
  async getStatus(): Promise<AiStatusResponse> {
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        configured: false,
        model: 'gemini-3.1-flash-lite',
        protection: 'Serveur proxy déconnecté'
      };
    }
  },

  /**
   * Analyse la photo d'un composant électronique via Gemini 3.1 Flash Lite
   */
  async scanComponent(imageBase64: string): Promise<ScannedComponentData> {
    const res = await fetch('/api/ai/scan-component', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Erreur d'analyse (code ${res.status})`);
    }

    return data.component;
  },

  /**
   * Envoie une question avec le contexte réel des composants d'atelier.
   */
  async askQuestion(prompt: string, inventory: ElectronicComponent[]): Promise<string> {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, inventory })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Erreur serveur (code ${res.status})`);
    }

    return data.reply;
  },

  /**
   * Génère 3 idées de projets pratiques basés sur le stock réel.
   */
  async generateIdeas(inventory: ElectronicComponent[]): Promise<string> {
    const res = await fetch('/api/ai/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Erreur serveur (code ${res.status})`);
    }

    return data.reply;
  }
};
