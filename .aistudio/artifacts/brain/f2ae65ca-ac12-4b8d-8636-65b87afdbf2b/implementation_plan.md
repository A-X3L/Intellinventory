# Intégration de l'Agent Antigravity avec Persistance d'Environnement (Sandbox)

Ce plan définit l'architecture permettant d'exploiter l'agent géré **Antigravity** (`antigravity-preview-09-2026`) au sein de l'application, en gérant de façon transparente l'identifiant d'application (`f2ae65ca-ac12-4b8d-8636-65b87afdbf2b`) et le maintien persistant de l'environnement d'exécution Linux (`environment_id`) pour préserver les dépôts clonés, fichiers d'atelier et packages.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Distinction essentielle des identifiants :**
> - **Identifiant de l'Application AI Studio :** `f2ae65ca-ac12-4b8d-8636-65b87afdbf2b` (identifie ce conteneur web d'inventaire).
> - **Identifiant d'Environnement Antigravity (`environment_id`) :** généré par l'API Interactions de Gemini lors du premier appel avec `environment: "remote"`. Cet ID est ensuite réinjecté dans les appels suivants pour maintenir l'état du bac à sable Linux (fichiers générés, scripts Python/Bash, dépôts Git montés).

- **Mode de persistance retenu :** Conservation automatique de l'ID d'environnement actif (`environment_id`) côté serveur/session pour permettre des interactions multi-tours sans perte de contexte ni réinitialisation du bac à sable.
- **Préservation stricte des données :** Aucun impact sur la base locale IndexedDB ni sur les données de composants électroniques qui restent la source de vérité absolue.

---

### 1. Vue d'Ensemble & Fonctionnalités Clés

- **Pilotage de l'Agent Antigravity côté Serveur :** Route sécurisée `/api/agent/antigravity` exploitant le SDK `@google/genai` (v2.4.0) déjà installé, capable d'exécuter du code Bash/Python, de manipuler des fichiers et de naviguer sur le web.
- **Maintien de Repos & Environnement Persistant :** Gestion du cycle de vie du bac à sable : initialisation avec `environment: "remote"`, enregistrement du `environment_id`, réutilisation pour les tâches successives, et possibilité de réinitialiser l'environnement à la demande.
- **Suivi d'Exécution Transparent ("Proof of Work") :** Affichage en temps réel des étapes de raisonnement de l'agent (`thought`), des appels d'outils (`code_execution_call`, `google_search_call`) et des résultats console avant restitution finale.
- **Cas d'usage atelier & électronique :** Génération de code de test microcontrôleur (Arduino/ESP32), analyse avancée de datasheets, synthèse de nomenclatures (BOM) et scripts d'automatisation.

---

### 2. Expérience Utilisateur & Visual Design

Conformément à la charte d'atelier SaaS & Dashboard :
- **Console d'Atelier Antigravity :** Volet escamotable ou modal dédié avec affichage de l'état du bac à sable (ID d'environnement abrégé, statut opérationnel, temps d'exécution).
- **Timeline d'Exécution Structurée :** Déroulement propre des actions de l'agent (réflexion, commandes shell exécutées, sortie standard, réponse synthétisée).
- **Contrôles d'Environnement :** Bouton pour renouveler le bac à sable (créer un environnement vierge) ou réinjecter un environnement existant via son ID.
- **Discipline typographique :** Police monospace tabulaire (`JetBrains Mono` / `font-mono`) pour les commandes, chemins `/workspace/...`, identifiants d'environnement et logs.

---

### 3. Décisions Produit & Compromis

1. **Exécution exclusivement serveur (`server.ts`) :**
   - *Choix :* Aucun appel direct à `@google/genai` depuis le navigateur ; transit par une route Express `/api/agent/antigravity`.
   - *Raison :* Protection absolue de la clé `GEMINI_API_KEY` et respect strict des règles de sécurité de l'API Interactions.
2. **Reconstitution de la réponse de l'agent :**
   - *Choix :* Concaténation de l'ensemble des blocs `model_output` dans le tableau `steps` de l'interaction (et non simple lecture de `output_text` qui tronque les étapes intermédiaires).
3. **Persistance modulaire de l'ID d'environnement :**
   - *Choix :* L'application mémorise le dernier `environment_id` actif et permet à l'utilisateur de continuer à travailler dans ce même environnement ou d'en ouvrir un nouveau.

---

### 4. Architecture Technique & Flux de Données

```
┌───────────────────────────────────────────────────────────────┐
│                    Navigateur Client (React)                  │
│                                                               │
│  ┌───────────────────────┐         ┌───────────────────────┐  │
│  │   Console Agent UI    │         │  Inventaire Composants│  │
│  │  - Prompt utilisateur │         │  - IndexedDB local    │  │
│  │  - Timeline & Steps   │         │  - Données intactes   │  │
│  │  - Environment ID     │         │                       │  │
│  └───────────┬───────────┘         └───────────────────────┘  │
└──────────────┼────────────────────────────────────────────────┘
               │ POST /api/agent/antigravity { prompt, environmentId }
               ▼
┌───────────────────────────────────────────────────────────────┐
│                 Serveur Express (server.ts)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ GoogleGenAI SDK (v2.4.0)                                │  │
│  │ ai.interactions.create({                                │  │
│  │   agent: "antigravity-preview-09-2026",                 │  │
│  │   environment: environmentId || "remote",               │  │
│  │   input: prompt                                         │  │
│  │ })                                                      │  │
│  └──────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│              Google Gemini Cloud Infrastructure               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Bac à sable Linux distant (Sandbox)                     │  │
│  │ - Environment ID persistant                             │  │
│  │ - Répertoire /workspace, code execution, dépôts Git     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

#### Étapes de mise en œuvre :
1. **Backend (`server.ts`) :** Ajout du endpoint POST `/api/agent/antigravity` et GET `/api/agent/environment` pour gérer la création, la persistance et l'exécution d'interactions avec l'agent Antigravity.
2. **Service frontend (`src/services/agent.service.ts`) :** Méthodes typées pour lancer des requêtes, récupérer le statut des étapes (`steps`) et conserver l'`environment_id`.
3. **Interface utilisateur (`src/components/modals/AntigravityModal.tsx`) :** Terminal moderne haute fidélité pour lancer des missions d'automatisation, inspecter le bac à sable et superviser les logs d'exécution.
4. **Vérification & Validation :** Compilation complète TypeScript et validation du bon fonctionnement en dev.
