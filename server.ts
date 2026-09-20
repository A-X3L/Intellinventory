/**
 * @file server.ts
 * @description Serveur d'API sécurisé & middleware Vite pour Inventaire Électronique
 * Protège la clé Gemini API côté serveur contre toute fuite vers le client.
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

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

app.get('/api/ai/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    configured: hasKey,
    model: 'gemini-3.1-flash-lite',
    protection: 'Backend-for-Frontend (Clé isolée côté serveur)'
  });
});

app.post('/api/ai/query', async (req, res) => {
  try {
    const { prompt, inventory } = req.body;

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

    const systemInstruction = `Tu es un ingénieur en électronique senior et un assistant d'atelier expérimenté.
Tu conseilles un électronicien sur la conception de circuits, le choix de composants, les équivalences, le brochage, les calculs de valeurs et les montages.
Voici l'état actuel et vérifié de son stock de composants disponible dans l'atelier :

${inventorySummary}

Règles de réponse :
1. Privilégie EXCLUSIVEMENT ou en priorité les composants réellement présents dans son stock ci-dessus.
2. Si un composant passif basique indispensable manque (ex: résistance de pull-up, condensateur de découplage 100nF, diode 1N4148), précise-le clairement.
3. Sois précis sur les contraintes techniques (tensions max, brochage, dissipation thermique, fréquence).
4. Réponds en français clair, structuré avec des titres et listes bien formatées en Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction
      }
    });

    const reply = response.text || "Aucune réponse générée par le modèle.";
    res.json({ reply });
  } catch (error: any) {
    console.error('[API /api/ai/query] Erreur :', error);
    const message = error?.message || 'Erreur lors du traitement de la requête IA.';
    const isKeyMissing = message.includes('GEMINI_API_KEY');
    res.status(isKeyMissing ? 503 : 500).json({
      error: isKeyMissing
        ? "La clé GEMINI_API_KEY n'est pas encore configurée dans les paramètres de l'application."
        : message
    });
  }
});

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
    console.error('[API /api/ai/ideas] Erreur :', error);
    res.status(500).json({ error: error?.message || "Erreur lors de la génération d'idées de projets." });
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
4. Détermine le format physique : choisis impérativement parmi "CMS/SMD", "Traversant/DIP", "Récupération", ou "Module".
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
  "format": "CMS/SMD" | "Traversant/DIP" | "Récupération" | "Module",
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
    console.error('[API /api/ai/scan-component] Erreur :', error);
    res.status(500).json({ error: error?.message || "Erreur lors de l'analyse visuelle du composant." });
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
