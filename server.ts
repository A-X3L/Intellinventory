/**
 * @file server.ts
 * @description Serveur d'API sécurisé & middleware Vite pour Inventaire Électronique
 * Protège la clé Gemini API côté serveur contre toute fuite vers le client.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import os from 'os';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
// Verrouillage strict du port réseau : Fixé de manière permanente sur le port 3000
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Middleware d'intégration des fichiers d'habillage (.icl et .cul)
app.use((req, res, next) => {
  if (req.path.endsWith('.icl')) {
    res.setHeader('Content-Type', 'application/x-icl');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else if (req.path.endsWith('.cul')) {
    res.setHeader('Content-Type', 'application/x-cul');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// Bus d'événements en mémoire pour le Terminal de Capture Distant (/capture)
interface CapturedMedia {
  id: string;
  type: 'photo' | 'audio';
  dataUrl: string;
  timestamp: string;
  notes?: string;
}

const captureQueue: CapturedMedia[] = [];
const sseClients: express.Response[] = [];

// Broadcast SSE aux sessions actives sur PC
function broadcastCapturedMedia(media: CapturedMedia) {
  const payload = `data: ${JSON.stringify(media)}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

// Client Gemini initialisé à la demande
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La variable d'environnement GEMINI_API_KEY n'est pas configurée sur le serveur.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// ----------------------------------------------------
// Routes API Sécurisées (/api/*)
// ----------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Détection des adresses IPv4 locales pour le QR Code mobile
app.get('/api/network/info', (_req, res) => {
  const interfaces = os.networkInterfaces();
  const localIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIps.push(iface.address);
      }
    }
  }
  res.json({
    primaryIp: localIps[0] || '127.0.0.1',
    allIps: localIps,
    port: PORT
  });
});

// ----------------------------------------------------
// Terminal de Capture Distant (/capture) & Flux Synchrone
// ----------------------------------------------------

// Envoi d'un média depuis un smartphone ou terminal mobile
app.post('/api/capture/push', (req, res) => {
  const { type, dataUrl, notes } = req.body;
  if (!type || !dataUrl) {
    return res.status(400).json({ error: "Type et dataUrl requis." });
  }

  const media: CapturedMedia = {
    id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: type === 'audio' ? 'audio' : 'photo',
    dataUrl,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    notes: notes || ''
  };

  captureQueue.unshift(media);
  if (captureQueue.length > 50) captureQueue.pop();

  broadcastCapturedMedia(media);

  res.json({ success: true, id: media.id, timestamp: media.timestamp });
});

// Flux SSE synchrone pour alimenter le grand écran PC
app.get('/api/capture/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Historique récent des captures
app.get('/api/capture/recent', (_req, res) => {
  res.json({ queue: captureQueue });
});

app.get('/api/ai/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    configured: hasKey,
    model: 'gemini-3.1-flash-lite',
    protection: 'Backend-for-Frontend (Clé isolée côté serveur)'
  });
});

const SYSTEM_PROMPT_PEDAGOGUE = `Tu es un ingénieur en électronique et chef d'atelier passionné de prototypage rapide. Ton rôle est d'accompagner un concepteur exigeant dans son laboratoire.
Règles de communication :

Adopte un ton de compagnon de labo expérimenté, pédagogue et extrêmement rigoureux.

Analyse les composants du stock avec précision pour suggérer des montages ingénieux et stables.

Propose systématiquement des alternatives ou des composants de substitution si une référence manque, en expliquant les contraintes de brochage ou de tolérance.

Structure tes réponses avec des conseils pratiques pour le fer à souder, la disposition sur plaque d'essai et la sécurité électrique (tension, boucles de masse).

Réponds en français structuré (Markdown clair, nomenclatures exactes, checklists de test au multimètre).`;

const SYSTEM_PROMPT_CHIRURGICAL = `Tu es un électronicien senior chevronné et un chef d'atelier intransigeant, intervenant sur des montages analogiques et numériques sensibles. Tu t'adresses à un power-user averti.

Règles de communication et d'exécution :
1. Précision chirurgicale : Va droit au but. Utilise la nomenclature exacte des composants, les valeurs précises et les brochages sans aucune approximation théorique superflue.
2. Priorité à la sécurité et à l'intégrité : 
   - Intègre systématiquement les mesures de sécurité indispensables (tensions maximales, risques de court-circuit, sens des polarisations, découplages obligatoires à 100nF).
   - Signale immédiatement tout risque d'instabilité, de boucle de masse ou de destruction de matériel.
   - En contexte open-source ou de déploiement, rappelle l'isolation stricte des secrets (variables d'environnement, absence de clés ou de données personnelles hardcodées dans le code).
3. Utilisation de l'inventaire : Exploite en priorité absolue les composants disponibles pour proposer des montages réalisables immédiatement.
4. Format : Réponds en français structuré (Markdown clair, listes à puces, pas de formules de politesse inutiles).`;

const SYSTEM_PROMPT_DOCBROWN = `Tu es le Professeur Emmett Lathrop Brown, inventeur excentrique et chef d’atelier temporel. Tu t’adresses à un power-user averti qui possède un stock réel de composants électroniques.

Règles de communication et d’exécution (non négociables) :

1. Personnalité
- Tu parles exactement comme le Doc Brown : enthousiaste, théâtral, avec des expressions caractéristiques (« Great Scott ! », « Nom de Zeus ! », « 1.21 gigawatts ! », « continuum spatio-temporel », « paradoxe temporel », etc.).
- Tu peux faire de brèves digressions loufoques, mais tu reviens TOUJOURS au conseil technique concret en moins de deux phrases.
- Tu tutoyes et tu agis comme un collègue de labo brillant mais légèrement fou.

2. Priorité absolue à l’inventaire
- Tu n’utilises QUE les composants réellement présents dans le stock de l’utilisateur.
- Tu n’inventes JAMAIS de composants absents du stock.
- Si une solution optimale nécessite un composant manquant, tu le signales clairement et tu proposes la meilleure alternative réaliste avec ce qui est disponible.

3. Exigence de solutions robustes et classiques
- Tu privilégies TOUJOURS les solutions techniques éprouvées et sûres.
- En cas de différence de tension (exemple : microcontrôleur 3,3 V et logique 5 V), tu utilises un vrai level shifting propre (buffer alimenté en 5 V) plutôt que des solutions limites ou « qui marchent à peu près ».
- Tu évites les architectures où les sorties d’un circuit à 3,3 V pilotent des charges alimentées en 5 V de façon non franche.
- Tu refuses les montages qui laissent des entrées CMOS flottantes ou qui créent des risques de conflit de bus non maîtrisés.

4. Sécurité et intégrité (priorité maximale – application open source)
- Tu intègres systématiquement les mesures de sécurité dans chaque réponse technique.
- Découplage 100 nF céramique au plus près de chaque circuit intégré : obligatoire.
- Gestion stricte des courants (notamment limite de courant total du 74HC595).
- Protection contre les courts-circuits, conflits de bus et états flottants.
- Séquence d’initialisation sécurisée au démarrage.
- Tu signales clairement tout risque de destruction de matériel ou de comportement instable.
- Tu rappelles les bonnes pratiques de manipulation (ESD, polarité, tension maximale).

5. Format de réponse
- Français structuré en Markdown clair.
- Structure recommandée pour les réponses techniques :
  1. Analyse du problème et des risques
  2. Solution retenue (justifiée par rapport au stock et à la robustesse)
  3. Câblage détaillé (broche à broche)
  4. Séquence d’initialisation
  5. Checklist de sécurité multimètre
- Termine souvent par une phrase du type :  
  « Et n’oublie jamais… le futur n’est pas encore écrit… mais ce découplage de 100 nF, lui, est absolument obligatoire ! »

Tu as accès en temps réel à l’inventaire de composants. Utilise-le en priorité absolue et reste strictement fidèle à ce qui est réellement disponible.`;

app.post('/api/ai/query', async (req, res) => {
  try {
    const { prompt, inventory, mode = 'pedagogue', image } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Le paramètre "prompt" est requis et doit être une chaîne.' });
      return;
    }

    const ai = getGeminiClient();

    // Construction du contexte matériel d'atelier
    let inventorySummary = 'Aucun composant en stock.';
    if (Array.isArray(inventory) && inventory.length > 0) {
      inventorySummary = inventory
        .slice(0, 150)
        .map((c) => `- ${c.ref} | Famille: ${c.family || 'N/A'} | Type: ${c.type || 'N/A'} | Boîtier: ${c.footprint || c.package || 'N/A'} | Qté: ${c.quantity ?? 1} | Emplacement: ${c.location || 'N/A'} | Fonction: ${c.functionDesc || c.function || 'N/A'}`)
        .join('\n');
    }

    // Sélection du profil de prompt et du modèle selon le mode
    let baseInstruction = SYSTEM_PROMPT_PEDAGOGUE;
    let selectedModel = 'gemini-3.1-flash-lite';

    if (mode === 'docbrown') {
      baseInstruction = SYSTEM_PROMPT_DOCBROWN;
      selectedModel = 'gemini-3.5-flash-lite'; // Profil d'élite suprême surclassant les deux autres
    } else if (mode === 'chirurgical') {
      baseInstruction = SYSTEM_PROMPT_CHIRURGICAL;
      selectedModel = 'gemini-3.1-flash-lite';
    } else {
      baseInstruction = SYSTEM_PROMPT_PEDAGOGUE;
      selectedModel = 'gemini-3.1-flash-lite';
    }

    const systemInstruction = `${baseInstruction}

--- INVENTAIRE RÉEL EN STOCK DANS L'ATELIER ---
${inventorySummary}`;

    // Construction du payload multimodal (Texte + Image redimensionnée optionnelle)
    const contents: any[] = [];

    if (image && typeof image === 'string') {
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          const commaIndex = image.indexOf(',');
          if (commaIndex !== -1) {
            base64Data = image.slice(commaIndex + 1);
          }
        }
      }

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    contents.push(prompt);

    // Dynamic config with explicit internet search enabled for all 3 profiles
    const config: any = {
      systemInstruction,
      tools: [{ googleSearch: {} }], // webSearch: true pour les 3 profils
      stopSequences: [
        "\n\n---"
      ]
    };

    if (mode === 'docbrown') {
      config.thinkingConfig = {
        thinkingLevel: 'HIGH'
      };
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config
      });
    } catch (modelErr) {
      // Fallback au modèle standard si 3.5 n'est pas disponible
      console.warn(`[API /api/ai/query] Fallback du modèle ${selectedModel} vers gemini-3.1-flash-lite:`, modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config
      });
    }

    const reply = response.text || "Aucune réponse générée par le modèle.";
    res.json({ reply, mode });
  } catch (error: any) {
    handleGeminiError(res, '/api/ai/query', error);
  }
});

// Gestionnaire d'erreurs centralisé pour les quotas et pannes Gemini API
function handleGeminiError(res: express.Response, context: string, error: any) {
  console.error(`[API ${context}] Erreur :`, error);
  const message = String(error?.message || error || 'Erreur lors du traitement de la requête IA.');
  const isKeyMissing = message.includes('GEMINI_API_KEY');
  const isQuotaExceeded =
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('rate limit');

  if (isKeyMissing) {
    return res.status(503).json({
      error: "La clé GEMINI_API_KEY n'est pas encore configurée dans les paramètres de l'application."
    });
  }

  if (isQuotaExceeded) {
    return res.status(429).json({
      error: "Quota de requêtes Google Gemini dépassé (429 RESOURCE_EXHAUSTED). Le plafond d'appels de l'API gratuite Gemini a été atteint. Veuillez patienter une minute avant de reformuler votre demande ou vérifier vos quotas sur Google AI Studio.",
      isQuotaExceeded: true
    });
  }

  return res.status(500).json({ error: message });
}

app.post('/api/ai/ideas', async (req, res) => {
  try {
    const { inventory } = req.body;

    if (!Array.isArray(inventory) || inventory.length === 0) {
      res.status(400).json({ error: 'Inventaire vide. Veuillez ajouter au moins un composant pour suggérer des projets.' });
      return;
    }

    const ai = getGeminiClient();

    const inventorySummary = inventory
      .slice(0, 150)
      .map((c) => `- ${c.ref} (${c.type || 'N/A'}, Boîtier: ${c.footprint || c.package || 'N/A'}, Qté: ${c.quantity ?? 1}) : ${c.functionDesc || c.function || 'N/A'}`)
      .join('\n');

    const prompt = `À partir des composants suivants disponibles dans mon laboratoire :
${inventorySummary}

Propose 3 idées de projets électroniques pratiques, formateurs et réalisables avec ce stock.
Pour chaque projet, respecte strictement la structure suivante :

### 1. [Nom du projet]
- **Principe :** Explication synthétique du fonctionnement.
- **Composants du stock utilisés :** Liste des références précises issues de mon inventaire.
- **Composants complémentaires standards nécessaires :** (ex: résistances, condensateurs, plaque d'essai breadboard, alimentation...).
- **Conseil de réalisation & Difficulté :** Débutant / Intermédiaire / Avancé avec une astuce technique (filtrage, protection, dissipation).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt
    });

    res.json({ reply: response.text || 'Aucune idée générée.' });
  } catch (error: any) {
    handleGeminiError(res, '/api/ai/ideas', error);
  }
});

app.post('/api/ai/scan-component', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Une image au format Base64 ou Data URL est requise.' });
      return;
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        const commaIndex = image.indexOf(',');
        if (commaIndex !== -1) {
          base64Data = image.slice(commaIndex + 1);
        }
      }
    }

    const ai = getGeminiClient();

    const systemInstruction = `Tu es un ingénieur expert en identification de composants électroniques et rétro-ingénierie de circuits imprimés.
Analyse méticuleusement cette photo de composant électronique :
1. Déchiffre le marquage sérigraphié visible sur le composant (ex: 74HC595, NE555, LM358, IRFZ44N, ESP32, AMS1117, ATmega328P, BC547, 1N4007, etc.). Si une partie est floue ou partielle, déduis la référence la plus probable en fonction du contexte et de la taille du boîtier.
2. Identifie la famille technologique (ex: Logique TTL/CMOS, Amplificateur Opérationnel, Régulateur Linéaire LDO, MOSFET canal N, Microcontrôleur, Diode de redressement, etc.).
3. Identifie le type fonctionnel précis.
4. Détermine le format physique : choisis impérativement parmi "CMS/SMD", "Traversant/DIP", ou "Module".
5. Détermine le boîtier normalisé (footprint) : ex: "SOIC-8", "SOIC-16", "DIP-8", "DIP-14", "DIP-16", "TO-220", "SOT-23", "SOT-223", "0805", "1206", "LQFP-48", "Module PCB", etc.
6. Compte ou indique le nombre de broches (pins).
7. Classe-le dans une catégorie parmi : "Logique", "Buffer / Pilote", "Analogique", "Alimentation", "Discrets", "Optoélectronique", "Mémoire", "Modules", "Microcontrôleurs", "Capteurs", "Connectique".
8. Rédige une description fonctionnelle synthétique ainsi que des notes techniques (tensions admissibles typiques, conseils d'utilisation).

Tu DOIS impérativement répondre sous la forme d'un objet JSON strict valide sans texte avant ni après, avec les clés suivantes :
{
  "reference": string,
  "family": string,
  "type": string,
  "category": string,
  "format": "CMS/SMD" | "Traversant/DIP" | "Module",
  "footprint": string,
  "pins": string,
  "functionDesc": string,
  "description": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        "Identifie le composant électronique présent sur cette photo et retourne les informations extraites au format JSON demandé."
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Impossible d'interpréter le résultat JSON fourni par l'IA.");
      }
    }

    res.json({
      success: true,
      component: {
        reference: parsedData.reference || parsedData.ref || 'INCONNU',
        family: parsedData.family || '',
        type: parsedData.type || '',
        category: parsedData.category || 'Discrets',
        format: parsedData.format || parsedData.package || 'CMS/SMD',
        footprint: parsedData.footprint || '',
        pins: String(parsedData.pins || ''),
        functionDesc: parsedData.functionDesc || '',
        description: parsedData.description || ''
      }
    });
  } catch (error: any) {
    handleGeminiError(res, '/api/ai/scan-component', error);
  }
});

// ----------------------------------------------------
// Intégration Vite (Développement vs Production)
// ----------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Serveur Atelier] Écoute sur http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erreur critique au démarrage du serveur :', err);
  process.exit(1);
});
