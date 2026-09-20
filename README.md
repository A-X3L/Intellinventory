# Intellinventory

**Intellinventory** est un assistant d'atelier et un gestionnaire d'inventaire électronique orienté matériel, conçu pour les électroniciens, les makers et les power-users. Il combine une interface de gestion de stock locale (résiliente et rapide) et un assistant IA intégré propulsé par Google Gemini pour le prototypage rapide, le calcul de montages et le diagnostic.

---

## 🚀 Fonctionnalités principales

* **Gestion d'inventaire locale :** Suivi rigoureux des composants électroniques (références, boîtiers CMS/DIP, emplacements, quantités et seuils d'alerte).


* **Assistant IA d'Atelier (Gemini) :** Un mentor technique intégré pour concevoir des montages (préamplis, filtres, alimentations), calculer les composants et diagnostiquer les pannes au multimètre.


* **Résilience locale-first :** Stockage local transactionnel (IndexedDB) garantissant un fonctionnement sans dépendance cloud critique pour les données de stock.
* **Ergonomie d'atelier :** Mode édition au clic, tableaux stabilisés sans scroll horizontal intempestif, dictée vocale locale et options d'impression optimisées pour l'établi (`@media print`).



---

## 🔑 Obtenir une clé API Google Gemini (Gratuite)

L'application utilise l'API de Google GenAI (via le modèle Gemini Flash Lite) pour alimenter l'assistant de laboratoire. Pour obtenir une clé :

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/?utm_source=gemini).
2. Connectez-vous avec votre compte Google.
3. Cliquez sur **"Get API key"** (Obtenir une clé API).
4. Générez une clé pour votre projet. Cette clé dispose d'un niveau d'utilisation gratuit (*free tier*) suffisant pour un usage personnel et de prototypage.

---

## ⚙️ Configuration de l'environnement (`.env`)

Pour sécuriser votre dépôt et éviter toute fuite de secrets (conformément aux bonnes pratiques open source), la clé API ne doit jamais être écrite en dur dans le code.

1. À la racine du projet, dupliquez le fichier d'exemple pour créer votre propre fichier de configuration :
```bash
cp .env.example .env

```


2. Ouvrez le fichier `.env` nouvellement créé et renseignez votre clé API Google :
```env
VITE_GEMINI_API_KEY=votre_cle_api_ici

```



---

## 🛠️ Installation et Lancement

### Prérequis

* Node.js (ou Bun) installé sur votre station de travail.

### 1. Installation des dépendances

```bash
npm install
# ou si vous utilisez bun :
bun install

```

### 2. Configuration réseau (pour accès externe / labo)

Le projet est configuré dans `vite.config.ts` pour autoriser l'écoute sur toutes les interfaces réseau (`host: '0.0.0.0'`) si nécessaire pour vos tests locaux multi-machines.

### 3. Lancement en mode développement

```bash
npm run dev
# ou avec bun :
bun dev

```

Ouvrez ensuite votre navigateur à l'adresse indiquée (généralement `http://localhost:5173`).

---

## 📄 Licence

Ce projet est open-source. Consultez le fichier `LICENSE` pour plus de détails sur son utilisation et sa redistribution.
