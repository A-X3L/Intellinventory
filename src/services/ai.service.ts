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

export type AiProfileMode = 'pedagogue' | 'chirurgical' | 'docbrown';

export interface AskQuestionOptions {
  prompt: string;
  inventory: ElectronicComponent[];
  mode?: AiProfileMode;
  image?: string;
}

export interface ScannedComponentData {
  reference: string;
  family: string;
  type: string;
  category: string;
  format: 'CMS/SMD' | 'Traversant/DIP' | 'Module';
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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429 || data.isQuotaExceeded) {
        throw new Error(data.error || "Quota de requêtes Google Gemini dépassé (429). Le plafond d'appels gratuits de l'API a été atteint. Veuillez patienter un instant ou vérifier vos quotas sur Google AI Studio.");
      }
      throw new Error(data.error || `Erreur d'analyse (code ${res.status})`);
    }

    return data.component;
  },

  /**
   * Envoie une question avec le profil sélectionné (Pédagogue ou Chirurgical) et image multimodale optionnelle.
   */
  async askQuestion(
    optionsOrPrompt: AskQuestionOptions | string, 
    inventory?: ElectronicComponent[],
    mode: AiProfileMode = 'pedagogue',
    image?: string
  ): Promise<string> {
    let payload: { prompt: string; inventory: ElectronicComponent[]; mode: AiProfileMode; image?: string };

    if (typeof optionsOrPrompt === 'string') {
      payload = {
        prompt: optionsOrPrompt,
        inventory: inventory || [],
        mode,
        image
      };
    } else {
      payload = {
        prompt: optionsOrPrompt.prompt,
        inventory: optionsOrPrompt.inventory,
        mode: optionsOrPrompt.mode || 'pedagogue',
        image: optionsOrPrompt.image
      };
    }

    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429 || data.isQuotaExceeded) {
        throw new Error(data.error || "Quota de requêtes Google Gemini dépassé (429). Le plafond d'appels de l'API a été atteint. Veuillez patienter une minute avant de reformuler votre demande ou vérifier vos quotas sur Google AI Studio.");
      }
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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429 || data.isQuotaExceeded) {
        throw new Error(data.error || "Quota de requêtes Google Gemini dépassé (429). Le plafond d'appels de l'API a été atteint. Veuillez patienter une minute avant de réessayer.");
      }
      throw new Error(data.error || `Erreur serveur (code ${res.status})`);
    }

    return data.reply;
  }
};
